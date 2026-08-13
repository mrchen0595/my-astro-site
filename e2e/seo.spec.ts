import { expect, test } from "@playwright/test";

import { siteConfig } from "../src/config/site";

import { createPageTitle } from "../src/lib/seo";

test.describe("SEO 元数据", () => {
  test("首页使用统一的网站标题和基础元数据", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(siteConfig.name);

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "我的第一个本地 Astro 网站",
    );

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      siteConfig.name,
    );

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
    },
    {
      path: "/contact",
      title: "联系",
    },
    {
      path: "/projects",
      title: "项目",
    },
    {
      path: "/blog",
      title: "博客",
    },
  ];

  for (const staticPage of staticPages) {
    test(`${staticPage.title}页面使用统一标题`, async ({ page }) => {
      await page.goto(staticPage.path);

      await expect(page).toHaveTitle(createPageTitle(staticPage.title));

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        new RegExp(`${staticPage.path.replace(/\//g, "\\/")}\\/?$`),
      );

      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        createPageTitle(staticPage.title),
      );
    });
  }

  test("项目详情页使用项目名称生成标题", async ({ page }) => {
    await page.goto("/projects/astro-site");

    const expectedTitle = createPageTitle("Astro 个人网站");

    await expect(page).toHaveTitle(expectedTitle);

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      expectedTitle,
    );

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/projects\/astro-site\/?$/,
    );
  });

  test("博客详情页使用文章标题并输出文章 SEO", async ({ page }) => {
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

    await expect(page).toHaveTitle(createPageTitle(articleTitle!));

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
