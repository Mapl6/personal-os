import { addDaysKey, weekdayOf, type DateKey } from "@/lib/date";
import type { PlanChange } from "@/lib/planning/changes";
import { createId } from "@/lib/utils/id";
import { weekTemplateSchema, type TemplateItem, type WeekTemplate } from "@/types/domain";
import { must, type ServiceContext } from "./context";

export function createTemplateService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();

  return {
    async create(name: string, items: Omit<TemplateItem, "id">[]): Promise<WeekTemplate> {
      return store.templates.put(
        weekTemplateSchema.parse({
          id: createId("tpl"),
          name,
          items: items.map((i) => ({ ...i, id: createId("tpi") })),
          createdAt: iso(),
          updatedAt: iso(),
        }),
      );
    },
    async update(id: string, patch: { name?: string; items?: (Omit<TemplateItem, "id"> & { id?: string })[] }) {
      const tpl = await must(store.templates.get(id), "Template");
      return store.templates.put(
        weekTemplateSchema.parse({
          ...tpl,
          name: patch.name ?? tpl.name,
          items: (patch.items ?? tpl.items).map((i) => ({ ...i, id: i.id ?? createId("tpi") })),
          updatedAt: iso(),
        }),
      );
    },
    async remove(id: string) {
      await store.templates.delete(id);
    },
    /**
     * Proposes the tasks a template would add to the week starting at
     * `weekStart`. Items that already exist that day (same title) are skipped
     * so applying twice doesn't duplicate anything. Past days are skipped.
     */
    async proposeApply(templateId: string, weekStart: DateKey, today: DateKey): Promise<PlanChange[]> {
      const tpl = await must(store.templates.get(templateId), "Template");
      const [blocks, tasks] = await Promise.all([
        store.blocks.listByRange("date", weekStart, addDaysKey(weekStart, 6)),
        store.tasks.list(),
      ]);
      const titleOf = new Map(tasks.map((t) => [t.id, t.title.toLowerCase()]));
      const changes: PlanChange[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDaysKey(weekStart, i);
        if (date < today) continue;
        const existing = new Set(blocks.filter((b) => b.date === date).map((b) => titleOf.get(b.taskId)));
        for (const item of tpl.items.filter((it) => it.weekday === weekdayOf(date))) {
          if (existing.has(item.title.toLowerCase())) continue;
          changes.push({
            kind: "create_task",
            title: item.title,
            areaId: item.areaId,
            projectId: item.projectId,
            durationMinutes: item.durationMinutes,
            date,
            startMinutes: item.startMinutes,
          });
        }
      }
      return changes;
    },
  };
}

export type TemplateService = ReturnType<typeof createTemplateService>;
