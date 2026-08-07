import { expect, test } from "@playwright/test";

test.describe("主要页面和导航", () => {
  test("导航可以打开所有主要页面", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
      }),
    ).toContainText("从零开始");

    const pages = [
      {
        link: "项目",
        url: /\/projects\/?$/,
        heading: "项目展示",
      },
      {
        link: "博客",
        url: /\/blog\/?$/,
        heading: "博客文章",
      },
      {
        link: "联系",
        url: /\/contact\/?$/,
        heading: "保持联系",
      },
      {
        link: "关于",
        url: /\/about\/?$/,
        heading: "关于这个网站",
      },
    ];

    for (const item of pages) {
      const mainNav = page.getByRole("navigation", {
        name: "主导航",
      });

      const link = mainNav.getByRole("link", {
        name: item.link,
        exact: true,
      });

      await link.click();

      await expect(page).toHaveURL(item.url);

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: item.heading,
        }),
      ).toBeVisible();

      await expect(link).toHaveAttribute("aria-current", "page");
    }

    const mainNav = page.getByRole("navigation", {
      name: "主导航",
    });

    await mainNav
      .getByRole("link", {
        name: "首页",
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(/\/$/);

    await expect(
      page.getByRole("heading", {
        level: 1,
      }),
    ).toContainText("从零开始");
  });

  test("项目页面显示项目卡片", async ({ page }) => {
    await page.goto("/projects");

    await expect(page.getByRole("article")).toHaveCount(3);

    await expect(
      page.getByRole("heading", {
        name: "Astro 个人网站",
      }),
    ).toBeVisible();

    await expect(
      page.getByText("暂未开放", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("页脚导航正常显示", async ({ page }) => {
    await page.goto("/");

    const footerNav = page.getByRole("navigation", {
      name: "页脚导航",
    });

    await expect(footerNav).toBeVisible();

    await expect(
      footerNav.getByRole("link", {
        name: "首页",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      footerNav.getByRole("link", {
        name: "项目",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      footerNav.getByRole("link", {
        name: "博客",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      footerNav.getByRole("link", {
        name: "关于",
        exact: true,
      }),
    ).toBeVisible();
  });
});
