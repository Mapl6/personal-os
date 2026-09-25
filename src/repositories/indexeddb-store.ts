import { openDB, type IDBPDatabase } from "idb";
import { DEFAULT_SETTINGS, settingsSchema, type Settings } from "@/types/domain";
import {
  COLLECTION_INDEXES,
  COLLECTION_NAMES,
  type CollectionName,
  type CollectionRepository,
  type DataStore,
  type Entity,
  type IndexedField,
  type SettingsRepository,
} from "./types";

const DB_NAME = "personal-os";
const DB_VERSION = 1;
const META_STORE = "meta";

type DB = IDBPDatabase<unknown>;

function openDatabase(name = DB_NAME): Promise<DB> {
  return openDB(name, DB_VERSION, {
    upgrade(db) {
      for (const collection of COLLECTION_NAMES) {
        if (db.objectStoreNames.contains(collection)) continue;
        const store = db.createObjectStore(collection, { keyPath: "id" });
        for (const index of COLLECTION_INDEXES[collection]) {
          store.createIndex(index, index, { unique: false });
        }
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    },
  });
}

class IndexedDbCollection<T extends Entity> implements CollectionRepository<T> {
  constructor(
    private readonly db: Promise<DB>,
    private readonly name: CollectionName,
  ) {}

  private hasIndex(field: string) {
    return COLLECTION_INDEXES[this.name].includes(field);
  }

  async list() {
    return (await (await this.db).getAll(this.name)) as T[];
  }
  async get(id: string) {
    return (await (await this.db).get(this.name, id)) as T | undefined;
  }
  async listByRange(field: IndexedField<T>, from: string, to: string) {
    const db = await this.db;
    if (this.hasIndex(field)) {
      return (await db.getAllFromIndex(this.name, field, IDBKeyRange.bound(from, to))) as T[];
    }
    return (await this.list()).filter((item) => {
      const v = item[field] as unknown;
      return typeof v === "string" && v >= from && v <= to;
    });
  }
  async listBy(field: IndexedField<T>, value: string) {
    const db = await this.db;
    if (this.hasIndex(field)) {
      return (await db.getAllFromIndex(this.name, field, value)) as T[];
    }
    return (await this.list()).filter((item) => (item[field] as unknown) === value);
  }
  async put(item: T) {
    await (await this.db).put(this.name, item);
    return item;
  }
  async putMany(items: T[]) {
    if (items.length === 0) return;
    const tx = (await this.db).transaction(this.name, "readwrite");
    await Promise.all([...items.map((item) => tx.store.put(item)), tx.done]);
  }
  async delete(id: string) {
    await (await this.db).delete(this.name, id);
  }
  async deleteMany(ids: string[]) {
    if (ids.length === 0) return;
    const tx = (await this.db).transaction(this.name, "readwrite");
    await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
  }
  async clear() {
    await (await this.db).clear(this.name);
  }
}

class IndexedDbSettings implements SettingsRepository {
  constructor(private readonly db: Promise<DB>) {}
  async get(): Promise<Settings> {
    const raw = await (await this.db).get(META_STORE, "settings");
    const parsed = settingsSchema.safeParse(raw ?? DEFAULT_SETTINGS);
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  }
  async save(settings: Settings) {
    await (await this.db).put(META_STORE, settings, "settings");
    return settings;
  }
}

export function createIndexedDbStore(name?: string): DataStore {
  const db = openDatabase(name);
  const col = <T extends Entity>(n: CollectionName) => new IndexedDbCollection<T>(db, n);
  return {
    areas: col("areas"),
    projects: col("projects"),
    tasks: col("tasks"),
    blocks: col("blocks"),
    timeEntries: col("timeEntries"),
    goals: col("goals"),
    goalProgress: col("goalProgress"),
    habits: col("habits"),
    habitEntries: col("habitEntries"),
    reviews: col("reviews"),
    templates: col("templates"),
    settings: new IndexedDbSettings(db),
  };
}
