import { extractLinks } from "@/lib/pages/links";
import { refKey, type EntityRef, type Link } from "@/types/domain";
import type { ServiceContext } from "./context";

/** The link index: outgoing references per document, queried backwards for backlinks. */
export function createLinkService(ctx: ServiceContext) {
  const { store } = ctx;
  return {
    /** Replaces every link from `from` with the ones found in `doc`. */
    async reindex(from: EntityRef, doc: readonly unknown[]): Promise<Link[]> {
      const fromKey = refKey(from);
      const old = await store.links.listBy("fromKey", fromKey);
      const next: Link[] = extractLinks(doc)
        .filter((l) => refKey(l.to) !== fromKey)
        .map((l) => ({
          id: `${fromKey}>${refKey(l.to)}#${l.blockId}#${l.kind}`,
          fromKey,
          from,
          fromBlockId: l.blockId,
          toKey: refKey(l.to),
          to: l.to,
          kind: l.kind,
          context: l.context,
        }));
      const keep = new Set(next.map((l) => l.id));
      await store.links.deleteMany(old.filter((l) => !keep.has(l.id)).map((l) => l.id));
      await store.links.putMany(next);
      return next;
    },
    async clear(from: EntityRef) {
      const old = await store.links.listBy("fromKey", refKey(from));
      await store.links.deleteMany(old.map((l) => l.id));
    },
    async backlinks(to: EntityRef): Promise<Link[]> {
      return store.links.listBy("toKey", refKey(to));
    },
    async outgoing(from: EntityRef): Promise<Link[]> {
      return store.links.listBy("fromKey", refKey(from));
    },
    /** All tags with how many places use them. */
    async tags(): Promise<{ tag: string; count: number }[]> {
      const counts = new Map<string, number>();
      for (const l of await store.links.list()) if (l.to.type === "tag") counts.set(l.to.id, (counts.get(l.to.id) ?? 0) + 1);
      return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
    },
  };
}

export type LinkService = ReturnType<typeof createLinkService>;
