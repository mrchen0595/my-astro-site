import { expect, test } from "@playwright/test";

test("不存在的页面显示自定义 404", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");

  expect(response?.status()).toBe(404);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "这个页面不存在",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", {
      name: "返回首页",
      exact: true,
    }),
  ).toBeVisible();
});
