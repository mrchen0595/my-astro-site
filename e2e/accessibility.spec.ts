import { expect, test } from "@playwright/test";

test.describe("Accessibility 基础导航", () => {
  test("页面提供跳到主要内容链接", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", {
      name: "跳到主要内容",
    });

    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("Skip Link 是第一个键盘焦点", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", {
      name: "跳到主要内容",
    });

    await expect(skipLink).toBeFocused();

    await expect(skipLink).toBeVisible();
  });

  test("使用 Skip Link 可以进入主要内容", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    await page.keyboard.press("Enter");

    const main = page.locator("#main-content");

    await expect(main).toBeFocused();
  });

  const pages = ["/", "/about", "/contact", "/projects", "/blog", "/search"];

  for (const path of pages) {
    test(`${path} 只有一个主要内容目标`, async ({ page }) => {
      await page.goto(path);

      await expect(page.locator("#main-content")).toHaveCount(1);

      await expect(page.locator("main#main-content")).toHaveAttribute(
        "tabindex",
        "-1",
      );
    });
  }
});
