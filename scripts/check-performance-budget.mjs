import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const clientDir = path.join(rootDir, "dist", "client");

const KiB = 1024;
const MiB = 1024 * KiB;

const budgets = {
  htmlPerPage: 19 * KiB,
  inlineJsPerPage: 6 * KiB,
  cssPerPage: 15 * KiB,
  externalCssBuild: 28 * KiB,
  referencedImage: 250 * KiB,
};

const warningLimits = {
  emittedAsset: 1 * MiB,
};

if (!fs.existsSync(clientDir)) {
  console.error(
    "FAIL dist/client does not exist. Run `npm run build` before checking the performance budget.",
  );
  process.exit(1);
}

function walkFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, {
    withFileTypes: true,
  })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatKiB(bytes) {
  return `${(bytes / KiB).toFixed(2)} KiB`;
}

function formatMiB(bytes) {
  return `${(bytes / MiB).toFixed(2)} MiB`;
}

function relativeToClient(filePath) {
  return path.relative(clientDir, filePath).split(path.sep).join("/");
}

function assetUrlToFilePath(assetUrl) {
  const relativePath = assetUrl.replace(/^\/+/, "").split("/").join(path.sep);

  return path.join(clientDir, relativePath);
}

function getExecutableJsBytes(html) {
  const scriptPattern =
    /<script\b(?<attrs>[^>]*)>(?<code>[\s\S]*?)<\/script>/gi;

  let bytes = 0;

  for (const match of html.matchAll(scriptPattern)) {
    const attrs = match.groups?.attrs ?? "";
    const code = match.groups?.code ?? "";

    if (/application\/ld\+json/i.test(attrs)) {
      continue;
    }

    bytes += Buffer.byteLength(code, "utf8");
  }

  return bytes;
}

function getInlineCssBytes(html) {
  const stylePattern = /<style\b[^>]*>(?<css>[\s\S]*?)<\/style>/gi;

  let bytes = 0;

  for (const match of html.matchAll(stylePattern)) {
    const css = match.groups?.css ?? "";
    bytes += Buffer.byteLength(css, "utf8");
  }

  return bytes;
}

function getLinkedCssUrls(html) {
  const urls = new Set();

  const pattern = /href=["'](?<url>\/_astro\/[^"']+\.css)["']/gi;

  for (const match of html.matchAll(pattern)) {
    const url = match.groups?.url;

    if (url) {
      urls.add(url);
    }
  }

  return [...urls];
}

function getReferencedImageUrls(html) {
  const urls = new Set();

  const pattern = /\/_astro\/[^"'\s,]+\.(?:webp|jpg|jpeg|png|avif)/gi;

  for (const match of html.matchAll(pattern)) {
    urls.add(match[0]);
  }

  return [...urls];
}

const allFiles = walkFiles(clientDir);

const htmlFiles = allFiles.filter(
  (filePath) => path.extname(filePath).toLowerCase() === ".html",
);

const cssFiles = allFiles.filter(
  (filePath) => path.extname(filePath).toLowerCase() === ".css",
);

const pageResults = [];
const referencedImageUrls = new Set();

for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(htmlFile, "utf8");

  const htmlBytes = fs.statSync(htmlFile).size;
  const inlineJsBytes = getExecutableJsBytes(html);
  const inlineCssBytes = getInlineCssBytes(html);

  let externalCssBytes = 0;

  for (const cssUrl of getLinkedCssUrls(html)) {
    const cssFile = assetUrlToFilePath(cssUrl);

    if (fs.existsSync(cssFile)) {
      externalCssBytes += fs.statSync(cssFile).size;
    }
  }

  for (const imageUrl of getReferencedImageUrls(html)) {
    referencedImageUrls.add(imageUrl);
  }

  pageResults.push({
    page: relativeToClient(htmlFile),
    htmlBytes,
    inlineJsBytes,
    cssBytes: externalCssBytes + inlineCssBytes,
  });
}

function findMaximum(items, property) {
  return items.reduce((largest, current) => {
    if (!largest || current[property] > largest[property]) {
      return current;
    }

    return largest;
  }, null);
}

const maximumHtml = findMaximum(pageResults, "htmlBytes");
const maximumJs = findMaximum(pageResults, "inlineJsBytes");
const maximumCss = findMaximum(pageResults, "cssBytes");

