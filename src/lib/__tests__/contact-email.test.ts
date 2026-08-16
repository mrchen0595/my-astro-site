import { describe, expect, it } from "vitest";

import { buildContactEmail } from "../contact-email";

describe("buildContactEmail", () => {
  it("构造 Contact 邮件内容", () => {
    const email = buildContactEmail({
      name: "William",
      email: "william@example.com",
      subject: "Astro 测试",
      message: "这是一条测试留言。",
    });

    expect(email.replyTo).toBe("william@example.com");

    expect(email.subject).toBe("[网站留言] Astro 测试");

    expect(email.text).toContain("姓名：William");
    expect(email.text).toContain("邮箱：william@example.com");
    expect(email.text).toContain("主题：Astro 测试");
    expect(email.text).toContain("这是一条测试留言。");

    expect(email.html).toContain("William");
    expect(email.html).toContain("william@example.com");
    expect(email.html).toContain("Astro 测试");
    expect(email.html).toContain("这是一条测试留言。");
  });

  it("空主题使用无主题 fallback", () => {
    const email = buildContactEmail({
      name: "William",
      email: "william@example.com",
      subject: "",
      message: "这是一条测试留言。",
    });

    expect(email.subject).toBe("[网站留言] 无主题");
    expect(email.text).toContain("主题：无主题");
    expect(email.html).toContain("无主题");
  });

  it("HTML 输出会转义用户输入并保留留言换行", () => {
    const email = buildContactEmail({
      name: '<script>alert("name")</script>',
      email: "william@example.com",
      subject: "<strong>测试</strong>",
      message: "第一行\n<img src=x onerror=alert(1)>",
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<strong>测试</strong>");
    expect(email.html).not.toContain("<img");

    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("&lt;strong&gt;测试&lt;/strong&gt;");
    expect(email.html).toContain("<br />");
    expect(email.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("纯文本邮件保留原始可读内容", () => {
    const email = buildContactEmail({
      name: "William",
      email: "william@example.com",
      subject: "测试",
      message: "第一行\n第二行",
    });

    expect(email.text).toContain("第一行\n第二行");
  });
});
