import { createId } from "@/lib/utils/id";
import type { CollectionName, DataStore } from "@/repositories/types";
import type { EntityType, TrashItem } from "@/types/domain";
import { must, type ServiceContext } from "./context";

type Row = { id: string } & Record<string, unknown>;

export interface TrashRow {
  collection: CollectionName;
  row: Row;
}

/** A foreign key cleared on another row. On restore: re-set if still empty, or re-added if it is an array. */
export interface Relink {
  collection: CollectionName;
  id: string;
  field: string;
  value: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const repo = (store: DataStore, name: CollectionName) => store[name] as any;

/**
 * Soft delete as bundles: deleting an entity moves it, and everything that
 * cascades with it, into one trash item; restoring puts all of it back.
 * Live collections never contain deleted rows, so no query needs a filter.
 */
export function createTrashService(ctx: ServiceContext) {
  const { store } = ctx;

  async function moveToTrash(input: {
    type: EntityType;
    entityId: string;
    title: string;
    rows: TrashRow[];
    relinks?: Relink[];
  }): Promise<TrashItem> {
    const relinks = input.relinks ?? [];
    const item: TrashItem = {
      id: createId("trash"),
      type: input.type,
      entityId: input.entityId,
      title: input.title || "Untitled",
      deletedAt: ctx.now().toISOString(),
      rows: input.rows.map((r) => ({ collection: r.collection, row: r.row })),
      relinks,
    };
    await store.trash.put(item);
    for (const link of relinks) {
      const row = (await repo(store, link.collection).get(link.id)) as Row | undefined;
      if (!row) continue;
      const current = row[link.field];
      const next = Array.isArray(current) ? current.filter((v) => v !== link.value) : null;
      await repo(store, link.collection).put({ ...row, [link.field]: next });
    }
    const byCollection = new Map<CollectionName, string[]>();
    for (const r of input.rows) byCollection.set(r.collection, [...(byCollection.get(r.collection) ?? []), r.row.id]);
    for (const [name, ids] of byCollection) await repo(store, name).deleteMany(ids);
    return item;
  }

  async function restore(trashId: string): Promise<TrashItem> {
    const item = await must(store.trash.get(trashId), "Trash item");
    const byCollection = new Map<string, Row[]>();
    for (const r of item.rows) byCollection.set(r.collection, [...(byCollection.get(r.collection) ?? []), r.row as Row]);
    for (const [name, rows] of byCollection) await repo(store, name as CollectionName).putMany(rows);
    for (const link of item.relinks) {
      const row = (await repo(store, link.collection as CollectionName).get(link.id)) as Row | undefined;
      if (!row) continue;
      const current = row[link.field];
      if (Array.isArray(current)) {
        if (!current.includes(link.value)) await repo(store, link.collection as CollectionName).put({ ...row, [link.field]: [...current, link.value] });
      } else if (current === null || current === undefined) {
        await repo(store, link.collection as CollectionName).put({ ...row, [link.field]: link.value });
      }
    }
    await store.trash.delete(trashId);
    return item;
  }

  return {
    moveToTrash,
    restore,
    async list(): Promise<TrashItem[]> {
      return (await store.trash.list()).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
    },
    async deleteForever(trashId: string) {
      await store.trash.delete(trashId);
    },
    async empty(): Promise<number> {
      const all = await store.trash.list();
      await store.trash.clear();
      return all.length;
    },
  };
}

export type TrashService = ReturnType<typeof createTrashService>;
