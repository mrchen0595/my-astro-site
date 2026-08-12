import { expect, test } from "@playwright/test";

test.describe("项目列表和详情页", () => {
  const projects = [
    {
      title: "Astro 个人网站",

      detailUrl: "/projects/astro-site",

      projectUrl: "/",

      status: "已上线",
    },

    {
      title: "关于页面",

      detailUrl: "/projects/about-page",

      projectUrl: "/about",

      status: "已完成",
    },

    {
      title: "联系表单",

      detailUrl: "/projects/contact-form",

      projectUrl: null,

      status: "规划中",
    },
  ];

  test("项目列表显示全部项目", async ({ page }) => {
    await page.goto("/projects");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "项目展示",
      }),
    ).toBeVisible();

    await expect(page.getByRole("article")).toHaveCount(3);

    for (const project of projects) {
      await expect(
        page.getByRole("heading", {
          name: project.title,
        }),
      ).toBeVisible();
    }
  });

  for (const project of projects) {
    test(`${project.title} 可以进入详情页`, async ({ page }) => {
      await page.goto("/projects");

      const card = page.getByRole("article").filter({
        has: page.getByRole("heading", {
          name: project.title,
        }),
      });

      await expect(card).toBeVisible();

      await card
        .getByRole("link", {
          name: "查看详情",
          exact: true,
        })
        .click();

      await expect(page).toHaveURL(
        new RegExp(`${project.detailUrl.replace(/\//g, "\\/")}\\/?$`),
      );

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: project.title,
        }),
      ).toBeVisible();

      await expect(
        page
          .getByText(project.status, {
            exact: true,
          })
          .first(),
      ).toBeVisible();

      await expect(
        page.getByRole("link", {
          name: /返回项目列表/,
        }),
      ).toBeVisible();
    });
  }

  test("项目详情页可以返回项目列表", async ({ page }) => {
    await page.goto("/projects/astro-site");

    await page
      .getByRole("link", {
        name: /返回项目列表/,
      })
      .click();

    await expect(page).toHaveURL(/\/projects\/?$/);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "项目展示",
      }),
    ).toBeVisible();
  });

  test("已开放项目显示打开项目链接", async ({ page }) => {
    await page.goto("/projects/astro-site");

    const openProject = page.getByRole("link", {
      name: "打开项目",
      exact: true,
    });

    await expect(openProject).toHaveAttribute("href", "/");

    await page.goto("/projects/about-page");

    await expect(
      page.getByRole("link", {
        name: "打开项目",
        exact: true,
      }),
    ).toHaveAttribute("href", "/about");
  });

  test("未开放项目显示不可用状态", async ({ page }) => {
    await page.goto("/projects/contact-form");

    await expect(
      page.getByText("当前项目暂未开放。", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "打开项目",
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("三个项目详情路由都真实存在", async ({ request }) => {
    for (const project of projects) {
      const response = await request.get(project.detailUrl);

      expect(response.status(), `${project.detailUrl} 应返回 200`).toBe(200);
    }
  });
});
