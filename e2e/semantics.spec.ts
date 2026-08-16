import { expect, test, type Page } from "@playwright/test";

interface SemanticPage {
  path: string;

  name: string;
}

const staticPages: SemanticPage[] = [
  {
    path: "/",

    name: "首页",
  },

  {
    path: "/about",

    name: "关于",
  },

  {
    path: "/contact",

    name: "联系",
  },

  {
    path: "/projects",

    name: "项目列表",
  },

  {
    path: "/blog",

    name: "博客列表",
  },

  {
    path: "/search",

    name: "搜索",
  },

  {
    path: "/projects/astro-site",

    name: "项目详情",
  },
];

async function expectLandmarks(page: Page) {
  await expect(page.getByRole("banner")).toHaveCount(1);

  await expect(page.getByRole("main")).toHaveCount(1);

  await expect(page.getByRole("contentinfo")).toHaveCount(1);

  await expect(
    page.getByRole("navigation", {
      name: "主导航",
    }),
  ).toHaveCount(1);

  await expect(
    page.getByRole("navigation", {
      name: "页脚导航",
    }),
  ).toHaveCount(1);
}

async function expectMainStructure(page: Page) {
  const main = page.locator("main#main-content");

  await expect(main).toHaveCount(1);

  await expect(main).toHaveAttribute("tabindex", "-1");
}

async function expectHeadingStructure(page: Page) {
  /*
   * 只检查网站自己的主要内容。
   *
   * 不直接使用：
   *
   * page.locator(
   *   "h1, h2, ..."
   * )
   *
   * 因为 Playwright locator
   * 可以穿透开放 Shadow DOM，
   * Astro Dev Toolbar 中的 heading
   * 也可能被选中。
   */
  const main = page.locator("main#main-content");

  const headings = main.locator("h1, h2, h3, h4, h5, h6");

  const headingCount = await headings.count();

  expect(headingCount, "主要内容至少应该有一个 heading").toBeGreaterThan(0);

  /*
   * 项目约定：
   * 每个主要页面正文只有一个 h1。
   */
  await expect(
    main.locator("h1"),
    "项目约定：每个主要页面只有一个 h1",
  ).toHaveCount(1);

  const headingData = await headings.evaluateAll((elements) =>
    elements.map((element) => ({
      level: Number(element.tagName.substring(1)),

      text: element.textContent?.trim() ?? "",
    })),
  );

  for (const heading of headingData) {
    expect(heading.text, `h${heading.level} 不应该是空标题`).not.toBe("");
  }

  expect(headingData[0]?.level, "主要内容的第一个 heading 应该是 h1").toBe(1);

  for (let index = 1; index < headingData.length; index += 1) {
    const previous = headingData[index - 1];

    const current = headingData[index];

    if (!previous || !current) {
      continue;
    }

    const levelJump = current.level - previous.level;

    expect(
      levelJump,
      [
        "Heading 层级出现跳级：",

        `“${previous.text}”是 h${previous.level}`,

        `“${current.text}”是 h${current.level}`,
      ].join(" "),
    ).toBeLessThanOrEqual(1);
  }
}

async function runSemanticChecks(page: Page) {
  await expectLandmarks(page);

  await expectMainStructure(page);

  await expectHeadingStructure(page);
}

test.describe("页面语义结构", () => {
  for (const semanticPage of staticPages) {
    test(`${semanticPage.name}具有正确的页面结构`, async ({ page }) => {
      await page.goto(semanticPage.path);

      await runSemanticChecks(page);
    });
  }

  test("博客详情页具有正确的页面结构", async ({ page }) => {
    await page.goto("/blog");

    const articleLink = page.getByRole("link", {
      name: "我的 Astro 学习记录",
      exact: true,
    });

    await expect(articleLink).toBeVisible();

    await articleLink.click();

    await expect(page).toHaveURL(/\/blog\/[^/]+\/?$/);

    await runSemanticChecks(page);
  });
});
