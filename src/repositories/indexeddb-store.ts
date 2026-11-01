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
  type MetaRepository,
  type SettingsRepository,
} from "./types";

const DB_NAME = "personal-os";
/** Bump when collections or indexes change; upgrade() only adds what is missing. */
const DB_VERSION = 2;
const META_STORE = "meta";

type DB = IDBPDatabase<unknown>;

function openDatabase(name = DB_NAME): Promise<DB> {
  return openDB(name, DB_VERSION, {
    upgrade(db, _old, _new, tx) {
      for (const collection of COLLECTION_NAMES) {
        const store = db.objectStoreNames.contains(collection)
          ? tx.objectStore(collection)
          : db.createObjectStore(collection, { keyPath: "id" });
        for (const index of COLLECTION_INDEXES[collection]) {
          if (!store.indexNames.contains(index)) store.createIndex(index, index, { unique: false });
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

class IndexedDbMeta implements MetaRepository {
  constructor(private readonly db: Promise<DB>) {}
  async get<T>(key: string) {
    return (await (await this.db).get(META_STORE, key)) as T | undefined;
  }
  async set(key: string, value: unknown) {
    await (await this.db).put(META_STORE, value, key);
  }
  async delete(key: string) {
    await (await this.db).delete(META_STORE, key);
  }
}

export function createIndexedDbStore(name?: string): DataStore {
  const db = openDatabase(name);
  const collections = Object.fromEntries(COLLECTION_NAMES.map((n) => [n, new IndexedDbCollection(db, n)]));
  return {
    ...(collections as unknown as Omit<DataStore, "settings" | "meta">),
    settings: new IndexedDbSettings(db),
    meta: new IndexedDbMeta(db),
  };
}
