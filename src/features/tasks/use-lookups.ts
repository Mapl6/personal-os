"use client";

import { useMemo } from "react";
import { useAreas, useProjects, useTasks } from "@/hooks/queries";
import type { Area, Project, Task } from "@/types/domain";

export interface Lookups {
  tasks: Task[];
  areas: Area[];
  projects: Project[];
  taskById: Map<string, Task>;
  areaById: Map<string, Area>;
  projectById: Map<string, Project>;
  isLoading: boolean;
}

/** Tasks/areas/projects plus id maps — memoised on the query results. */
export function useLookups(): Lookups {
  const tasks = useTasks();
  const areas = useAreas();
  const projects = useProjects();
  return useMemo(() => {
    const t = tasks.data ?? [];
    const a = areas.data ?? [];
    const p = projects.data ?? [];
    return {
      tasks: t,
      areas: a,
      projects: p,
      taskById: new Map(t.map((x) => [x.id, x])),
      areaById: new Map(a.map((x) => [x.id, x])),
      projectById: new Map(p.map((x) => [x.id, x])),
      isLoading: tasks.isLoading || areas.isLoading || projects.isLoading,
    };
  }, [tasks.data, areas.data, projects.data, tasks.isLoading, areas.isLoading, projects.isLoading]);
}
