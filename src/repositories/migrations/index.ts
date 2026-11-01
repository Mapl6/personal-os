import { deepClone } from "@/lib/utils/clone";
import { createId } from "@/lib/utils/id";
import { EPOCH } from "@/types/domain";
import { COLLECTION_NAMES, type DataStore } from "../types";

/**
 * Data migrations.
 *
 * Each migration is a pure transform over plain data, so the same code
 * upgrades the live database (`runStoreMigrations`) and old backup files
 * (`migrateData` inside import). Structural changes (new object stores,
 * indexes) happen in the IndexedDB `upgrade()`; these only reshape rows.
 *
 * Adding one: append to MIGRATIONS with the next version, bump nothing else.
 */

type Row = Record<string, unknown>;

export interface RawData {
  version: number;
  settings: Row;
  collections: Record<string, Row[]>;
}

export interface Migration {
  version: number;
  name: string;
  up(data: RawData, nowIso: string): void;
}

const rows = (data: RawData, name: string): Row[] => (data.collections[name] ??= []);

export const MIGRATIONS: Migration[] = [
  {
    version: 2,
    name: "Base fields: updatedAt on every entity, Phase 1 collections",
    up(data) {
      const fill = (name: string, from: string) => {
        for (const r of rows(data, name)) {
          if (typeof r.updatedAt !== "string" || !r.updatedAt) r.updatedAt = (r[from] as string) || EPOCH;
        }
      };
      fill("areas", "createdAt");
      fill("habits", "createdAt");
      fill("habitEntries", "createdAt");
      fill("goalProgress", "createdAt");
      fill("timeEntries", "start");
      for (const name of COLLECTION_NAMES) rows(data, name);
    },
  },
  {
    version: 3,
    name: "Check-ins: energy from daily reviews becomes check-in history",
    up(data, nowIso) {
      const checkIns = rows(data, "checkIns");
      const have = new Set(checkIns.map((c) => `${c.date}`));
      for (const r of rows(data, "reviews")) {
        if (r.type !== "daily" || typeof r.energy !== "number" || have.has(String(r.periodStart))) continue;
        const at = (r.updatedAt as string) || nowIso;
        checkIns.push({
          id: createId("ci"),
          date: r.periodStart,
          at,
          mood: null,
          energy: r.energy,
          note: "",
          createdAt: (r.createdAt as string) || at,
          updatedAt: at,
        });
      }
    },
  },
];

export const SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Applies every migration newer than `data.version`, in order. Mutates and returns `data`. */
export function migrateData(data: RawData, nowIso: string): RawData {
  if (data.version > SCHEMA_VERSION) {
    throw new Error(`This data was made by a newer version of the app (schema ${data.version}). Update the app first.`);
  }
  for (const m of MIGRATIONS) {
    if (m.version <= data.version) continue;
    m.up(data, nowIso);
    data.version = m.version;
  }
  return data;
}

export async function readRaw(store: DataStore, version: number): Promise<RawData> {
  const collections: Record<string, Row[]> = {};
  for (const name of COLLECTION_NAMES) collections[name] = (await store[name].list()) as unknown as Row[];
  return { version, settings: (await store.settings.get()) as unknown as Row, collections };
}

export interface Snapshot {
  id: string;
  createdAt: string;
  reason: string;
  data: RawData;
}

const SNAPSHOT_KEY = "snapshots";
const MAX_SNAPSHOTS = 3;

export async function listSnapshots(store: DataStore): Promise<Snapshot[]> {
  return (await store.meta.get<Snapshot[]>(SNAPSHOT_KEY)) ?? [];
}

export async function saveSnapshot(store: DataStore, data: RawData, reason: string, nowIso: string): Promise<Snapshot> {
  const snap: Snapshot = { id: createId("snap"), createdAt: nowIso, reason, data };
  const all = [snap, ...(await listSnapshots(store))].slice(0, MAX_SNAPSHOTS);
  await store.meta.set(SNAPSHOT_KEY, all);
  return snap;
}

/** Replaces every collection and the settings with `data` (already migrated and validated). */
export async function writeRaw(store: DataStore, data: RawData): Promise<void> {
  for (const name of COLLECTION_NAMES) {
    await store[name].clear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (store[name] as any).putMany(data.collections[name] ?? []);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await store.settings.save(data.settings as any);
}

const VERSION_KEY = "schemaVersion";

/**
 * Brings the stored data up to SCHEMA_VERSION. A fresh install is stamped
 * without migrating; an older one gets a snapshot first, so a bad migration
 * can be rolled back from Settings → Data.
 */
export async function runStoreMigrations(
  store: DataStore,
  nowIso: string,
): Promise<{ from: number; to: number; migrated: boolean }> {
  let version = await store.meta.get<number>(VERSION_KEY);
  if (version === undefined) {
    const settings = await store.settings.get();
    const hasData = settings.onboarded || (await store.tasks.list()).length > 0;
    version = hasData ? 1 : SCHEMA_VERSION;
  }
  if (version >= SCHEMA_VERSION) {
    await store.meta.set(VERSION_KEY, version);
    return { from: version, to: version, migrated: false };
  }
  const before = await readRaw(store, version);
  await saveSnapshot(store, deepClone(before), `Before upgrading data from v${version} to v${SCHEMA_VERSION}`, nowIso);
  const after = migrateData(deepClone(before), nowIso);
  await writeRaw(store, after);
  await store.meta.set(VERSION_KEY, SCHEMA_VERSION);
  return { from: version, to: SCHEMA_VERSION, migrated: true };
}

export async function setSchemaVersion(store: DataStore, version: number) {
  await store.meta.set(VERSION_KEY, version);
}
