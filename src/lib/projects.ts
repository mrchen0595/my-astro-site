import { getCollection, type CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

export async function getProjects(): Promise<ProjectEntry[]> {
  const projects = await getCollection("projects");

  return projects.sort((a, b) => a.data.order - b.data.order);
}

export function getProjectStatuses(projects: ProjectEntry[]): string[] {
  return [...new Set(projects.map((project) => project.data.status))];
}

export function getProjectTechnologies(projects: ProjectEntry[]): string[] {
  return [
    ...new Set(projects.flatMap((project) => project.data.technologies)),
  ].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

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
