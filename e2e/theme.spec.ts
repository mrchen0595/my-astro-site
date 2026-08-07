import { expect, test } from "@playwright/test";

test("主题可以切换并跨页面保存", async ({ page }) => {
  await page.emulateMedia({
    colorScheme: "light",
  });

  await page.goto("/");

  const root = page.locator("html");

  const toggle = page.locator("[data-theme-toggle]");

  await expect(toggle).toBeVisible();

  await expect(root).toHaveAttribute("data-theme-preference", "system");

  // 系统 → 浅色
  await toggle.click();

  await expect(root).toHaveAttribute("data-theme-preference", "light");

  await expect(root).toHaveAttribute("data-theme", "light");

  // 浅色 → 深色
  await toggle.click();

  await expect(root).toHaveAttribute("data-theme-preference", "dark");

  await expect(root).toHaveAttribute("data-theme", "dark");

  const savedTheme = await page.evaluate(() =>
    localStorage.getItem("william-site-theme"),
  );

  expect(savedTheme).toBe("dark");

  await page.reload();

  await expect(root).toHaveAttribute("data-theme", "dark");

  await page.goto("/blog");

  await expect(root).toHaveAttribute("data-theme", "dark");
});
