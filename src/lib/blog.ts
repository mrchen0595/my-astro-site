import { getCollection, type CollectionEntry } from "astro:content";

export type BlogEntry = CollectionEntry<"blog">;

export interface BlogTagItem {
  name: string;
  count: number;
}

export interface BlogTagRouteItem extends BlogTagItem {
  slug: string;
}

export const BLOG_PAGE_SIZE = 6;

export interface BlogPageData {
  posts: BlogEntry[];

  currentPage: number;

  totalPages: number;

  totalPosts: number;

  hasPreviousPage: boolean;

  hasNextPage: boolean;

  previousHref: string | null;

  nextHref: string | null;
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
 * 把博客标签名称转换成稳定、可读的 URL slug。
 *
 * 例如：
 *
 * Astro
 * → astro
 *
 * Web Performance
 * → web-performance
 *
 * 前端架构
 * → 前端架构
 */
export function createBlogTagSlug(tag: string): string {
  return tag
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("zh-CN")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 生成可用于 Blog Tag 路由的数据。
 *
 * 如果不同标签生成了相同 slug，
 * 或某个标签无法生成有效 slug，
 * 直接抛错，避免生成冲突或无效 URL。
 */
export function getBlogTagRouteItems(posts: BlogEntry[]): BlogTagRouteItem[] {
  const slugToName = new Map<string, string>();

  return getBlogTagItems(posts).map((tag) => {
    const slug = createBlogTagSlug(tag.name);

    if (!slug) {
      throw new Error(
        `Blog tag "${tag.name}" cannot produce a valid URL slug.`,
      );
    }

    const existingName = slugToName.get(slug);

    if (existingName && existingName !== tag.name) {
      throw new Error(
        `Blog tag slug collision: "${existingName}" and "${tag.name}" both resolve to "${slug}".`,
      );
    }

    slugToName.set(slug, tag.name);

    return {
      ...tag,
      slug,
    };
  });
}
/**
 * 根据原始标签名称筛选博客文章。
 *
 * Tag identity 使用 Content 中的精确字符串，
 * 不在这里使用 slug、lowercase 或其他 URL normalization。
 *
 * filter 会保留传入 posts 的原有顺序。
 */
export function getBlogPostsByTag(
  posts: BlogEntry[],
  tagName: string,
): BlogEntry[] {
  return posts.filter((post) => post.data.tags.includes(tagName));
}
/**
 * 一次准备博客列表页需要的数据。
 */
export async function getBlogIndexData() {
  const posts = await getPublishedBlogPosts();

  const tags = getBlogTagRouteItems(posts);

  return {
    posts,
    tags,
  };
}

export function createBlogPageHref(page: number): string {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error(`Invalid blog page number: ${page}.`);
  }

  return page === 1 ? "/blog" : `/blog/page/${page}`;
}

export function getBlogTotalPages(
  totalPosts: number,
  pageSize = BLOG_PAGE_SIZE,
): number {
  if (!Number.isInteger(totalPosts) || totalPosts < 0) {
    throw new Error(`Invalid blog post count: ${totalPosts}.`);
  }

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new Error(`Invalid blog page size: ${pageSize}.`);
  }

  return Math.max(1, Math.ceil(totalPosts / pageSize));
}

export function getBlogPageData(
  posts: BlogEntry[],
  currentPage: number,
  pageSize = BLOG_PAGE_SIZE,
): BlogPageData {
  const totalPosts = posts.length;

  const totalPages = getBlogTotalPages(totalPosts, pageSize);

  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    currentPage > totalPages
  ) {
    throw new Error(
      `Invalid blog page ${currentPage}; total pages: ${totalPages}.`,
    );
  }

  const startIndex = (currentPage - 1) * pageSize;

  const pagePosts = posts.slice(startIndex, startIndex + pageSize);

  const hasPreviousPage = currentPage > 1;

  const hasNextPage = currentPage < totalPages;

  return {
    posts: pagePosts,

    currentPage,

    totalPages,

    totalPosts,

    hasPreviousPage,

    hasNextPage,

    previousHref: hasPreviousPage ? createBlogPageHref(currentPage - 1) : null,

    nextHref: hasNextPage ? createBlogPageHref(currentPage + 1) : null,
  };
}

export function getBlogAdditionalPageNumbers(
  totalPosts: number,
  pageSize = BLOG_PAGE_SIZE,
): number[] {
  const totalPages = getBlogTotalPages(totalPosts, pageSize);

  return Array.from(
    {
      length: Math.max(0, totalPages - 1),
    },
    (_, index) => index + 2,
  );
}
