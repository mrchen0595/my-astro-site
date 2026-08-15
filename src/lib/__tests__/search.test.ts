import { describe, expect, test } from "vitest";

import type { BlogEntry } from "../blog";

import type { ProjectEntry } from "../projects";

import {
  createBlogSearchItems,
  createProjectSearchItems,
  createSearchIndex,
  normalizeSearchText,
  searchItems,
  tokenizeSearchQuery,
  type SearchItem,
} from "../search";

function createBlogEntry({
  id,
  title,
  description,
  tags = [],
}: {
  id: string;

  title: string;

  description: string;

  tags?: string[];
}): BlogEntry {
  return {
    id,

    data: {
      title,

      description,

      tags,
    },
  } as unknown as BlogEntry;
}

function createProjectEntry({
  id,
  title,
  description,
  technologies = [],
  status = "已完成",
}: {
  id: string;

  title: string;

  description: string;

  technologies?: string[];

  status?: string;
}): ProjectEntry {
  return {
    id,

    data: {
      title,

      description,

      technologies,

      status,
    },
  } as unknown as ProjectEntry;
}

function createSearchItem(overrides: Partial<SearchItem> = {}): SearchItem {
  return {
    id: "item",

    type: "blog",

    title: "Astro 入门",

    description: "学习前端网站开发",

    href: "/blog/item",

    keywords: ["JavaScript", "Astro"],

    ...overrides,
  };
}

describe("search utilities", () => {
  test("搜索文本会规范化大小写和空格", () => {
    expect(normalizeSearchText("  Astro  ")).toBe("astro");
  });

  test("搜索查询可以拆分成多个关键词", () => {
    expect(tokenizeSearchQuery("  Astro   JavaScript ")).toEqual([
      "astro",
      "javascript",
    ]);
  });

  test("Blog 可以转换成搜索项", () => {
    const posts = [
      createBlogEntry({
        id: "astro-guide",

        title: "Astro 入门",

        description: "Astro 学习记录",

        tags: ["Astro", "前端"],
      }),
    ];

    expect(createBlogSearchItems(posts)).toEqual([
      {
        id: "astro-guide",

        type: "blog",

        title: "Astro 入门",

        description: "Astro 学习记录",

        href: "/blog/astro-guide",

        keywords: ["Astro", "前端"],
      },
    ]);
  });

  test("Project 可以转换成搜索项", () => {
    const projects = [
      createProjectEntry({
        id: "astro-site",

        title: "Astro 个人网站",

        description: "个人网站项目",

        technologies: ["Astro", "CSS"],

        status: "已上线",
      }),
    ];

    expect(createProjectSearchItems(projects)).toEqual([
      {
        id: "astro-site",

        type: "project",

        title: "Astro 个人网站",

        description: "个人网站项目",

        href: "/projects/astro-site",

        keywords: ["Astro", "CSS", "已上线"],
      },
    ]);
  });

  test("可以建立 Blog 和 Project 的统一索引", () => {
    const posts = [
      createBlogEntry({
        id: "post",

        title: "博客",

        description: "文章",
      }),
    ];

    const projects = [
      createProjectEntry({
        id: "project",

        title: "项目",

        description: "案例",
      }),
    ];

    const index = createSearchIndex(posts, projects);

    expect(index.map((item) => item.type)).toEqual(["blog", "project"]);
  });

  test("可以通过标题搜索", () => {
    const items = [
      createSearchItem({
        title: "Astro 入门",

        keywords: [],
      }),

      createSearchItem({
        id: "css",

        title: "CSS 学习",

        href: "/blog/css",

        keywords: [],
      }),
    ];

    const result = searchItems(items, "Astro");

    expect(result.map((item) => item.title)).toEqual(["Astro 入门"]);
  });

  test("可以通过标签和技术搜索", () => {
    const items = [
      createSearchItem({
        keywords: ["Astro", "JavaScript"],
      }),
    ];

    const result = searchItems(items, "javascript");

    expect(result).toHaveLength(1);
  });

  test("多个关键词必须全部匹配", () => {
    const items = [
      createSearchItem({
        title: "Astro 网站",

        keywords: ["JavaScript"],
      }),

      createSearchItem({
        id: "astro-only",

        title: "Astro 教程",

        keywords: ["CSS"],

        href: "/blog/astro-only",
      }),
    ];

    const result = searchItems(items, "Astro JavaScript");

    expect(result.map((item) => item.id)).toEqual(["item"]);
  });

  test("标题匹配的结果优先级更高", () => {
    const items = [
      createSearchItem({
        id: "description",

        title: "前端学习",

        description: "Astro 网站",

        keywords: [],
      }),

      createSearchItem({
        id: "title",

        title: "Astro 网站",

        description: "前端学习",

        keywords: [],
      }),
    ];

    const result = searchItems(items, "Astro");

    expect(result.map((item) => item.id)).toEqual(["title", "description"]);
  });

  test("空查询返回空结果", () => {
    const items = [createSearchItem()];

    expect(searchItems(items, "   ")).toEqual([]);
  });
});
