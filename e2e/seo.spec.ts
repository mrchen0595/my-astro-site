import { expect, test } from "@playwright/test";

import { pageDescriptions, siteConfig } from "../src/config/site";

import { createPageTitle } from "../src/lib/seo";

test.describe("SEO 元数据", () => {
  test("首页使用统一的网站标题和元数据", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(siteConfig.name);

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      pageDescriptions.home,
    );

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      siteConfig.name,
    );

    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", pageDescriptions.home);

    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      siteConfig.name,
    );

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/$/,
    );
  });

  const staticPages = [
    {
      path: "/about",
      title: "关于",
      description: pageDescriptions.about,
    },

    {
      path: "/contact",
      title: "联系",
      description: pageDescriptions.contact,
    },

    {
      path: "/projects",
      title: "项目",
      description: pageDescriptions.projects,
    },

    {
      path: "/blog",
      title: "博客",
      description: pageDescriptions.blog,
    },

    {
      path: "/search",
      title: "搜索",
      description: pageDescriptions.search,
    },
  ];

  for (const staticPage of staticPages) {
    test(`${staticPage.title}页面使用统一 SEO 元数据`, async ({ page }) => {
      await page.goto(staticPage.path);

      const expectedTitle = createPageTitle(staticPage.title);

      await expect(page).toHaveTitle(expectedTitle);

      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        staticPage.description,
      );

      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        expectedTitle,
      );

      await expect(
        page.locator('meta[property="og:description"]'),
      ).toHaveAttribute("content", staticPage.description);

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${staticPage.path.replace(/\//g, "\\/")}\\/?$`),
      );
    });
  }

  test("带查询参数的搜索页面仍使用统一 canonical", async ({ page }) => {
    await page.goto("/search?q=Astro&type=project");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/search\/?$/,
    );
  });

  test("项目详情页使用项目自己的 SEO 数据", async ({ page }) => {
    await page.goto("/projects/astro-site");

    const expectedTitle = createPageTitle("Astro 个人网站");

    await expect(page).toHaveTitle(expectedTitle);

    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute(
      "content",
      pageDescriptions.projects,
    );

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      expectedTitle,
    );

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/projects\/astro-site\/?$/,
    );
  });

  test("博客标签页使用标签自己的 SEO 数据和 canonical", async ({ page }) => {
    await page.goto("/blog/tags/astro");

    const expectedTitle = createPageTitle("Astro 标签");

    const expectedDescription =
      "查看 William 关于 Astro 的博客文章和前端学习记录。";

    await expect(page).toHaveTitle(expectedTitle);

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      expectedDescription,
    );

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      expectedTitle,
    );

    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", expectedDescription);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/blog\/tags\/astro\/?$/,
    );

    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      /\/blog\/tags\/astro\/?$/,
    );

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "website",
    );
  });
  test("博客详情页使用文章自己的 SEO 数据", async ({ page }) => {
    await page.goto("/blog");

    const articleLink = page.getByRole("link", {
      name: "我的 Astro 学习记录",
      exact: true,
    });

    await expect(articleLink).toBeVisible();

    await articleLink.click();

    await expect(page).toHaveTitle(createPageTitle("我的 Astro 学习记录"));

    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute(
      "content",
      pageDescriptions.blog,
    );

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "article",
    );

    await expect(
      page.locator('meta[property="article:published_time"]'),
    ).toHaveCount(1);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/blog\/[^/]+\/?$/,
    );
  });
});
