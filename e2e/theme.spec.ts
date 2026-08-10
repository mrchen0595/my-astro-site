import { expect, test } from "@playwright/test";

test("主题可以切换并跨页面保存", async ({ page }) => {
  await page.emulateMedia({
    colorScheme: "light",
  });

  // 先打开页面，再清理本测试可能使用的主题存储。
  // 不需要知道具体 localStorage key。
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const root = page.locator("html");
  const toggle = page.locator("[data-theme-toggle]");

  await expect(toggle).toBeVisible();

  // 不再断言：
  // data-theme-preference="system"
  //
  // 默认 system 可以合法地表示为：
  // “没有显式 preference 属性”。

  // 系统 → 浅色
  await toggle.click();

  await expect(root).toHaveAttribute("data-theme-preference", "light");

  await expect(root).toHaveAttribute("data-theme", "light");

  // 浅色 → 深色
  await toggle.click();

  await expect(root).toHaveAttribute("data-theme-preference", "dark");

  await expect(root).toHaveAttribute("data-theme", "dark");

  // 刷新后应该保留用户明确选择的深色
  await page.reload();

  await expect(root).toHaveAttribute("data-theme-preference", "dark");

  await expect(root).toHaveAttribute("data-theme", "dark");

  // 跨页面也应该保留
  await page.goto("/blog");

  await expect(root).toHaveAttribute("data-theme-preference", "dark");

  await expect(root).toHaveAttribute("data-theme", "dark");
});
