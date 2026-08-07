import { expect, test } from "@playwright/test";

test.describe("联系表单", () => {
  test("空表单会显示校验错误", async ({ page }) => {
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

    await expect(
      page.getByText("请输入邮箱地址。", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("请输入留言内容。", {
        exact: true,
      }),
    ).toBeVisible();

    await expect(page.getByRole("status")).toContainText("表单中还有错误");
  });

  test("合法表单可以完成模拟提交", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      const request = route.request();

      expect(request.method()).toBe("POST");

      const payload = request.postDataJSON() as Record<string, unknown>;

      expect(payload).toMatchObject({
        name: "William",
        email: "william@example.com",
        subject: "自动化测试",
        message: "这是一条用于端到端测试的完整留言内容。",
      });

      await route.fulfill({
        status: 200,

        json: {
          ok: true,
          message: "测试留言已接收。",
        },
      });
    });

    await page.goto("/contact");

    await page.getByLabel(/^姓名/).fill("William");

    await page.getByLabel(/^邮箱/).fill("william@example.com");

    await page
      .getByLabel("主题", {
        exact: true,
      })
      .fill("自动化测试");

    await page
      .getByLabel(/^留言/)
      .fill("这是一条用于端到端测试的完整留言内容。");

    await page
      .getByRole("button", {
        name: "提交表单",
      })
      .click();

    await expect(page.getByRole("status")).toHaveText("测试留言已接收。");

    await expect(page.getByLabel(/^姓名/)).toHaveValue("");

    await expect(page.getByLabel(/^邮箱/)).toHaveValue("");
  });
});
