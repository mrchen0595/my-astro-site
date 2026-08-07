import { expect, test } from "@playwright/test";

test("联系接口拒绝 GET 请求", async ({ request }) => {
  const response = await request.get("/api/contact");

  expect(response.status()).toBe(405);

  const body = (await response.json()) as {
    ok: boolean;
    message: string;
  };

  expect(body.ok).toBe(false);

  expect(body.message).toContain("只接受 POST");
});
