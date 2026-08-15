import { type SearchItem } from "./search-core";

import { getPublishedBlogPosts, type BlogEntry } from "./blog";

import { getProjects, type ProjectEntry } from "./projects";

export {
  normalizeSearchText,
  scoreSearchItem,
  searchItems,
  tokenizeSearchQuery,
} from "./search-core";

export type { SearchItem, SearchItemType, SearchResult } from "./search-core";

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

export function createSearchIndex(
  posts: BlogEntry[],
  projects: ProjectEntry[],
): SearchItem[] {
  return [
    ...createBlogSearchItems(posts),

    ...createProjectSearchItems(projects),
  ];
}

export async function getSearchIndex(): Promise<SearchItem[]> {
  const [posts, projects] = await Promise.all([
    getPublishedBlogPosts(),
    getProjects(),
  ]);

  return createSearchIndex(posts, projects);
}
