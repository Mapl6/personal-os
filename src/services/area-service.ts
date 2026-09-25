import { createId } from "@/lib/utils/id";
import { areaSchema, projectSchema, type Area, type Project } from "@/types/domain";
import { must, type ServiceContext } from "./context";

export type AreaInput = Pick<Area, "name" | "color"> & Partial<Pick<Area, "description" | "keywords" | "order">>;
export type ProjectInput = Pick<Project, "name"> &
  Partial<Pick<Project, "description" | "areaId" | "status" | "deadline">>;

export function createAreaService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();

  return {
    async create(input: AreaInput): Promise<Area> {
      const areas = await store.areas.list();
      const area = areaSchema.parse({
        id: createId("area"),
        description: "",
        keywords: [],
        order: areas.length,
        ...input,
        archived: false,
        createdAt: iso(),
      });
      return store.areas.put(area);
    },
    async update(id: string, patch: Partial<AreaInput & { archived: boolean }>): Promise<Area> {
      const area = await must(store.areas.get(id), "Area");
      return store.areas.put(areaSchema.parse({ ...area, ...patch }));
    },
    /** Deletes the area; its tasks/projects are kept but detached. */
    async remove(id: string): Promise<void> {
      const [tasks, projects] = await Promise.all([store.tasks.listBy("areaId", id), store.projects.listBy("areaId", id)]);
      await store.tasks.putMany(tasks.map((t) => ({ ...t, areaId: null })));
      await store.projects.putMany(projects.map((p) => ({ ...p, areaId: null })));
      await store.areas.delete(id);
    },
  };
}

export function createProjectService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();

  return {
    async create(input: ProjectInput): Promise<Project> {
      const project = projectSchema.parse({
        id: createId("proj"),
        description: "",
        areaId: null,
        status: "active",
        deadline: null,
        ...input,
        createdAt: iso(),
        updatedAt: iso(),
      });
      return store.projects.put(project);
    },
    async update(id: string, patch: Partial<ProjectInput>): Promise<Project> {
      const project = await must(store.projects.get(id), "Project");
      return store.projects.put(projectSchema.parse({ ...project, ...patch, updatedAt: iso() }));
    },
    /** Deletes a project; its tasks are kept but detached. */
    async remove(id: string): Promise<void> {
      const tasks = await store.tasks.listBy("projectId", id);
      await store.tasks.putMany(tasks.map((t) => ({ ...t, projectId: null })));
      await store.projects.delete(id);
    },
  };
}

export type AreaService = ReturnType<typeof createAreaService>;
export type ProjectService = ReturnType<typeof createProjectService>;
