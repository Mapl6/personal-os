import { deepClone } from "@/lib/utils/clone";
import { z } from "zod";
import {
  listSnapshots,
  migrateData,
  readRaw,
  runStoreMigrations,
  saveSnapshot,
  SCHEMA_VERSION,
  setSchemaVersion,
  writeRaw,
  type RawData,
} from "@/repositories/migrations";
import { COLLECTION_NAMES, type DataStore } from "@/repositories/types";
import {
  attachmentSchema,
  checkInSchema,
  dayRatingSchema,
  inboxItemSchema,
  linkSchema,
  pageContentSchema,
  pageSchema,
  trashItemSchema,
  TRASH_RETENTION_DAYS,
  type Attachment,
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

/** Backups carry the schema version; older files are migrated on import. */
export const EXPORT_VERSION = SCHEMA_VERSION;

/** Attachments travel as data URLs inside JSON backups. */
const exportedAttachmentSchema = attachmentSchema.extend({ blob: z.string() });

export const exportSchema = z.object({
  version: z.number().int().min(1),
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
  trash: z.array(trashItemSchema).default([]),
  inbox: z.array(inboxItemSchema).default([]),
  attachments: z.array(exportedAttachmentSchema).default([]),
  checkIns: z.array(checkInSchema).default([]),
  dayRatings: z.array(dayRatingSchema).default([]),
  pages: z.array(pageSchema).default([]),
  pageContents: z.array(pageContentSchema).default([]),
  links: z.array(linkSchema).default([]),
});
export type ExportData = z.infer<typeof exportSchema>;

export async function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof blob.arrayBuffer === "function") {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${blob.type || "application/octet-stream"};base64,${btoa(binary)}`;
  }
  // Older engines (and jsdom) only offer FileReader.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(url: string): Blob {
  const m = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(url);
  if (!m) throw new Error("Invalid attachment data in backup");
  const bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: m[1] || "application/octet-stream" });
}

export function createDataService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();

  async function exportAll(): Promise<ExportData> {
    const entries = await Promise.all(COLLECTION_NAMES.map(async (n) => [n, await store[n].list()] as const));
    const data = Object.fromEntries(entries) as Record<string, unknown[]>;
    data.attachments = await Promise.all(
      (data.attachments as Attachment[]).map(async (a) => ({ ...a, blob: await blobToDataUrl(a.blob) })),
    );
    return {
      version: EXPORT_VERSION,
      exportedAt: iso(),
      settings: await store.settings.get(),
      ...(data as unknown as Omit<ExportData, "version" | "exportedAt" | "settings">),
    };
  }

  async function clearAll(store: DataStore) {
    await Promise.all(COLLECTION_NAMES.map((n) => store[n].clear()));
  }

  /**
   * Migrates an older backup to the current schema, validates all of it, and
   * only then replaces the stored data. A snapshot of the current data is
   * kept so an import can be undone from Settings → Data.
   */
  async function importAll(raw: unknown): Promise<{ counts: Record<string, number> }> {
    if (!raw || typeof raw !== "object" || typeof (raw as { version?: unknown }).version !== "number") {
      throw new Error("Invalid backup file: missing version");
    }
    const input = deepClone(raw) as Record<string, unknown>;
    const rawData: RawData = {
      version: input.version as number,
      settings: (input.settings ?? {}) as Record<string, unknown>,
      collections: Object.fromEntries(
        COLLECTION_NAMES.map((n) => [n, Array.isArray(input[n]) ? (input[n] as Record<string, unknown>[]) : []]),
      ),
    };
    const migrated = migrateData(rawData, iso());
    const parsed = exportSchema.safeParse({
      version: migrated.version,
      exportedAt: String(input.exportedAt ?? iso()),
      settings: migrated.settings,
      ...migrated.collections,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`Invalid backup file: ${issue.path.join(".") || "root"} — ${issue.message}`);
    }
    const data = parsed.data;
    const collections: Record<string, unknown[]> = {};
    for (const name of COLLECTION_NAMES) collections[name] = data[name] as unknown[];
    collections.attachments = data.attachments.map((a) => ({ ...a, blob: dataUrlToBlob(a.blob) }));

    await saveSnapshot(store, await readRaw(store, SCHEMA_VERSION), "Before importing a backup", iso());
    await clearAll(store);
    const counts: Record<string, number> = {};
    for (const name of COLLECTION_NAMES) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (store[name] as any).putMany(collections[name]);
      counts[name] = collections[name].length;
    }
    await store.settings.save(data.settings);
    await setSchemaVersion(store, SCHEMA_VERSION);
    return { counts };
  }

  /** Startup work: upgrade data, then purge trash older than the retention window. */
  async function boot(): Promise<{ migratedFrom: number | null; purged: number }> {
    const result = await runStoreMigrations(store, iso());
    const cutoff = new Date(ctx.now().getTime() - TRASH_RETENTION_DAYS * 864e5).toISOString();
    const old = await store.trash.listByRange("deletedAt", "0000", cutoff);
    await store.trash.deleteMany(old.map((t) => t.id));
    return { migratedFrom: result.migrated ? result.from : null, purged: old.length };
  }

  async function snapshots() {
    return (await listSnapshots(store)).map(({ id, createdAt, reason, data }) => ({
      id,
      createdAt,
      reason,
      tasks: data.collections.tasks?.length ?? 0,
    }));
  }

  /** Rolls back to a snapshot (itself snapshotting the current data first). */
  async function restoreSnapshot(id: string): Promise<void> {
    const snap = (await listSnapshots(store)).find((s) => s.id === id);
    if (!snap) throw new Error("Snapshot not found");
    const current = await readRaw(store, SCHEMA_VERSION);
    const migrated = migrateData(deepClone(snap.data), iso());
    await saveSnapshot(store, current, "Before restoring a snapshot", iso());
    await writeRaw(store, migrated);
    await setSchemaVersion(store, SCHEMA_VERSION);
  }

  async function reset(): Promise<void> {
    await clearAll(store);
    await store.settings.save(DEFAULT_SETTINGS);
    await setSchemaVersion(store, SCHEMA_VERSION);
  }

  async function getSettings(): Promise<Settings> {
    const settings = await store.settings.get();
    // v1 (WattVision design): indigo was the old default accent, move it to cyan once.
    if (settings.appearanceVersion < 1) {
      return store.settings.save({ ...settings, accent: settings.accent === "indigo" ? "cyan" : settings.accent, appearanceVersion: 1 });
    }
    return settings;
  }

  async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await store.settings.get();
    return store.settings.save(settingsSchema.parse({ ...current, ...patch, id: "settings" }));
  }

  return { exportAll, importAll, reset, getSettings, saveSettings, boot, snapshots, restoreSnapshot };
}

export type DataService = ReturnType<typeof createDataService>;
