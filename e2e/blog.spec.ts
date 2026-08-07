import { expect, test } from "@playwright/test";

test("博客可以搜索、筛选并恢复 URL 状态", async ({ page }) => {
  await page.goto("/blog");

  const search = page.getByLabel("搜索文章");

  const firstPost = page.getByRole("heading", {
    name: "我的 Astro 学习记录",
  });

  const componentPost = page.getByRole("heading", {
    name: "为什么网页需要组件化",
  });

  await expect(firstPost).toBeVisible();
  await expect(componentPost).toBeVisible();

  await search.fill("组件化");

  await expect(
    page.getByText("显示 1 篇文章", {
      exact: true,
    }),
  ).toBeVisible();

  await expect(componentPost).toBeVisible();

  await expect(firstPost).toBeHidden();

  expect(new URL(page.url()).searchParams.get("q")).toBe("组件化");

  await page
    .getByRole("button", {
      name: "清空",
    })
    .click();

  await expect(firstPost).toBeVisible();

  const architectureTag = page.locator('[data-tag="前端架构"]');

  await architectureTag.click();

  await expect(componentPost).toBeVisible();

  await expect(firstPost).toBeHidden();

  await expect(architectureTag).toHaveAttribute("aria-pressed", "true");

  expect(new URL(page.url()).searchParams.get("tag")).toBe("前端架构");

  await page.reload();

  await expect(architectureTag).toHaveAttribute("aria-pressed", "true");

  await expect(componentPost).toBeVisible();

  await expect(firstPost).toBeHidden();
});