const totalExternalCssBytes = cssFiles.reduce(
  (total, filePath) => total + fs.statSync(filePath).size,
  0,
);

let largestReferencedImage = null;

for (const imageUrl of referencedImageUrls) {
  const imageFile = assetUrlToFilePath(imageUrl);

  if (!fs.existsSync(imageFile)) {
    continue;
  }

  const bytes = fs.statSync(imageFile).size;

  if (!largestReferencedImage || bytes > largestReferencedImage.bytes) {
    largestReferencedImage = {
      url: imageUrl,
      bytes,
    };
  }
}

const failures = [];
const warnings = [];

function checkPageBudget({ label, result, property, limit }) {
  if (!result) {
    return;
  }

  const actual = result[property];

  if (actual > limit) {
    failures.push(
      `${label}: ${formatKiB(actual)} > ${formatKiB(limit)} (${result.page})`,
    );
  }
}

checkPageBudget({
  label: "HTML per page",
  result: maximumHtml,
  property: "htmlBytes",
  limit: budgets.htmlPerPage,
});

checkPageBudget({
  label: "Executable inline JS per page",
  result: maximumJs,
  property: "inlineJsBytes",
  limit: budgets.inlineJsPerPage,
});

checkPageBudget({
  label: "CSS per page",
  result: maximumCss,
  property: "cssBytes",
  limit: budgets.cssPerPage,
});

if (totalExternalCssBytes > budgets.externalCssBuild) {
  failures.push(
    `External CSS per build: ${formatKiB(totalExternalCssBytes)} > ${formatKiB(budgets.externalCssBuild)}`,
  );
}

if (
  largestReferencedImage &&
  largestReferencedImage.bytes > budgets.referencedImage
) {
  failures.push(
    `Referenced image: ${formatKiB(largestReferencedImage.bytes)} > ${formatKiB(budgets.referencedImage)} (${largestReferencedImage.url})`,
  );
}

for (const filePath of allFiles) {
  const bytes = fs.statSync(filePath).size;

  if (bytes > warningLimits.emittedAsset) {
    warnings.push(
      `Large emitted asset: ${formatMiB(bytes)} (${relativeToClient(filePath)})`,
    );
  }
}

console.log("");
console.log("Performance budget report");
console.log("=========================");
console.log("");

console.log(
  `${maximumHtml.htmlBytes <= budgets.htmlPerPage ? "PASS" : "FAIL"} HTML / page: ${formatKiB(maximumHtml.htmlBytes)} / ${formatKiB(budgets.htmlPerPage)} (${maximumHtml.page})`,
);

console.log(
  `${maximumJs.inlineJsBytes <= budgets.inlineJsPerPage ? "PASS" : "FAIL"} Executable JS / page: ${formatKiB(maximumJs.inlineJsBytes)} / ${formatKiB(budgets.inlineJsPerPage)} (${maximumJs.page})`,
);

console.log(
  `${maximumCss.cssBytes <= budgets.cssPerPage ? "PASS" : "FAIL"} CSS / page: ${formatKiB(maximumCss.cssBytes)} / ${formatKiB(budgets.cssPerPage)} (${maximumCss.page})`,
);

console.log(
  `${totalExternalCssBytes <= budgets.externalCssBuild ? "PASS" : "FAIL"} External CSS / build: ${formatKiB(totalExternalCssBytes)} / ${formatKiB(budgets.externalCssBuild)}`,
);

if (largestReferencedImage) {
  console.log(
    `${largestReferencedImage.bytes <= budgets.referencedImage ? "PASS" : "FAIL"} Referenced image: ${formatKiB(largestReferencedImage.bytes)} / ${formatKiB(budgets.referencedImage)} (${largestReferencedImage.url})`,
  );
} else {
  console.log("PASS Referenced image: none found");
}

if (warnings.length > 0) {
  console.log("");
  console.log("Warnings");
  console.log("--------");

  for (const warning of warnings) {
    console.log(`WARN ${warning}`);
  }
}

if (failures.length > 0) {
  console.log("");
  console.log("Failures");
  console.log("--------");

  for (const failure of failures) {
    console.log(`FAIL ${failure}`);
  }

  console.log("");

  console.error(
    `Performance budget failed with ${failures.length} violation(s).`,
  );

  process.exit(1);
}

console.log("");
console.log("Performance budget passed.");

process.exit(0);
