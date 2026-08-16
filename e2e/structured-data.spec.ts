import { expect, test, type Page } from "@playwright/test";

import { siteConfig } from "../src/config/site";

type StructuredDataValue = Record<string, any>;

async function getStructuredDataByType(
  page: Page,
  type: string,
): Promise<StructuredDataValue | null> {
  const scripts = page.locator('script[type="application/ld+json"]');

  const count = await scripts.count();

  for (let index = 0; index < count; index += 1) {
    const content = await scripts.nth(index).textContent();

    if (!content) {
      continue;
    }

    let parsed: StructuredDataValue | StructuredDataValue[];

    try {
      parsed = JSON.parse(content);
    } catch {
      /*
       * 某个 JSON-LD script
       * 无法解析时，不影响继续检查
       * 页面中的其他 JSON-LD。
       */
      continue;
    }

    const values = Array.isArray(parsed) ? parsed : [parsed];

    for (const value of values) {
      if (value?.["@type"] === type) {
        return value;
      }

      if (Array.isArray(value?.["@graph"])) {
        const graphValue = value["@graph"].find(
          (item: StructuredDataValue) => item?.["@type"] === type,
        );

        if (graphValue) {
          return graphValue;
        }
      }
    }
  }

  return null;
}

/*
 * 某些页面在完整 E2E 并行运行时，
 * 浏览器可能需要极短时间才能完成
 * 新页面 DOM / JSON-LD 的稳定状态。
 *
 * 因此这里使用 polling，
 * 而不是只读取一次然后立即判定失败。
 */
async function waitForStructuredDataByType(
  page: Page,
  type: string,
): Promise<StructuredDataValue> {
  let result: StructuredDataValue | null = null;

  await expect
    .poll(
      async () => {
        result = await getStructuredDataByType(page, type);

        return result;
      },
      {
        timeout: 5000,

        message: `页面应该输出 ${type} JSON-LD`,
      },
    )
    .not.toBeNull();

  return result!;
}

test.describe("结构化数据", () => {
  test("首页输出 WebSite JSON-LD", async ({ page }) => {
    await page.goto("/");

    const data = await waitForStructuredDataByType(page, "WebSite");

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

  test("博客标签页输出 BreadcrumbList 和可见面包屑", async ({ page }) => {
    await page.goto("/blog/tags/astro");

    const breadcrumb = await waitForStructuredDataByType(
      page,
      "BreadcrumbList",
    );

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
      name: "Astro",
    });

    expect(breadcrumb.itemListElement[2].item).toBeUndefined();

    const visualBreadcrumb = page.getByRole("navigation", {
      name: "面包屑",
    });

    await expect(
      visualBreadcrumb.getByRole("link", {
        name: "首页",
        exact: true,
      }),
    ).toHaveAttribute("href", "/");

    await expect(
      visualBreadcrumb.getByRole("link", {
        name: "博客",
        exact: true,
      }),
    ).toHaveAttribute("href", "/blog");

    await expect(visualBreadcrumb.locator('[aria-current="page"]')).toHaveText(
      "Astro",
    );
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

    const articleHref = await articleLink.getAttribute("href");

    expect(articleTitle).toBeTruthy();

    expect(articleHref).toBeTruthy();

    /*
     * 这个测试的职责是验证
     * Structured Data，
     * 不是测试 Blog 卡片点击行为。
     *
     * 因此直接进入文章 URL，
     * 避免把客户端点击导航时序
     * 引入结构化数据测试。
     */
    await page.goto(articleHref!);

    await expect(page).toHaveURL(/\/blog\/[^/]+\/?$/);

    const blogPosting = await waitForStructuredDataByType(page, "BlogPosting");

    expect(blogPosting.headline).toBe(articleTitle);

    expect(blogPosting.author.name).toBe(siteConfig.author);

    const breadcrumb = await waitForStructuredDataByType(
      page,
      "BreadcrumbList",
    );

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

    const project = await waitForStructuredDataByType(page, "CreativeWork");

    expect(project.name).toBe("Astro 个人网站");

    expect(project.author.name).toBe(siteConfig.author);

    const breadcrumb = await waitForStructuredDataByType(
      page,
      "BreadcrumbList",
    );

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
