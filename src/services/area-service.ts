import { createId } from "@/lib/utils/id";
import { createTrashService } from "./trash-service";
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
        updatedAt: iso(),
      });
      return store.areas.put(area);
    },
    async update(id: string, patch: Partial<AreaInput & { archived: boolean }>): Promise<Area> {
      const area = await must(store.areas.get(id), "Area");
      return store.areas.put(areaSchema.parse({ ...area, ...patch, updatedAt: iso() }));
    },
    /** Moves the area to the trash; its tasks/projects are kept, detached, and re-attached on restore. */
    async remove(id: string) {
      const area = await must(store.areas.get(id), "Area");
      const [tasks, projects] = await Promise.all([store.tasks.listBy("areaId", id), store.projects.listBy("areaId", id)]);
      return createTrashService(ctx).moveToTrash({
        type: "area",
        entityId: id,
        title: area.name,
        rows: [{ collection: "areas", row: area }],
        relinks: [
          ...tasks.map((t) => ({ collection: "tasks" as const, id: t.id, field: "areaId", value: id })),
          ...projects.map((p) => ({ collection: "projects" as const, id: p.id, field: "areaId", value: id })),
        ],
      });
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
    /** Moves the project to the trash; its tasks are kept, detached, and re-attached on restore. */
    async remove(id: string) {
      const project = await must(store.projects.get(id), "Project");
      const tasks = await store.tasks.listBy("projectId", id);
      return createTrashService(ctx).moveToTrash({
        type: "project",
        entityId: id,
        title: project.name,
        rows: [{ collection: "projects", row: project }],
        relinks: tasks.map((t) => ({ collection: "tasks" as const, id: t.id, field: "projectId", value: id })),
      });
    },
  };
}

export type AreaService = ReturnType<typeof createAreaService>;
export type ProjectService = ReturnType<typeof createProjectService>;
