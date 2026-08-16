import { describe, expect, test } from "vitest";

import {
  RELATED_BLOG_LIMIT,
  getRelatedBlogPosts,
  getBlogAdditionalPageNumbers,
  getBlogTotalPages,
  BLOG_PAGE_SIZE,
  createBlogPageHref,
  getBlogPageData,
  createBlogTagSlug,
  getBlogTagItems,
  getBlogTagRouteItems,
  getBlogTags,
  sortBlogPostsByDate,
  getBlogPostsByTag,
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

  test("博客标签可以转换成稳定的 URL slug", () => {
    expect(createBlogTagSlug("Astro")).toBe("astro");

    expect(createBlogTagSlug(" Web Performance ")).toBe("web-performance");

    expect(createBlogTagSlug("前端架构")).toBe("前端架构");

    expect(createBlogTagSlug("前端 入门")).toBe("前端-入门");

    expect(createBlogTagSlug("Node.js")).toBe("node-js");

    expect(createBlogTagSlug("AI / ML")).toBe("ai-ml");
  });

  test("标签 slug 会进行 Unicode 规范化", () => {
    expect(createBlogTagSlug("Ａｓｔｒｏ")).toBe("astro");
  });

  test("可以生成包含名称、slug 和文章数量的标签路由数据", () => {
    const posts = [
      createBlogEntry({
        id: "post-1",

        pubDate: "2026-01-01",

        tags: ["Astro", "前端架构"],
      }),

      createBlogEntry({
        id: "post-2",

        pubDate: "2026-02-01",

        tags: ["Astro"],
      }),
    ];

    const result = getBlogTagRouteItems(posts);

    expect(result).toHaveLength(2);

    expect(result).toContainEqual({
      name: "Astro",
      slug: "astro",
      count: 2,
    });

    expect(result).toContainEqual({
      name: "前端架构",
      slug: "前端架构",
      count: 1,
    });
  });

  test("不同标签生成相同 slug 时会拒绝创建路由数据", () => {
    const posts = [
      createBlogEntry({
        id: "post-1",

        pubDate: "2026-01-01",

        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "post-2",

        pubDate: "2026-02-01",

        tags: ["astro"],
      }),
    ];

    expect(() => getBlogTagRouteItems(posts)).toThrow(
      "Blog tag slug collision",
    );
  });

  test("无法生成有效 slug 的标签会被拒绝", () => {
    const posts = [
      createBlogEntry({
        id: "post-1",

        pubDate: "2026-01-01",

        tags: ["///"],
      }),
    ];

    expect(() => getBlogTagRouteItems(posts)).toThrow(
      "cannot produce a valid URL slug",
    );
  });

  test("可以根据原始标签名称筛选对应博客文章", () => {
    const posts = [
      createBlogEntry({
        id: "newest-astro",

        pubDate: "2026-03-01",

        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "css-post",

        pubDate: "2026-02-01",

        tags: ["CSS"],
      }),

      createBlogEntry({
        id: "older-astro",

        pubDate: "2026-01-01",

        tags: ["Astro", "JavaScript"],
      }),
    ];

    const result = getBlogPostsByTag(posts, "Astro");

    expect(result.map((post) => post.id)).toEqual([
      "newest-astro",
      "older-astro",
    ]);
  });

  test("标签文章筛选保持精确的 Tag identity", () => {
    const posts = [
      createBlogEntry({
        id: "uppercase",

        pubDate: "2026-02-01",

        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "lowercase",

        pubDate: "2026-01-01",

        tags: ["astro"],
      }),
    ];

    expect(getBlogPostsByTag(posts, "Astro").map((post) => post.id)).toEqual([
      "uppercase",
    ]);

    expect(getBlogPostsByTag(posts, "astro").map((post) => post.id)).toEqual([
      "lowercase",
    ]);
  });
  test("没有文章时返回空标签列表", () => {
    expect(getBlogTags([])).toEqual([]);

    expect(getBlogTagItems([])).toEqual([]);

    expect(getBlogTagRouteItems([])).toEqual([]);
  });
  test("博客分页使用 6 篇作为默认页面大小", () => {
    expect(BLOG_PAGE_SIZE).toBe(6);
  });

  test("博客分页 URL 不会为第一页生成 page/1", () => {
    expect(createBlogPageHref(1)).toBe("/blog");

    expect(createBlogPageHref(2)).toBe("/blog/page/2");

    expect(createBlogPageHref(12)).toBe("/blog/page/12");
  });

  test("博客文章可以按照页面大小切分并保持原有顺序", () => {
    const posts = Array.from(
      {
        length: 7,
      },
      (_, index) =>
        createBlogEntry({
          id: `post-${index + 1}`,

          pubDate: `2026-01-${String(index + 1).padStart(2, "0")}`,
        }),
    );

    const firstPage = getBlogPageData(posts, 1, 3);

    const secondPage = getBlogPageData(posts, 2, 3);

    const thirdPage = getBlogPageData(posts, 3, 3);

    expect(firstPage.posts.map((post) => post.id)).toEqual([
      "post-1",
      "post-2",
      "post-3",
    ]);

    expect(secondPage.posts.map((post) => post.id)).toEqual([
      "post-4",
      "post-5",
      "post-6",
    ]);

    expect(thirdPage.posts.map((post) => post.id)).toEqual(["post-7"]);
  });

  test("博客分页会生成正确的页码和上一页下一页链接", () => {
    const posts = Array.from(
      {
        length: 7,
      },
      (_, index) =>
        createBlogEntry({
          id: `post-${index + 1}`,

          pubDate: `2026-01-${String(index + 1).padStart(2, "0")}`,
        }),
    );

    const firstPage = getBlogPageData(posts, 1, 3);

    expect(firstPage).toMatchObject({
      currentPage: 1,
      totalPages: 3,
      totalPosts: 7,
      hasPreviousPage: false,
      hasNextPage: true,
      previousHref: null,
      nextHref: "/blog/page/2",
    });

    const secondPage = getBlogPageData(posts, 2, 3);

    expect(secondPage).toMatchObject({
      currentPage: 2,
      totalPages: 3,
      totalPosts: 7,
      hasPreviousPage: true,
      hasNextPage: true,
      previousHref: "/blog",
      nextHref: "/blog/page/3",
    });

    const thirdPage = getBlogPageData(posts, 3, 3);

    expect(thirdPage).toMatchObject({
      currentPage: 3,
      totalPages: 3,
      totalPosts: 7,
      hasPreviousPage: true,
      hasNextPage: false,
      previousHref: "/blog/page/2",
      nextHref: null,
    });
  });

  test("没有博客文章时第一页仍然是合法页面", () => {
    expect(getBlogPageData([], 1)).toEqual({
      posts: [],
      currentPage: 1,
      totalPages: 1,
      totalPosts: 0,
      hasPreviousPage: false,
      hasNextPage: false,
      previousHref: null,
      nextHref: null,
    });
  });

  test("无效的博客页码和页面大小会被拒绝", () => {
    const posts = [
      createBlogEntry({
        id: "post-1",
        pubDate: "2026-01-01",
      }),
    ];

    expect(() => createBlogPageHref(0)).toThrow("Invalid blog page number");

    expect(() => getBlogPageData(posts, 0)).toThrow("Invalid blog page");

    expect(() => getBlogPageData(posts, 2)).toThrow("Invalid blog page");

    expect(() => getBlogPageData(posts, 1, 0)).toThrow(
      "Invalid blog page size",
    );
  });
  test("博客总页数会根据文章数量和页面大小计算", () => {
    expect(getBlogTotalPages(0, 6)).toBe(1);

    expect(getBlogTotalPages(2, 6)).toBe(1);

    expect(getBlogTotalPages(6, 6)).toBe(1);

    expect(getBlogTotalPages(7, 6)).toBe(2);

    expect(getBlogTotalPages(13, 6)).toBe(3);
  });

  test("后续分页页码不会包含第一页", () => {
    expect(getBlogAdditionalPageNumbers(0, 6)).toEqual([]);

    expect(getBlogAdditionalPageNumbers(2, 6)).toEqual([]);

    expect(getBlogAdditionalPageNumbers(6, 6)).toEqual([]);

    expect(getBlogAdditionalPageNumbers(7, 6)).toEqual([2]);

    expect(getBlogAdditionalPageNumbers(13, 6)).toEqual([2, 3]);
  });

  test("无效的博客文章数量会被拒绝", () => {
    expect(() => getBlogTotalPages(-1)).toThrow("Invalid blog post count");

    expect(() => getBlogTotalPages(1.5)).toThrow("Invalid blog post count");

    expect(() => getBlogAdditionalPageNumbers(-1)).toThrow(
      "Invalid blog post count",
    );
  });

  test("相关文章默认最多显示 3 篇", () => {
    expect(RELATED_BLOG_LIMIT).toBe(3);
  });

  test("相关文章按照共同标签数量和发布日期排序", () => {
    const currentPost = createBlogEntry({
      id: "current-post",
      pubDate: "2026-06-01",
      tags: ["Astro", "性能", "测试"],
    });

    const posts = [
      currentPost,

      createBlogEntry({
        id: "three-shared",
        pubDate: "2026-01-01",
        tags: ["Astro", "性能", "测试"],
      }),

      createBlogEntry({
        id: "two-shared",
        pubDate: "2026-05-01",
        tags: ["Astro", "性能"],
      }),

      createBlogEntry({
        id: "newer-one-shared",
        pubDate: "2026-04-01",
        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "older-one-shared",
        pubDate: "2026-03-01",
        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "unrelated",
        pubDate: "2026-07-01",
        tags: ["CSS"],
      }),
    ];

    const result = getRelatedBlogPosts(posts, currentPost);

    expect(result.map((post) => post.id)).toEqual([
      "three-shared",
      "two-shared",
      "newer-one-shared",
    ]);
  });

  test("相关文章保持精确的 Tag identity", () => {
    const currentPost = createBlogEntry({
      id: "current-post",
      pubDate: "2026-03-01",
      tags: ["Astro"],
    });

    const posts = [
      currentPost,

      createBlogEntry({
        id: "exact-match",
        pubDate: "2026-02-01",
        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "different-identity",
        pubDate: "2026-01-01",
        tags: ["astro"],
      }),
    ];

    expect(
      getRelatedBlogPosts(posts, currentPost).map((post) => post.id),
    ).toEqual(["exact-match"]);
  });

  test("没有共同标签时不返回相关文章", () => {
    const currentPost = createBlogEntry({
      id: "current-post",
      pubDate: "2026-02-01",
      tags: ["Astro"],
    });

    const unrelatedPost = createBlogEntry({
      id: "unrelated",
      pubDate: "2026-01-01",
      tags: ["CSS"],
    });

    expect(
      getRelatedBlogPosts([currentPost, unrelatedPost], currentPost),
    ).toEqual([]);
  });

  test("相关文章数量可以使用自定义 limit", () => {
    const currentPost = createBlogEntry({
      id: "current-post",
      pubDate: "2026-04-01",
      tags: ["Astro"],
    });

    const posts = [
      currentPost,

      createBlogEntry({
        id: "post-1",
        pubDate: "2026-03-01",
        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "post-2",
        pubDate: "2026-02-01",
        tags: ["Astro"],
      }),

      createBlogEntry({
        id: "post-3",
        pubDate: "2026-01-01",
        tags: ["Astro"],
      }),
    ];

    expect(
      getRelatedBlogPosts(posts, currentPost, 2).map((post) => post.id),
    ).toEqual(["post-1", "post-2"]);
  });

  test("相关文章计算不会修改原始文章数组", () => {
    const currentPost = createBlogEntry({
      id: "current-post",
      pubDate: "2026-03-01",
      tags: ["Astro"],
    });

    const olderPost = createBlogEntry({
      id: "older-post",
      pubDate: "2026-01-01",
      tags: ["Astro"],
    });

    const newerPost = createBlogEntry({
      id: "newer-post",
      pubDate: "2026-02-01",
      tags: ["Astro"],
    });

    const posts = [currentPost, olderPost, newerPost];

    getRelatedBlogPosts(posts, currentPost);

    expect(posts.map((post) => post.id)).toEqual([
      "current-post",
      "older-post",
      "newer-post",
    ]);
  });

  test("无效的相关文章数量会被拒绝", () => {
    const currentPost = createBlogEntry({
      id: "current-post",
      pubDate: "2026-01-01",
      tags: ["Astro"],
    });

    expect(() => getRelatedBlogPosts([currentPost], currentPost, 0)).toThrow(
      "Invalid related blog limit",
    );

    expect(() => getRelatedBlogPosts([currentPost], currentPost, 1.5)).toThrow(
      "Invalid related blog limit",
    );
  });

  test("重复标签不会重复增加相关文章相关度", () => {
    const currentPost = createBlogEntry({
      id: "current-post",
      pubDate: "2026-04-01",
      tags: ["Astro", "性能"],
    });

    const posts = [
      currentPost,

      createBlogEntry({
        id: "duplicated-tag",
        pubDate: "2026-03-01",
        tags: ["Astro", "Astro"],
      }),

      createBlogEntry({
        id: "two-real-shared",
        pubDate: "2026-01-01",
        tags: ["Astro", "性能"],
      }),
    ];

    expect(
      getRelatedBlogPosts(posts, currentPost).map((post) => post.id),
    ).toEqual(["two-real-shared", "duplicated-tag"]);
  });
});
