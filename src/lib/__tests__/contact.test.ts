import { describe, expect, it } from "vitest";

import { normalizeContactRequest, validateContactSubmission } from "../contact";

describe("normalizeContactRequest", () => {
  it("规范化 Contact 字段", () => {
    const result = normalizeContactRequest({
      name: "  William\r\nChan  ",
      email: "  william@example.com  ",
      subject: "  Astro\r\n网站  ",
      message: "  第一行\n第二行  ",
      website: "  bot.example  ",
    });

    expect(result).toEqual({
      submission: {
        name: "William Chan",
        email: "william@example.com",
        subject: "Astro 网站",
        message: "第一行\n第二行",
      },
      website: "bot.example",
    });
  });

  it("非字符串字段规范化为空字符串", () => {
    const result = normalizeContactRequest({
      name: 123,
      email: null,
      subject: undefined,
      message: [],
      website: {},
    });

    expect(result).toEqual({
      submission: {
        name: "",
        email: "",
        subject: "",
        message: "",
      },
      website: "",
    });
  });

  it("按照服务器限制截断字段长度", () => {
    const result = normalizeContactRequest({
      name: "n".repeat(50),
      email: "e".repeat(120),
      subject: "s".repeat(100),
      message: "m".repeat(1100),
      website: "w".repeat(250),
    });

    expect(result.submission.name).toHaveLength(40);
    expect(result.submission.email).toHaveLength(100);
    expect(result.submission.subject).toHaveLength(80);
    expect(result.submission.message).toHaveLength(1000);
    expect(result.website).toHaveLength(200);
  });
});

describe("validateContactSubmission", () => {
  it("返回字段级 validation errors", () => {
    const errors = validateContactSubmission({
      name: "A",
      email: "invalid-email",
      subject: "测试",
      message: "太短",
    });

    expect(errors).toEqual({
      name: "姓名至少需要 2 个字符。",
      email: "请输入有效的邮箱地址。",
      message: "留言至少需要 10 个字符。",
    });
  });

  it("合法 submission 不返回错误", () => {
    const errors = validateContactSubmission({
      name: "William",
      email: "william@example.com",
      subject: "",
      message: "这是一条长度足够的测试留言。",
    });

    expect(errors).toEqual({});
  });
});
