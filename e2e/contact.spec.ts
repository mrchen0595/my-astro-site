import { expect, test } from "@playwright/test";

test.describe("联系表单", () => {
  test("表单字段具有正确的标签和必填语义", async ({ page }) => {
    await page.goto("/contact");

    const name = page.getByLabel(/^姓名/);

    const email = page.getByLabel(/^邮箱/);

    const message = page.getByLabel(/^留言/, {
      exact: true,
    });

    await expect(name).toHaveAttribute("required", "");

    await expect(email).toHaveAttribute("required", "");

    await expect(message).toHaveAttribute("required", "");

    await expect(
      page.getByText("表示必填项。", {
        exact: false,
      }),
    ).toBeVisible();
  });

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

  test("提交失败时第一个错误字段获得焦点", async ({ page }) => {
    await page.goto("/contact");

    await page
      .getByRole("button", {
        name: "提交表单",
      })
      .click();

    const name = page.getByLabel(/^姓名/);

    await expect(name).toBeFocused();

    await expect(name).toHaveAttribute("aria-invalid", "true");

    await expect(name).toHaveAttribute(
      "aria-describedby",
      "contact-name-error",
    );
  });

  test("无效邮箱会关联错误提示", async ({ page }) => {
    await page.goto("/contact");

    const email = page.getByLabel(/^邮箱/);

    await email.fill("invalid-email");

    await email.blur();

    await expect(email).toHaveAttribute("aria-invalid", "true");

    await expect(page.locator("#contact-email-error")).toHaveText(
      "请输入有效的邮箱地址。",
    );

    await expect(email).toHaveAttribute(
      "aria-describedby",
      "contact-email-error",
    );
  });

  test("修正错误后会清除无效状态", async ({ page }) => {
    await page.goto("/contact");

    const email = page.getByLabel(/^邮箱/);

    await email.fill("invalid-email");

    await email.blur();

    await expect(email).toHaveAttribute("aria-invalid", "true");

    await email.fill("william@example.com");

    await expect(email).toHaveAttribute("aria-invalid", "false");

    await expect(page.locator("#contact-email-error")).toHaveText("");
  });

  test("留言字段同时关联帮助和错误信息", async ({ page }) => {
    await page.goto("/contact");

    const message = page.getByLabel(/^留言/, {
      exact: true,
    });

    await expect(message).toHaveAttribute(
      "aria-describedby",
      "contact-message-error contact-message-help",
    );

    await expect(page.locator("#contact-message-help")).toHaveText(
      "至少输入 10 个字符。",
    );
  });

  test("留言字符数会实时更新", async ({ page }) => {
    await page.goto("/contact");

    const message = page.getByLabel(/^留言/, {
      exact: true,
    });

    await message.fill("1234567890");

    await expect(page.locator("#message-count")).toHaveText("10");
  });

  test("提交过于频繁时显示明确提示并保留表单内容", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "text/plain",
        body: "Too Many Requests",
      });
    });

    await page.goto("/contact");

    const name = page.getByLabel(/^姓名/);
    const email = page.getByLabel(/^邮箱/);
    const subject = page.getByLabel("主题", {
      exact: true,
    });
    const message = page.getByLabel(/^留言/, {
      exact: true,
    });
    const submitButton = page.getByRole("button", {
      name: "提交表单",
    });

    await name.fill("William");
    await email.fill("william@example.com");
    await subject.fill("限流测试");
    await message.fill("这是一条用于验证限流提示的完整留言内容。");

    await submitButton.click();

    console.table([
      {
        field: "name",
        value: await name.inputValue(),
        ariaInvalid: await name.getAttribute("aria-invalid"),
        error: await page.locator("#contact-name-error").textContent(),
      },
      {
        field: "email",
        value: await email.inputValue(),
        ariaInvalid: await email.getAttribute("aria-invalid"),
        error: await page.locator("#contact-email-error").textContent(),
      },
      {
        field: "message",
        value: await message.inputValue(),
        ariaInvalid: await message.getAttribute("aria-invalid"),
        error: await page.locator("#contact-message-error").textContent(),
      },
    ]);

    console.log("form status:", await page.getByRole("status").textContent());
    await expect(page.getByRole("status")).toHaveText(
      "提交过于频繁，请稍后再试。",
    );

    await expect(name).toHaveValue("William");
    await expect(email).toHaveValue("william@example.com");
    await expect(subject).toHaveValue("限流测试");
    await expect(message).toHaveValue(
      "这是一条用于验证限流提示的完整留言内容。",
    );

    await expect(submitButton).toBeEnabled();

    await expect(page.locator("#contact-form")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

  test("服务器返回 JSON 错误时显示服务器提示并保留表单内容", async ({
    page,
  }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 503,
        json: {
          ok: false,
          message: "留言暂时无法保存，请稍后再试。",
        },
      });
    });

    await page.goto("/contact");

    const name = page.getByLabel(/^姓名/);
    const email = page.getByLabel(/^邮箱/);
    const message = page.getByLabel(/^留言/, {
      exact: true,
    });
    const submitButton = page.getByRole("button", {
      name: "提交表单",
    });

    await name.fill("William");
    await email.fill("william@example.com");
    await message.fill("这是一条用于验证服务器错误提示的完整留言内容。");

    await submitButton.click();

    await expect(page.getByRole("status")).toHaveText(
      "留言暂时无法保存，请稍后再试。",
    );

    await expect(name).toHaveValue("William");
    await expect(email).toHaveValue("william@example.com");
    await expect(message).toHaveValue(
      "这是一条用于验证服务器错误提示的完整留言内容。",
    );

    await expect(submitButton).toBeEnabled();

    await expect(page.locator("#contact-form")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

  test("服务器返回非 JSON 错误时显示通用提示并保留表单内容", async ({
    page,
  }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 502,
        contentType: "text/plain",
        body: "Bad Gateway",
      });
    });

    await page.goto("/contact");

    const name = page.getByLabel(/^姓名/);
    const email = page.getByLabel(/^邮箱/);
    const message = page.getByLabel(/^留言/, {
      exact: true,
    });
    const submitButton = page.getByRole("button", {
      name: "提交表单",
    });

    await name.fill("William");
    await email.fill("william@example.com");
    await message.fill("这是一条用于验证非 JSON 错误响应的完整留言内容。");

    await submitButton.click();

    await expect(page.getByRole("status")).toHaveText("发送失败，请稍后重试。");

    await expect(name).toHaveValue("William");
    await expect(email).toHaveValue("william@example.com");
    await expect(message).toHaveValue(
      "这是一条用于验证非 JSON 错误响应的完整留言内容。",
    );

    await expect(submitButton).toBeEnabled();

    await expect(page.locator("#contact-form")).toHaveAttribute(
      "aria-busy",
      "false",
    );
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

    await expect(page.locator("#contact-form")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });
});
