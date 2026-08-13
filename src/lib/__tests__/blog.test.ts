import { describe, expect, test } from "vitest";

import {
  getBlogTagItems,
  getBlogTags,
  sortBlogPostsByDate,
  type BlogEntry,
} from "../blog";

function createBlogEntry({
  id,
  pubDate,
  tags = [],
}: {
  id: string;
  pubDate: string;
  tags?: string[];
}): BlogEntry {
  return {
    id,

    data: {
      pubDate: new Date(pubDate),

      tags,
    },
  } as unknown as BlogEntry;
}

describe("blog data utilities", () => {
  test("文章按照发布日期从新到旧排序", () => {
    const oldPost = createBlogEntry({
      id: "old-post",

      pubDate: "2026-01-01",
    });

    const newestPost = createBlogEntry({
      id: "newest-post",

      pubDate: "2026-06-01",
    });

    const middlePost = createBlogEntry({
      id: "middle-post",

      pubDate: "2026-03-01",
    });

    const result = sortBlogPostsByDate([oldPost, newestPost, middlePost]);

    expect(result.map((post) => post.id)).toEqual([
      "newest-post",
      "middle-post",
      "old-post",
    ]);
  });

  test("排序不会修改原始文章数组", () => {
    const first = createBlogEntry({
      id: "first",

      pubDate: "2026-01-01",
    });

    const second = createBlogEntry({
      id: "second",

      pubDate: "2026-06-01",
    });

    const original = [first, second];

    sortBlogPostsByDate(original);

    expect(original.map((post) => post.id)).toEqual(["first", "second"]);
  });

  test("博客标签会去重并排序", () => {
    const posts = [
      createBlogEntry({
        id: "post-1",

        pubDate: "2026-01-01",

        tags: ["JavaScript", "Astro"],
      }),

      createBlogEntry({
        id: "post-2",

        pubDate: "2026-02-01",

        tags: ["CSS", "Astro"],
      }),
    ];

    const result = getBlogTags(posts);

    expect(result).toEqual(["Astro", "CSS", "JavaScript"]);
  });

  test("可以正确统计每个博客标签的文章数量", () => {
    const posts = [
      createBlogEntry({
        id: "post-1",

        pubDate: "2026-01-01",

        tags: ["Astro", "JavaScript"],
      }),

      createBlogEntry({
        id: "post-2",

        pubDate: "2026-02-01",

        tags: ["Astro", "CSS"],
      }),

      createBlogEntry({
        id: "post-3",

        pubDate: "2026-03-01",

        tags: ["Astro"],
      }),
    ];

    const result = getBlogTagItems(posts);

    expect(result).toEqual([
      {
        name: "Astro",
        count: 3,
      },

      {
        name: "CSS",
        count: 1,
      },

      {
        name: "JavaScript",
        count: 1,
      },
    ]);
  });

  test("没有文章时返回空标签列表", () => {
    expect(getBlogTags([])).toEqual([]);

    expect(getBlogTagItems([])).toEqual([]);
  });
});
