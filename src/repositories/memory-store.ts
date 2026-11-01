import { deepClone } from "@/lib/utils/clone";
import { DEFAULT_SETTINGS, type Settings } from "@/types/domain";
import { COLLECTION_NAMES, type CollectionRepository, type DataStore, type Entity, type IndexedField, type MetaRepository, type SettingsRepository } from "./types";

const clone = deepClone;

export class MemoryCollection<T extends Entity> implements CollectionRepository<T> {
  private items = new Map<string, T>();

  async list() {
    return [...this.items.values()].map(clone);
  }
  async get(id: string) {
    const item = this.items.get(id);
    return item ? clone(item) : undefined;
  }
  async listByRange(field: IndexedField<T>, from: string, to: string) {
    return (await this.list()).filter((item) => {
      const value = item[field] as unknown;
      return typeof value === "string" && value >= from && value <= to;
    });
  }
  async listBy(field: IndexedField<T>, value: string) {
    return (await this.list()).filter((item) => (item[field] as unknown) === value);
  }
  async put(item: T) {
    this.items.set(item.id, clone(item));
    return clone(item);
  }
  async putMany(items: T[]) {
    for (const item of items) this.items.set(item.id, clone(item));
  }
  async delete(id: string) {
    this.items.delete(id);
  }
  async deleteMany(ids: string[]) {
    for (const id of ids) this.items.delete(id);
  }
  async clear() {
    this.items.clear();
  }
}

class MemorySettings implements SettingsRepository {
  private value: Settings = clone(DEFAULT_SETTINGS);
  async get() {
    return clone(this.value);
  }
  async save(settings: Settings) {
    this.value = clone(settings);
    return clone(settings);
  }
}

class MemoryMeta implements MetaRepository {
  private values = new Map<string, unknown>();
  async get<T>(key: string) {
    return clone(this.values.get(key)) as T | undefined;
  }
  async set(key: string, value: unknown) {
    this.values.set(key, clone(value));
  }
  async delete(key: string) {
    this.values.delete(key);
  }
}

/** In-memory store: used by tests and as an SSR/no-IndexedDB fallback. */
export function createMemoryStore(): DataStore {
  const collections = Object.fromEntries(COLLECTION_NAMES.map((n) => [n, new MemoryCollection()]));
  return {
    ...(collections as unknown as Omit<DataStore, "settings" | "meta">),
    settings: new MemorySettings(),
    meta: new MemoryMeta(),
  };
}
