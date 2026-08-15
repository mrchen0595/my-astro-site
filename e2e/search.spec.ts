import { expect, test } from "@playwright/test";

test.describe("站内搜索", () => {
  test("搜索页面可以正常打开", async ({ page }) => {
    await page.goto("/search");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "站内搜索",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("searchbox", {
        name: "搜索内容",
      }),
    ).toBeVisible();
  });

  test("可以搜索 Astro 内容", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("searchbox", {
      name: "搜索内容",
    });

    await input.fill("Astro");

    const results = page.locator("[data-search-result]");

    await expect(results.first()).toBeVisible();

    await expect(results).not.toHaveCount(0);
  });

  test("可以找到 Astro 个人网站项目", async ({ page }) => {
    await page.goto("/search");

    await page
      .getByRole("searchbox", {
        name: "搜索内容",
      })
      .fill("Astro 个人网站");

    const project = page
      .locator('[data-search-result][data-type="project"]')
      .filter({
        hasText: "Astro 个人网站",
      });

    await expect(project).toHaveCount(1);
  });

  test("可以按项目类型过滤", async ({ page }) => {
    await page.goto("/search");

    await page
      .getByRole("searchbox", {
        name: "搜索内容",
      })
      .fill("Astro");

    await page
      .getByRole("combobox", {
        name: "内容类型",
      })
      .selectOption("project");

    await expect(
      page.locator('[data-search-result]:not([data-type="project"])'),
    ).toHaveCount(0);

    await expect(
      page.locator('[data-search-result][data-type="project"]'),
    ).not.toHaveCount(0);
  });

  test("没有匹配内容时显示空状态", async ({ page }) => {
    await page.goto("/search");

    await page
      .getByRole("searchbox", {
        name: "搜索内容",
      })
      .fill("zzzz-no-result-12345");

    await expect(page.getByText("没有找到结果")).toBeVisible();

    await expect(page.locator("[data-search-result]")).toHaveCount(0);
  });

  test("URL 查询参数可以恢复搜索状态", async ({ page }) => {
    await page.goto("/search?q=Astro&type=project");

    await expect(
      page.getByRole("searchbox", {
        name: "搜索内容",
      }),
    ).toHaveValue("Astro");

    await expect(
      page.getByRole("combobox", {
        name: "内容类型",
      }),
    ).toHaveValue("project");

    await expect(
      page.locator('[data-search-result]:not([data-type="project"])'),
    ).toHaveCount(0);
  });
});
