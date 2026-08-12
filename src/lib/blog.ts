import { getCollection, type CollectionEntry } from "astro:content";

export type BlogEntry = CollectionEntry<"blog">;

export interface BlogTagItem {
  name: string;
  count: number;
}

/**
 * 按发布日期从新到旧排序。
 *
 * 使用数组副本排序，
 * 避免修改传入的原数组。
 */
export function sortBlogPostsByDate(posts: BlogEntry[]): BlogEntry[] {
  return [...posts].sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );
}

/**
 * 获取全部公开博客文章。
 *
 * draft: true 的文章不会进入公开列表。
 */
export async function getPublishedBlogPosts(): Promise<BlogEntry[]> {
  const posts = await getCollection("blog", ({ data }) => data.draft !== true);

  return sortBlogPostsByDate(posts);
}

/**
 * 获取全部唯一标签名称。
 */
export function getBlogTags(posts: BlogEntry[]): string[] {
  return [...new Set(posts.flatMap((post) => post.data.tags))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

/**
 * 获取标签及每个标签对应的文章数量。
 *
 * 返回格式：
 *
 * [
 *   {
 *     name: "Astro",
 *     count: 2,
 *   },
 *   {
 *     name: "前端架构",
 *     count: 1,
 *   },
 * ]
 */
export function getBlogTagItems(posts: BlogEntry[]): BlogTagItem[] {
  const tagCountMap = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      tagCountMap.set(tag, (tagCountMap.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCountMap, ([name, count]) => ({
    name,
    count,
  })).sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

/**
 * 一次准备博客列表页需要的数据。
 */
export async function getBlogIndexData() {
  const posts = await getPublishedBlogPosts();

  const tags = getBlogTagItems(posts);

  return {
    posts,
    tags,
  };
}
