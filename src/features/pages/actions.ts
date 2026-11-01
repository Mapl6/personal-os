"use client";

import { perform } from "@/hooks/perform";
import { getServices } from "@/services";
import type { Page } from "@/types/domain";

export const PAGE_KEYS = [["pages"], ["pageContents"], ["links"], ["trash"]];

export function pageTitle(p: Pick<Page, "title" | "kind" | "periodStart">): string {
  if (p.title) return p.title;
  if (p.kind === "daily" && p.periodStart) return `Daily note · ${p.periodStart}`;
  if (p.kind === "weekly" && p.periodStart) return `Week of ${p.periodStart}`;
  if (p.kind === "monthly" && p.periodStart) return `Month · ${p.periodStart.slice(0, 7)}`;
  return "Untitled";
}

export const pageActions = {
  create: (parentId: string | null = null, title = "") =>
    perform(() => getServices().pages.create({ parentId, title }), { invalidate: PAGE_KEYS }),
  rename: (id: string, title: string) => perform(() => getServices().pages.update(id, { title }), { invalidate: [["pages"]] }),
  setIcon: (id: string, icon: string | null) => perform(() => getServices().pages.update(id, { icon }), { invalidate: [["pages"]] }),
  favourite: (p: Page) =>
    perform(() => getServices().pages.update(p.id, { favourite: !p.favourite }), {
      success: p.favourite ? "Removed from favourites" : "Added to favourites",
      invalidate: [["pages"]],
    }),
  move: (id: string, to: { parentId: string | null; after?: string | null; before?: string | null }) =>
    perform(() => getServices().pages.move(id, to), { invalidate: [["pages"]] }),
  remove: (p: Page) =>
    perform(() => getServices().pages.remove(p.id), {
      success: `Moved “${pageTitle(p)}” to trash`,
      invalidate: PAGE_KEYS,
      undo: (t) => getServices().trash.restore(t.id),
    }),
};

/** Children of each page (and root under `null`), ordered, excluding period notes. */
export function buildTree(pages: Page[]): Map<string | null, Page[]> {
  const map = new Map<string | null, Page[]>();
  for (const p of pages) {
    if (p.kind !== "page" && p.kind !== "template") continue;
    const k = p.parentId && pages.some((x) => x.id === p.parentId) ? p.parentId : null;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(p);
  }
  for (const list of map.values()) list.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  return map;
}

export function ancestors(pages: Page[], id: string): Page[] {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const out: Page[] = [];
  let cur = byId.get(id)?.parentId;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const p = byId.get(cur);
    if (!p) break;
    out.unshift(p);
    cur = p.parentId;
  }
  return out;
}
