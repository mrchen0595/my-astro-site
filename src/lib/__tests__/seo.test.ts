import { describe, expect, test } from "vitest";

import { siteConfig } from "../../config/site";

import { createPageTitle } from "../seo";

describe("SEO utilities", () => {
  test("没有页面标题时返回网站名称", () => {
    expect(createPageTitle()).toBe(siteConfig.name);
  });

  test("页面标题和网站名称正确组合", () => {
    expect(createPageTitle("项目")).toBe(`项目 | ${siteConfig.name}`);
  });

  test("可以处理中文页面标题", () => {
    expect(createPageTitle("博客文章")).toBe(`博客文章 | ${siteConfig.name}`);
  });
});
