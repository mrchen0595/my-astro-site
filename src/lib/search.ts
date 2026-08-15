import { getPublishedBlogPosts, type BlogEntry } from "./blog";

import { getProjects, type ProjectEntry } from "./projects";

export type SearchItemType = "blog" | "project";

export interface SearchItem {
  id: string;

  type: SearchItemType;

  title: string;

  description: string;

  href: string;

  keywords: string[];
}

export interface SearchResult extends SearchItem {
  score: number;
}

/**
 * 统一搜索文本格式。
 *
 * - Unicode NFKC 规范化
 * - 去除首尾空格
 * - 转换成小写
 */
export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-CN");
}

/**
 * 把搜索词拆成多个关键词。
 *
 * 例如：
 *
 * "Astro JavaScript"
 *
 * →
 *
 * ["astro", "javascript"]
 */
export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);

  if (!normalized) {
    return [];
  }

  return normalized.split(/\s+/).filter(Boolean);
}

/**
 * 把 Blog Collection 转换成
 * 通用 SearchItem。
 */
export function createBlogSearchItems(posts: BlogEntry[]): SearchItem[] {
  return posts.map((post) => ({
    id: post.id,

    type: "blog",

    title: post.data.title,

    description: post.data.description,

    href: `/blog/${post.id}`,

    keywords: [...post.data.tags],
  }));
}

/**
 * 把 Project Collection 转换成
 * 通用 SearchItem。
 */
export function createProjectSearchItems(
  projects: ProjectEntry[],
): SearchItem[] {
  return projects.map((project) => ({
    id: project.id,

    type: "project",

    title: project.data.title,

    description: project.data.description,

    href: `/projects/${project.id}`,

    keywords: [...project.data.technologies, project.data.status],
  }));
}

/**
 * 合并 Blog 和 Project，
 * 建立整个网站的搜索索引。
 */
export function createSearchIndex(
  posts: BlogEntry[],
  projects: ProjectEntry[],
): SearchItem[] {
  return [
    ...createBlogSearchItems(posts),

    ...createProjectSearchItems(projects),
  ];
}

/**
 * 获取实际网站搜索索引。
 *
 * Blog 使用 getPublishedBlogPosts，
 * 因此草稿文章不会进入搜索结果。
 */
export async function getSearchIndex(): Promise<SearchItem[]> {
  const [posts, projects] = await Promise.all([
    getPublishedBlogPosts(),
    getProjects(),
  ]);

  return createSearchIndex(posts, projects);
}

/**
 * 计算一个搜索项与查询的相关性。
 *
 * 权重：
 *
 * title       5
 * keywords    3
 * description 1
 *
 * 所有查询关键词都必须至少命中一个字段。
 */
export function scoreSearchItem(item: SearchItem, terms: string[]): number {
  if (terms.length === 0) {
    return 0;
  }

  const title = normalizeSearchText(item.title);

  const description = normalizeSearchText(item.description);

  const keywords = item.keywords.map(normalizeSearchText);

  let score = 0;

  for (const term of terms) {
    let termScore = 0;

    if (title.includes(term)) {
      termScore += 5;
    }

    if (keywords.some((keyword) => keyword.includes(term))) {
      termScore += 3;
    }

    if (description.includes(term)) {
      termScore += 1;
    }

    if (termScore === 0) {
      return 0;
    }

    score += termScore;
  }

  return score;
}

/**
 * 搜索整个索引。
 *
 * 搜索结果按照：
 *
 * 1. 相关性
 * 2. 中文标题
 *
 * 进行排序。
 */
export function searchItems(
  items: SearchItem[],
  query: string,
): SearchResult[] {
  const terms = tokenizeSearchQuery(query);

  if (terms.length === 0) {
    return [];
  }

  const normalizedQuery = normalizeSearchText(query);

  return items
    .map((item) => {
      let score = scoreSearchItem(item, terms);

      if (normalizeSearchText(item.title) === normalizedQuery) {
        score += 10;
      }

      return {
        ...item,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.title.localeCompare(b.title, "zh-CN");
    });
}
