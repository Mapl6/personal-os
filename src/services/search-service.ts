import { buildIndex, search, type SearchDoc, type SearchFilters, type SearchSource } from "@/lib/search";
import { extractTags } from "@/lib/pages/links";
import type { ServiceContext } from "./context";

function pageTitle(p: { title: string; kind: string; periodStart: string | null }) {
  if (p.title) return p.title;
  if (p.kind === "daily" && p.periodStart) return `Daily note · ${p.periodStart}`;
  if (p.periodStart) return `${p.kind} note · ${p.periodStart}`;
  return "Untitled";
}

/** Gathers every searchable thing into one index. Pure reads; the caller caches. */
export function createSearchService(ctx: ServiceContext) {
  const { store } = ctx;

  async function sources(): Promise<SearchSource[]> {
    const [pages, contents, tasks, projects, areas, goals, habits, inbox] = await Promise.all([
      store.pages.list(),
      store.pageContents.list(),
      store.tasks.list(),
      store.projects.list(),
      store.areas.list(),
      store.goals.list(),
      store.habits.list(),
      store.inbox.list(),
    ]);
    const text = new Map(contents.map((c) => [c.id, c.text]));
    const out: SearchSource[] = [];
    for (const p of pages) {
      if (p.kind === "template") continue;
      const body = text.get(p.id) ?? "";
      const daily = p.kind !== "page";
      out.push({
        type: "page",
        id: p.id,
        title: pageTitle(p),
        body,
        href: daily && p.kind === "daily" ? `/daily/${p.periodStart}` : `/pages/${p.id}`,
        tags: [...new Set([...p.tags, ...extractTags(body)])],
        areaId: p.areaId,
        updatedAt: p.updatedAt,
        subtitle: daily ? "Daily note" : "Page",
      });
    }
    for (const t of tasks) {
      out.push({
        type: "task",
        id: t.id,
        title: t.title,
        body: t.notes ?? "",
        href: "/tasks",
        tags: [...new Set([...t.tags, ...extractTags(t.notes ?? "")])],
        areaId: t.areaId,
        updatedAt: t.updatedAt,
        subtitle: t.status === "completed" ? "Task · done" : "Task",
      });
    }
    for (const p of projects) {
      out.push({ type: "project", id: p.id, title: p.name, body: p.description ?? "", href: `/projects/${p.id}`, tags: [], areaId: p.areaId, updatedAt: p.updatedAt, subtitle: "Project" });
    }
    for (const a of areas) {
      out.push({ type: "area", id: a.id, title: a.name, body: "", href: `/areas/${a.id}`, tags: [], areaId: a.id, updatedAt: a.updatedAt, subtitle: "Area" });
    }
    for (const g of goals) {
      out.push({ type: "goal", id: g.id, title: g.title, body: g.description ?? "", href: "/goals", tags: [], areaId: g.areaId, updatedAt: g.updatedAt, subtitle: "Goal" });
    }
    for (const h of habits) {
      out.push({ type: "habit", id: h.id, title: h.name, body: "", href: "/habits", tags: [], areaId: null, updatedAt: h.updatedAt, subtitle: "Habit" });
    }
    for (const i of inbox) {
      if (i.status !== "new") continue;
      out.push({ type: "inbox", id: i.id, title: i.text.split("\n")[0] || i.url || "Inbox item", body: i.text, href: "/inbox", tags: extractTags(i.text), areaId: null, updatedAt: i.updatedAt, subtitle: "Inbox" });
    }
    return out;
  }

  return {
    sources,
    async buildIndex(): Promise<SearchDoc[]> {
      return buildIndex(await sources());
    },
    async query(q: string, filters?: SearchFilters, limit?: number) {
      return search(buildIndex(await sources()), q, filters, limit);
    },
  };
}

export type SearchService = ReturnType<typeof createSearchService>;
