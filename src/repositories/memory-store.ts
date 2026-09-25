import { DEFAULT_SETTINGS, type Settings } from "@/types/domain";
import type { CollectionRepository, DataStore, Entity, IndexedField, SettingsRepository } from "./types";

const clone = <T,>(value: T): T => structuredClone(value);

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

/** In-memory store: used by tests and as an SSR/no-IndexedDB fallback. */
export function createMemoryStore(): DataStore {
  return {
    areas: new MemoryCollection(),
    projects: new MemoryCollection(),
    tasks: new MemoryCollection(),
    blocks: new MemoryCollection(),
    timeEntries: new MemoryCollection(),
    goals: new MemoryCollection(),
    goalProgress: new MemoryCollection(),
    habits: new MemoryCollection(),
    habitEntries: new MemoryCollection(),
    reviews: new MemoryCollection(),
    templates: new MemoryCollection(),
    settings: new MemorySettings(),
  };
}
