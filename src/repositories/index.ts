import { createIndexedDbStore } from "./indexeddb-store";
import { createMemoryStore } from "./memory-store";
import type { DataStore } from "./types";

export type * from "./types";
export { createMemoryStore } from "./memory-store";
export { createIndexedDbStore } from "./indexeddb-store";

let store: DataStore | null = null;

/**
 * Returns the app-wide data store. Swap this factory to point at an API-backed
 * implementation when a real backend exists.
 */
export function getStore(): DataStore {
  if (store) return store;
  store =
    typeof window !== "undefined" && "indexedDB" in window
      ? createIndexedDbStore()
      : createMemoryStore();
  return store;
}

/** Test hook: inject a store (e.g. an in-memory one). */
export function setStore(next: DataStore) {
  store = next;
}
