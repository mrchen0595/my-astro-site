import { expect, test } from "@playwright/test";

import { siteConfig } from "../src/config/site";

test.describe("结构化数据", () => {
  test("首页输出 WebSite JSON-LD", async ({ page }) => {
    await page.goto("/");

    const script = page.locator('script[type="application/ld+json"]');

    await expect(script).toHaveCount(1);

    const content = await script.textContent();

    expect(content).toBeTruthy();

    const data = JSON.parse(content!);

    expect(data["@context"]).toBe("https://schema.org");

    expect(data["@type"]).toBe("WebSite");

    expect(data.name).toBe(siteConfig.name);

    expect(data.description).toBe(siteConfig.description);

    expect(data.inLanguage).toBe(siteConfig.language);

    expect(data.url).toMatch(/^https?:\/\/.+\/$/);
  });

  test("普通内部页面不会重复输出 WebSite JSON-LD", async ({ page }) => {
    await page.goto("/about");

    await expect(
      page.locator('script[type="application/ld+json"]'),
    ).toHaveCount(0);
  });

  test("博客详情页输出 BlogPosting JSON-LD", async ({ page }) => {
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

    const script = page.locator('script[type="application/ld+json"]');

    await expect(script).toHaveCount(1);

    const content = await script.textContent();

    expect(content).toBeTruthy();

    const data = JSON.parse(content!);

    expect(data["@context"]).toBe("https://schema.org");

    expect(data["@type"]).toBe("BlogPosting");

    expect(data.headline).toBe(articleTitle);

    expect(data.description).toBeTruthy();

    expect(data.url).toMatch(/^https?:\/\/.+\/blog\/[^/]+\/?$/);

    expect(Array.isArray(data.image)).toBe(true);

    expect(data.image).toHaveLength(1);

    expect(data.image[0]).toMatch(/^https?:\/\//);

    expect(Number.isNaN(Date.parse(data.datePublished))).toBe(false);

    expect(data.author).toEqual({
      "@type": "Person",

      name: siteConfig.author,

      url: expect.stringMatching(/^https?:\/\/.+\/about\/?$/),
    });

    expect(data.inLanguage).toBe(siteConfig.language);
  });
});
