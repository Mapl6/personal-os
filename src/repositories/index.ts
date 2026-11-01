import { createChangeFeed, withChangeFeed } from "./change-feed";
import { createIndexedDbStore } from "./indexeddb-store";
import { createMemoryStore } from "./memory-store";
import type { DataStore } from "./types";

export type * from "./types";
export { createMemoryStore } from "./memory-store";
export { createIndexedDbStore } from "./indexeddb-store";
export { createChangeFeed, withChangeFeed, type Change } from "./change-feed";

let store: DataStore | null = null;

/** The app-wide change feed: every write through getStore() is announced here. */
export const changeFeed = createChangeFeed();

/**
 * Returns the app-wide data store. Swap this factory to point at an API-backed
 * implementation when a real backend exists.
 */
export function getStore(): DataStore {
  if (store) return store;
  const base =
    typeof window !== "undefined" && "indexedDB" in window ? createIndexedDbStore() : createMemoryStore();
  store = withChangeFeed(base, changeFeed);
  return store;
}

/** Test hook: inject a store (e.g. an in-memory one). */
export function setStore(next: DataStore) {
  store = next;
}
