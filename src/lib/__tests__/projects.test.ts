import { describe, expect, test } from "vitest";

import {
  getProjectStatuses,
  getProjectTechnologies,
  sortProjectsByOrder,
  type ProjectEntry,
} from "../projects";

function createProjectEntry({
  id,
  order,
  status,
  technologies = [],
}: {
  id: string;
  order: number;
  status: string;
  technologies?: string[];
}): ProjectEntry {
  return {
    id,

    data: {
      order,
      status,
      technologies,
    },
  } as unknown as ProjectEntry;
}

describe("project data utilities", () => {
  test("项目按照 order 从小到大排序", () => {
    const project3 = createProjectEntry({
      id: "project-3",
      order: 3,
      status: "规划中",
    });

    const project1 = createProjectEntry({
      id: "project-1",
      order: 1,
      status: "已上线",
    });

    const project2 = createProjectEntry({
      id: "project-2",
      order: 2,
      status: "已完成",
    });

    const result = sortProjectsByOrder([project3, project1, project2]);

    expect(result.map((project) => project.id)).toEqual([
      "project-1",
      "project-2",
      "project-3",
    ]);
  });

  test("项目排序不会修改原始数组", () => {
    const project2 = createProjectEntry({
      id: "project-2",
      order: 2,
      status: "已完成",
    });

    const project1 = createProjectEntry({
      id: "project-1",
      order: 1,
      status: "已上线",
    });

    const original = [project2, project1];

    sortProjectsByOrder(original);

    expect(original.map((project) => project.id)).toEqual([
      "project-2",
      "project-1",
    ]);
  });

  test("项目状态会自动去重", () => {
    const projects = [
      createProjectEntry({
        id: "project-1",
        order: 1,
        status: "已上线",
      }),

      createProjectEntry({
        id: "project-2",
        order: 2,
        status: "已完成",
      }),

      createProjectEntry({
        id: "project-3",
        order: 3,
        status: "已上线",
      }),
    ];

    const result = getProjectStatuses(projects);

    expect(result).toEqual(["已上线", "已完成"]);
  });

  test("项目技术会自动去重并排序", () => {
    const projects = [
      createProjectEntry({
        id: "project-1",
        order: 1,
        status: "已上线",

        technologies: ["JavaScript", "Astro"],
      }),

      createProjectEntry({
        id: "project-2",
        order: 2,
        status: "已完成",

        technologies: ["CSS", "Astro"],
      }),
    ];

    const result = getProjectTechnologies(projects);

    expect(result).toEqual(["Astro", "CSS", "JavaScript"]);
  });

  test("没有项目时返回空的状态和技术列表", () => {
    expect(getProjectStatuses([])).toEqual([]);

    expect(getProjectTechnologies([])).toEqual([]);
  });
});
