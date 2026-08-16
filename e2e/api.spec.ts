import { expect, test } from "@playwright/test";

test.describe("Contact API", () => {
  test("拒绝 GET 请求", async ({ request }) => {
    const response = await request.get("/api/contact");

    expect(response.status()).toBe(405);
    expect(response.headers()["cache-control"]).toBe("no-store");

    const body = (await response.json()) as {
      ok: boolean;
      message: string;
    };

    expect(body.ok).toBe(false);
    expect(body.message).toContain("只接受 POST");
  });

  test("拒绝非 JSON POST 请求", async ({ request }) => {
    const response = await request.fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
      },
      data: "<message>hello</message>",
    });

    expect(response.status()).toBe(415);
    expect(response.headers()["cache-control"]).toBe("no-store");

    const body = (await response.json()) as {
      ok: boolean;
      message: string;
    };

    expect(body).toEqual({
      ok: false,
      message: "请求格式不正确。",
    });
  });

  test("拒绝无法解析的 JSON", async ({ request }) => {
    const response = await request.fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: Buffer.from("{invalid-json", "utf8"),
    });

    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");

    const body = (await response.json()) as {
      ok: boolean;
      message: string;
    };

    expect(body).toEqual({
      ok: false,
      message: "无法读取表单数据。",
    });
  });

  test("拒绝非对象 JSON body", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: [],
    });

    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");

    const body = (await response.json()) as {
      ok: boolean;
      message: string;
    };

    expect(body).toEqual({
      ok: false,
      message: "表单数据格式不正确。",
    });
  });

  test("服务端验证非法字段并返回字段错误", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "A",
        email: "invalid-email",
        subject: "测试",
        message: "太短",
        website: "",
      },
    });

    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");

    const body = (await response.json()) as {
      ok: boolean;
      message: string;
      errors: Record<string, string>;
    };

    expect(body.ok).toBe(false);
    expect(body.message).toBe("服务端验证未通过，请检查表单。");

    expect(body.errors).toEqual({
      name: "姓名至少需要 2 个字符。",
      email: "请输入有效的邮箱地址。",
      message: "留言至少需要 10 个字符。",
    });
  });
});
