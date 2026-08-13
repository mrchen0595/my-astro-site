import { expect, test, type Page } from "@playwright/test";

import { siteConfig } from "../src/config/site";

async function getStructuredDataByType(page: Page, type: string) {
  const scripts = page.locator('script[type="application/ld+json"]');

  const count = await scripts.count();

  for (let index = 0; index < count; index += 1) {
    const content = await scripts.nth(index).textContent();

    if (!content) {
      continue;
    }

    const parsed = JSON.parse(content);

    const values = Array.isArray(parsed) ? parsed : [parsed];

    for (const value of values) {
      if (value?.["@type"] === type) {
        return value;
      }

      if (Array.isArray(value?.["@graph"])) {
        const graphValue = value["@graph"].find(
          (item: Record<string, unknown>) => item["@type"] === type,
        );

        if (graphValue) {
          return graphValue;
        }
      }
    }
  }

  return null;
}

test.describe("结构化数据", () => {
  test("首页输出 WebSite JSON-LD", async ({ page }) => {
    await page.goto("/");

    const data = await getStructuredDataByType(page, "WebSite");

    expect(data).not.toBeNull();

    expect(data.name).toBe(siteConfig.name);

    expect(data.description).toBe(siteConfig.description);

    expect(data.inLanguage).toBe(siteConfig.language);

    expect(data.url).toMatch(/^https?:\/\/.+\/$/);
  });

  test("普通内部页面不会重复输出 WebSite JSON-LD", async ({ page }) => {
    await page.goto("/about");

    const data = await getStructuredDataByType(page, "WebSite");

    expect(data).toBeNull();
  });

  test("博客详情页输出 BlogPosting 和 BreadcrumbList", async ({ page }) => {
    await page.goto("/blog");

    const firstPost = page.locator("[data-blog-item]").first();

    const articleLink = firstPost
      .getByRole("heading", {
        level: 2,
      })
      .getByRole("link");

    const articleTitle = (await articleLink.textContent())?.trim();

    expect(articleTitle).toBeTruthy();

    await articleLink.click();

    const blogPosting = await getStructuredDataByType(page, "BlogPosting");

    expect(blogPosting).not.toBeNull();

    expect(blogPosting.headline).toBe(articleTitle);

    expect(blogPosting.author.name).toBe(siteConfig.author);

    const breadcrumb = await getStructuredDataByType(page, "BreadcrumbList");

    expect(breadcrumb).not.toBeNull();

    expect(breadcrumb.itemListElement).toHaveLength(3);

    expect(breadcrumb.itemListElement[0]).toMatchObject({
      "@type": "ListItem",

      position: 1,

      name: "首页",
    });

    expect(breadcrumb.itemListElement[1]).toMatchObject({
      "@type": "ListItem",

      position: 2,

      name: "博客",
    });

    expect(breadcrumb.itemListElement[2]).toMatchObject({
      "@type": "ListItem",

      position: 3,

      name: articleTitle,
    });

    expect(breadcrumb.itemListElement[0].item).toMatch(/^https?:\/\/.+\/$/);

    expect(breadcrumb.itemListElement[1].item).toMatch(
      /^https?:\/\/.+\/blog\/?$/,
    );

    expect(breadcrumb.itemListElement[2].item).toBeUndefined();

    const visualBreadcrumb = page.getByRole("navigation", {
      name: "面包屑",
    });

    await expect(
      visualBreadcrumb.getByRole("link", {
        name: "首页",
      }),
    ).toHaveAttribute("href", "/");

    await expect(
      visualBreadcrumb.getByRole("link", {
        name: "博客",
      }),
    ).toHaveAttribute("href", "/blog");

    await expect(visualBreadcrumb.locator('[aria-current="page"]')).toHaveText(
      articleTitle!,
    );
  });

  test("项目详情页输出 CreativeWork 和 BreadcrumbList", async ({ page }) => {
    await page.goto("/projects/astro-site");

    const project = await getStructuredDataByType(page, "CreativeWork");

    expect(project).not.toBeNull();

    expect(project.name).toBe("Astro 个人网站");

    expect(project.author.name).toBe(siteConfig.author);

    const breadcrumb = await getStructuredDataByType(page, "BreadcrumbList");

    expect(breadcrumb).not.toBeNull();

    expect(breadcrumb.itemListElement).toHaveLength(3);

    expect(breadcrumb.itemListElement[0]).toMatchObject({
      position: 1,
      name: "首页",
    });

    expect(breadcrumb.itemListElement[1]).toMatchObject({
      position: 2,
      name: "项目",
    });

    expect(breadcrumb.itemListElement[2]).toMatchObject({
      position: 3,
      name: "Astro 个人网站",
    });

    expect(breadcrumb.itemListElement[2].item).toBeUndefined();

    const visualBreadcrumb = page.getByRole("navigation", {
      name: "面包屑",
    });

    await expect(
      visualBreadcrumb.getByRole("link", {
        name: "首页",
      }),
    ).toHaveAttribute("href", "/");

    await expect(
      visualBreadcrumb.getByRole("link", {
        name: "项目",
      }),
    ).toHaveAttribute("href", "/projects");

    await expect(visualBreadcrumb.locator('[aria-current="page"]')).toHaveText(
      "Astro 个人网站",
    );
  });
});
