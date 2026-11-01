import { COLLECTION_NAMES, type DataStore } from "./types";

/** One write, described after it succeeded. */
export interface Change {
  /** Collection name, or "settings" / "meta". */
  collection: string;
  op: "put" | "delete" | "clear";
  ids: string[];
}

type Listener = (changes: Change[]) => void;

/**
 * Change feed: a DataStore decorator that announces every successful write.
 * Indexers (links, search) and the UI cache subscribe to it instead of each
 * mutation having to know what to refresh. Changes made in the same tick are
 * delivered together.
 */
export function createChangeFeed() {
  const listeners = new Set<Listener>();
  let pending: Change[] = [];
  let scheduled = false;

  const flush = () => {
    scheduled = false;
    const batch = pending;
    pending = [];
    if (batch.length) listeners.forEach((l) => l(batch));
  };

  return {
    emit(change: Change) {
      pending.push(change);
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(flush);
      }
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type ChangeFeed = ReturnType<typeof createChangeFeed>;

export function withChangeFeed(store: DataStore, feed: ChangeFeed): DataStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped: any = { ...store };
  for (const name of COLLECTION_NAMES) {
    const repo = store[name];
    wrapped[name] = {
      list: () => repo.list(),
      get: (id: string) => repo.get(id),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listByRange: (f: any, a: string, b: string) => repo.listByRange(f, a, b),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listBy: (f: any, v: string) => repo.listBy(f, v),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async put(item: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = await (repo as any).put(item);
        feed.emit({ collection: name, op: "put", ids: [item.id] });
        return r;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async putMany(items: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (repo as any).putMany(items);
        if (items.length) feed.emit({ collection: name, op: "put", ids: items.map((i) => i.id) });
      },
      async delete(id: string) {
        await repo.delete(id);
        feed.emit({ collection: name, op: "delete", ids: [id] });
      },
      async deleteMany(ids: string[]) {
        await repo.deleteMany(ids);
        if (ids.length) feed.emit({ collection: name, op: "delete", ids });
      },
      async clear() {
        await repo.clear();
        feed.emit({ collection: name, op: "clear", ids: [] });
      },
    };
  }
  wrapped.settings = {
    get: () => store.settings.get(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async save(s: any) {
      const r = await store.settings.save(s);
      feed.emit({ collection: "settings", op: "put", ids: ["settings"] });
      return r;
    },
  };
  return wrapped as DataStore;
}
