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

    const websiteScripts = page.locator('script[type="application/ld+json"]');

    await expect(websiteScripts).toHaveCount(0);
  });
});
