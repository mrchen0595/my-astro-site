import { expect, test, type Page } from "@playwright/test";

test.describe("项目筛选和排序", () => {
  const getProjectItem = (page: Page, title: string) =>
    page.locator("[data-project-item]").filter({
      has: page.getByRole("heading", {
        name: title,
        exact: true,
      }),
    });

  const getTechnologySelect = (page: Page) =>
    page.getByRole("combobox", {
      name: "技术",
      exact: true,
    });

  const getSortSelect = (page: Page) =>
    page.getByRole("combobox", {
      name: "排序",
      exact: true,
    });

  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "项目展示",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("显示 3 个项目", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("默认显示全部项目", async ({ page }) => {
    await expect(getProjectItem(page, "Astro 个人网站")).toBeVisible();

    await expect(getProjectItem(page, "关于页面")).toBeVisible();

    await expect(getProjectItem(page, "联系表单")).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "全部",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(getTechnologySelect(page)).toHaveValue("all");

    await expect(getSortSelect(page)).toHaveValue("order");
  });

  test("可以按项目状态筛选", async ({ page }) => {
    await page
      .getByRole("button", {
        name: "已完成",
        exact: true,
      })
      .click();

    await expect(
      page.getByText("显示 1 个项目", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(getProjectItem(page, "关于页面")).toBeVisible();

    await expect(getProjectItem(page, "Astro 个人网站")).toBeHidden();

    await expect(getProjectItem(page, "联系表单")).toBeHidden();

    await expect(
      page.getByRole("button", {
        name: "已完成",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(
      page.getByRole("button", {
        name: "全部",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("可以按技术筛选", async ({ page }) => {
    await getTechnologySelect(page).selectOption("响应式设计");

    await expect(
      page.getByText("显示 1 个项目", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(getProjectItem(page, "关于页面")).toBeVisible();

    await expect(getProjectItem(page, "Astro 个人网站")).toBeHidden();

    await expect(getProjectItem(page, "联系表单")).toBeHidden();

    await expect(getTechnologySelect(page)).toHaveValue("响应式设计");
  });

  test("状态和技术可以组合筛选", async ({ page }) => {
    await page
      .getByRole("button", {
        name: "已完成",
        exact: true,
      })
      .click();

    await getTechnologySelect(page).selectOption("响应式设计");

    await expect(
      page.getByText("显示 1 个项目", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(getProjectItem(page, "关于页面")).toBeVisible();

    await expect(getProjectItem(page, "Astro 个人网站")).toBeHidden();

    await expect(getProjectItem(page, "联系表单")).toBeHidden();
  });

  test("没有符合条件的项目时显示空状态", async ({ page }) => {
    await page
      .getByRole("button", {
        name: "已完成",
        exact: true,
      })
      .click();

    await getTechnologySelect(page).selectOption("JavaScript");

    await expect(
      page.getByText("显示 0 个项目", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "没有找到符合条件的项目",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("尝试更换项目状态或技术筛选条件。", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(getProjectItem(page, "Astro 个人网站")).toBeHidden();

    await expect(getProjectItem(page, "关于页面")).toBeHidden();

    await expect(getProjectItem(page, "联系表单")).toBeHidden();
  });

  test("可以按名称排序并恢复默认顺序", async ({ page }) => {
    const items = page.locator("[data-project-item]");

    const originalTitles = await items.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-title") ?? ""),
    );

    const expectedTitles = [...originalTitles].sort((a, b) =>
      a.localeCompare(b, "zh-CN"),
    );

    await getSortSelect(page).selectOption("title");

    await expect(getSortSelect(page)).toHaveValue("title");

    const sortedTitles = await items.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-title") ?? ""),
    );

    expect(sortedTitles).toEqual(expectedTitles);

    await getSortSelect(page).selectOption("order");

    await expect(getSortSelect(page)).toHaveValue("order");

    const restoredOrders = await items.evaluateAll((elements) =>
      elements.map((element) => Number(element.getAttribute("data-order"))),
    );

    expect(restoredOrders).toEqual([1, 2, 3]);
  });

  test("重置筛选恢复默认状态", async ({ page }) => {
    await page
      .getByRole("button", {
        name: "已完成",
        exact: true,
      })
      .click();

    await getTechnologySelect(page).selectOption("JavaScript");

    await getSortSelect(page).selectOption("title");

    await expect(
      page.getByText("显示 0 个项目", {
        exact: true,
      }),
    ).toBeVisible();

    await page
      .getByRole("button", {
        name: "重置筛选",
        exact: true,
      })
      .click();

    await expect(
      page.getByText("显示 3 个项目", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "全部",
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(getTechnologySelect(page)).toHaveValue("all");

    await expect(getSortSelect(page)).toHaveValue("order");

    await expect(getProjectItem(page, "Astro 个人网站")).toBeVisible();

    await expect(getProjectItem(page, "关于页面")).toBeVisible();

    await expect(getProjectItem(page, "联系表单")).toBeVisible();
  });
});
