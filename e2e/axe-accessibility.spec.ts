import { expect, test, type Page } from "@playwright/test";

import AxeBuilder from "@axe-core/playwright";

interface AxePage {
  path: string;
  name: string;
}

const axePages: AxePage[] = [
  {
    path: "/",
    name: "首页",
  },

  {
    path: "/about",
    name: "关于",
  },

  {
    path: "/contact",
    name: "联系",
  },

  {
    path: "/projects",
    name: "项目列表",
  },

  {
    path: "/blog",
    name: "博客列表",
  },

  {
    path: "/search",
    name: "搜索",
  },

  {
    path: "/projects/astro-site",
    name: "项目详情",
  },
];

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) =>
          [
            `目标：${node.target.join(" ")}`,

            `HTML：${node.html}`,

            `说明：${node.failureSummary ?? ""}`,
          ].join("\n"),
        )
        .join("\n\n");

      return [
        `${violation.id}: ${violation.help}`,

        `影响级别：${violation.impact ?? "unknown"}`,

        nodes,
      ].join("\n");
    })
    .join("\n\n--------------------\n\n");
}

async function runAxe(page: Page) {
  /*
   * Astro Dev Toolbar 不属于生产网站，
   * 而且之前已经证明它会干扰
   * Heading 等 Accessibility 测试。
   *
   * 因此 axe 扫描时显式排除。
   */
  return new AxeBuilder({
    page,
  })
    .exclude("astro-dev-toolbar")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
}

async function expectNoAxeViolations(page: Page, pageName: string) {
  const results = await runAxe(page);

  expect(
    results.violations,
    [
      `${pageName} 存在 axe Accessibility violations。`,
      "",
      formatViolations(results.violations),
    ].join("\n"),
  ).toEqual([]);
}

test.describe("axe Accessibility Audit", () => {
  for (const axePage of axePages) {
    test(`${axePage.name}没有自动检测到的 WCAG A/AA 问题`, async ({ page }) => {
      await page.goto(axePage.path);

      await expectNoAxeViolations(page, axePage.name);
    });
  }

  test("博客详情页没有自动检测到的 WCAG A/AA 问题", async ({ page }) => {
    await page.goto("/blog");

    const firstPost = page.locator("[data-blog-item]").first();

    const articleLink = firstPost
      .getByRole("heading", {
        level: 2,
      })
      .getByRole("link");

    const href = await articleLink.getAttribute("href");

    expect(href).toBeTruthy();

    await page.goto(href!);

    await expect(page).toHaveURL(/\/blog\/[^/]+\/?$/);

    await expectNoAxeViolations(page, "博客详情页");
  });

  test("联系表单错误状态没有自动检测到的 Accessibility 问题", async ({
    page,
  }) => {
    await page.goto("/contact");

    await page
      .getByRole("button", {
        name: "提交表单",
      })
      .click();

    await expect(
      page.getByText("请输入姓名。", {
        exact: true,
      }),
    ).toBeVisible();

    await expectNoAxeViolations(page, "联系表单错误状态");
  });

  test("搜索结果状态没有自动检测到的 Accessibility 问题", async ({ page }) => {
    await page.goto("/search?q=Astro");

    await expect(page.locator("[data-search-result]").first()).toBeVisible();

    await expectNoAxeViolations(page, "搜索结果页面");
  });
});
