import { getCollection, type CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

/**
 * 按项目的 order 字段排序。
 *
 * 使用数组副本，
 * 不修改原始数组。
 */
export function sortProjectsByOrder(projects: ProjectEntry[]): ProjectEntry[] {
  return [...projects].sort((a, b) => a.data.order - b.data.order);
}

/**
 * 获取全部项目，
 * 并按 order 排序。
 */
export async function getProjects(): Promise<ProjectEntry[]> {
  const projects = await getCollection("projects");

  return sortProjectsByOrder(projects);
}

/**
 * 获取项目中的全部唯一状态。
 */
export function getProjectStatuses(projects: ProjectEntry[]): string[] {
  return [...new Set(projects.map((project) => project.data.status))];
}

/**
 * 获取项目中的全部唯一技术，
 * 并按名称排序。
 */
export function getProjectTechnologies(projects: ProjectEntry[]): string[] {
  return [
    ...new Set(projects.flatMap((project) => project.data.technologies)),
  ].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

/**
 * 一次准备项目列表页
 * 所需要的数据。
 */
export async function getProjectIndexData() {
  const projects = await getProjects();

  const statuses = getProjectStatuses(projects);

  const technologies = getProjectTechnologies(projects);

  return {
    projects,
    statuses,
    technologies,
  };
}
