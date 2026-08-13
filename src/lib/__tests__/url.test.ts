import { describe, expect, test } from "vitest";

import { createCanonicalUrl, createSiteUrl, getBaseUrl } from "../url";

describe("URL utilities", () => {
  test("存在 site 时优先使用正式站点 URL", () => {
    const result = getBaseUrl(
      new URL("https://example.com"),
      "http://localhost:4321",
    );

    expect(result.href).toBe("https://example.com/");
  });

  test("没有 site 时使用当前 origin", () => {
    const result = getBaseUrl(undefined, "http://localhost:4321");

    expect(result.href).toBe("http://localhost:4321/");
  });

  test("可以生成首页绝对 URL", () => {
    expect(createSiteUrl("/", "https://example.com")).toBe(
      "https://example.com/",
    );
  });

  test("可以生成内部页面绝对 URL", () => {
    expect(createSiteUrl("/projects/astro-site", "https://example.com")).toBe(
      "https://example.com/projects/astro-site",
    );
  });

  test("可以生成静态资源绝对 URL", () => {
    expect(createSiteUrl("/_astro/cover.jpg", "https://example.com")).toBe(
      "https://example.com/_astro/cover.jpg",
    );
  });

  test("canonical 会移除 query string", () => {
    expect(
      createCanonicalUrl("/blog/article?page=2", "https://example.com"),
    ).toBe("https://example.com/blog/article");
  });

  test("canonical 会移除 hash fragment", () => {
    expect(createCanonicalUrl("/about#skills", "https://example.com")).toBe(
      "https://example.com/about",
    );
  });
});
