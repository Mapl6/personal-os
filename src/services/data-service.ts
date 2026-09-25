import { z } from "zod";
import { COLLECTION_NAMES, type DataStore } from "@/repositories/types";
import {
  areaSchema,
  goalProgressSchema,
  goalSchema,
  habitEntrySchema,
  habitSchema,
  projectSchema,
  reviewSchema,
  scheduleBlockSchema,
  settingsSchema,
  taskSchema,
  timeEntrySchema,
  weekTemplateSchema,
  DEFAULT_SETTINGS,
  type Settings,
} from "@/types/domain";
import type { ServiceContext } from "./context";

export const EXPORT_VERSION = 1;

export const exportSchema = z.object({
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.string(),
  settings: settingsSchema,
  areas: z.array(areaSchema),
  projects: z.array(projectSchema),
  tasks: z.array(taskSchema),
  blocks: z.array(scheduleBlockSchema),
  timeEntries: z.array(timeEntrySchema),
  goals: z.array(goalSchema),
  goalProgress: z.array(goalProgressSchema),
  habits: z.array(habitSchema),
  habitEntries: z.array(habitEntrySchema),
  reviews: z.array(reviewSchema),
  templates: z.array(weekTemplateSchema),
});
export type ExportData = z.infer<typeof exportSchema>;

export function createDataService(ctx: ServiceContext) {
  const { store } = ctx;

  async function exportAll(): Promise<ExportData> {
    const entries = await Promise.all(COLLECTION_NAMES.map(async (n) => [n, await store[n].list()] as const));
    return {
      version: EXPORT_VERSION,
      exportedAt: ctx.now().toISOString(),
      settings: await store.settings.get(),
      ...(Object.fromEntries(entries) as Omit<ExportData, "version" | "exportedAt" | "settings">),
    };
  }

  async function clearAll(store: DataStore) {
    await Promise.all(COLLECTION_NAMES.map((n) => store[n].clear()));
  }

  /** Validates the payload fully before touching existing data. */
  async function importAll(raw: unknown): Promise<{ counts: Record<string, number> }> {
    const parsed = exportSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`Invalid backup file: ${issue.path.join(".") || "root"} — ${issue.message}`);
    }
    const data = parsed.data;
    await clearAll(store);
    const counts: Record<string, number> = {};
    for (const name of COLLECTION_NAMES) {
      const items = data[name] as { id: string }[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (store[name] as any).putMany(items);
      counts[name] = items.length;
    }
    await store.settings.save(data.settings);
    return { counts };
  }

  async function reset(): Promise<void> {
    await clearAll(store);
    await store.settings.save(DEFAULT_SETTINGS);
  }

  async function getSettings(): Promise<Settings> {
    return store.settings.get();
  }

  async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await store.settings.get();
    return store.settings.save(settingsSchema.parse({ ...current, ...patch, id: "settings" }));
  }

  return { exportAll, importAll, reset, getSettings, saveSettings };
}

export type DataService = ReturnType<typeof createDataService>;
