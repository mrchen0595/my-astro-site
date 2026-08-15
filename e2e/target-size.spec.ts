import { expect, test, type Locator, type Page } from "@playwright/test";

interface TargetBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const minimumTargetSize = 24;

async function getTargetBox(
  locator: Locator,
  label: string,
): Promise<TargetBox> {
  await expect(locator, `${label} 应该可见`).toBeVisible();

  const box = await locator.boundingBox();

  expect(box, `${label} 应该具有可测量的点击区域`).not.toBeNull();

  return box!;
}

async function expectMinimumTargetSize(
  locator: Locator,
  label: string,
  minimum = minimumTargetSize,
) {
  const box = await getTargetBox(locator, label);

  expect(
    box.width,
    `${label} 宽度过小：${box.width.toFixed(1)}px，最低要求 ${minimum}px`,
  ).toBeGreaterThanOrEqual(minimum);

  expect(
    box.height,
    `${label} 高度过小：${box.height.toFixed(1)}px，最低要求 ${minimum}px`,
  ).toBeGreaterThanOrEqual(minimum);
}

async function expectAllTargetsHaveMinimumSize(
  locator: Locator,
  label: string,
) {
  const count = await locator.count();

  expect(count, `${label} 至少应该存在一个目标`).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expectMinimumTargetSize(locator.nth(index), `${label} #${index + 1}`);
  }
}

async function expectTargetsHaveMinimumCenterSpacing(
  locator: Locator,
  label: string,
  minimum = minimumTargetSize,
) {
  const count = await locator.count();

  if (count < 2) {
    return;
  }

  const boxes: TargetBox[] = [];

  for (let index = 0; index < count; index += 1) {
    boxes.push(
      await getTargetBox(locator.nth(index), `${label} #${index + 1}`),
    );
  }

  for (let firstIndex = 0; firstIndex < boxes.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < boxes.length;
      secondIndex += 1
    ) {
      const first = boxes[firstIndex];

      const second = boxes[secondIndex];

      if (!first || !second) {
        continue;
      }

      const firstCenterX = first.x + first.width / 2;

      const firstCenterY = first.y + first.height / 2;

      const secondCenterX = second.x + second.width / 2;

      const secondCenterY = second.y + second.height / 2;

      const distance = Math.hypot(
        secondCenterX - firstCenterX,

        secondCenterY - firstCenterY,
      );

      /*
       * 如果两个目标本身都已经达到
       * 24 × 24，就不需要依赖 spacing
       * exception。
       */
      const firstIsLargeEnough =
        first.width >= minimum && first.height >= minimum;

      const secondIsLargeEnough =
        second.width >= minimum && second.height >= minimum;

      if (firstIsLargeEnough && secondIsLargeEnough) {
        continue;
      }

      expect(
        distance,
        [
          `${label} 中两个较小目标距离过近。`,
          `中心距离：${distance.toFixed(1)}px`,
          `最低检查值：${minimum}px`,
        ].join(" "),
      ).toBeGreaterThanOrEqual(minimum);
    }
  }
}

async function useMobileViewport(page: Page) {
  await page.setViewportSize({
    width: 390,
    height: 844,
  });
}

test.describe("Target Size", () => {
  test.beforeEach(async ({ page }) => {
    await useMobileViewport(page);
  });

  test("Header 主导航链接具有足够点击区域", async ({ page }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation", {
      name: "主导航",
    });

    const links = navigation.getByRole("link");

    await expectAllTargetsHaveMinimumSize(links, "Header 主导航链接");
  });

  test("Header 按钮具有足够点击区域", async ({ page }) => {
    await page.goto("/");

    const header = page.getByRole("banner");

    const buttons = header.getByRole("button");

    await expectAllTargetsHaveMinimumSize(buttons, "Header 按钮");
  });

  test("首页主要操作具有足够点击区域", async ({ page }) => {
    await page.goto("/");

    await expectMinimumTargetSize(
      page.getByRole("link", {
        name: "查看关于页面",
      }),
      "查看关于页面",
    );

    await expectMinimumTargetSize(
      page.getByRole("button", {
        name: "测试 JavaScript",
      }),
      "测试 JavaScript",
    );
  });

  test("搜索控件具有足够点击区域", async ({ page }) => {
    await page.goto("/search");

    await expectMinimumTargetSize(
      page.getByRole("searchbox", {
        name: "搜索内容",
      }),
      "搜索输入框",
    );

    await expectMinimumTargetSize(
      page.getByRole("combobox", {
        name: "内容类型",
      }),
      "内容类型选择框",
    );
  });

  test("联系表单控件具有足够点击区域", async ({ page }) => {
    await page.goto("/contact");

    const controls = [
      {
        locator: page.getByLabel(/^姓名/),

        label: "姓名输入框",
      },

      {
        locator: page.getByLabel(/^邮箱/),

        label: "邮箱输入框",
      },

      {
        locator: page.getByLabel("主题", {
          exact: true,
        }),

        label: "主题输入框",
      },

      {
        locator: page.getByLabel(/^留言/),

        label: "留言输入框",
      },

      {
        locator: page.getByRole("button", {
          name: "提交表单",
        }),

        label: "提交表单按钮",
      },
    ];

    for (const control of controls) {
      await expectMinimumTargetSize(control.locator, control.label);
    }
  });

  test("项目卡片查看详情链接具有足够点击区域", async ({ page }) => {
    await page.goto("/projects");

    const detailLinks = page.getByRole("link", {
      name: "查看详情",
      exact: true,
    });

    await expectAllTargetsHaveMinimumSize(detailLinks, "项目查看详情链接");
  });

  test("博客标题链接具有足够点击区域", async ({ page }) => {
    await page.goto("/blog");

    const firstPost = page.locator("[data-blog-item]").first();

    const titleLink = firstPost
      .getByRole("heading", {
        level: 2,
      })
      .getByRole("link");

    await expectMinimumTargetSize(titleLink, "博客标题链接");
  });

  test("博客 Breadcrumb 小目标之间具有足够间距", async ({ page }) => {
    await page.goto("/blog");

    const firstPost = page.locator("[data-blog-item]").first();

    const articleLink = firstPost
      .getByRole("heading", {
        level: 2,
      })
      .getByRole("link");

    await articleLink.click();

    await expect(page).toHaveURL(/\/blog\/[^/]+\/?$/);

    const breadcrumb = page.getByRole("navigation", {
      name: "面包屑",
    });

    await expectTargetsHaveMinimumCenterSpacing(
      breadcrumb.getByRole("link"),
      "博客 Breadcrumb",
    );
  });

  test("项目 Breadcrumb 小目标之间具有足够间距", async ({ page }) => {
    await page.goto("/projects/astro-site");

    const breadcrumb = page.getByRole("navigation", {
      name: "面包屑",
    });

    await expectTargetsHaveMinimumCenterSpacing(
      breadcrumb.getByRole("link"),
      "项目 Breadcrumb",
    );
  });
});
