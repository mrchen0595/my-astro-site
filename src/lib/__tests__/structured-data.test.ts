import { describe, expect, test } from "vitest";

import {
  createBreadcrumbStructuredData,
  serializeStructuredData,
} from "../structured-data";

describe("structured data utilities", () => {
  test("breadcrumb 使用统一的绝对 URL", () => {
    const data = createBreadcrumbStructuredData(
      [
        {
          name: "首页",
          href: "/",
        },

        {
          name: "博客",
          href: "/blog",
        },

        {
          name: "文章标题",
        },
      ],
      "https://example.com",
    );

    expect(data.itemListElement).toEqual([
      {
        "@type": "ListItem",

        position: 1,

        name: "首页",

        item: "https://example.com/",
      },

      {
        "@type": "ListItem",

        position: 2,

        name: "博客",

        item: "https://example.com/blog",
      },

      {
        "@type": "ListItem",

        position: 3,

        name: "文章标题",
      },
    ]);
  });

  test("最后一个 breadcrumb 不生成 item URL", () => {
    const data = createBreadcrumbStructuredData(
      [
        {
          name: "首页",
          href: "/",
        },

        {
          name: "当前页面",
        },
      ],
      "https://example.com",
    );

    const items = data.itemListElement as Array<Record<string, unknown>>;

    expect(items[1]).not.toHaveProperty("item");
  });

  test("JSON-LD 序列化会转义小于号", () => {
    const result = serializeStructuredData({
      value: "</script>",
    });

    expect(result).toContain("\\u003c/script>");

    expect(result).not.toContain("</script>");
  });
});
