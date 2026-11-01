import { generateKeyBetween } from "fractional-indexing";
import { deriveContent, textToBlocks } from "@/lib/pages/blocks";
import { createId } from "@/lib/utils/id";
import { pageSchema, type Page, type PageContent, type PageKind } from "@/types/domain";
import { DomainError, must, type ServiceContext } from "./context";
import { createLinkService } from "./link-service";
import { createTrashService } from "./trash-service";

export interface PageInput {
  title?: string;
  icon?: string | null;
  parentId?: string | null;
  kind?: PageKind;
  periodStart?: string | null;
  areaId?: string | null;
  projectId?: string | null;
  tags?: string[];
  /** Initial body: editor blocks, or plain text turned into paragraphs. */
  doc?: unknown[];
  text?: string;
}

/** Period notes have a natural id, so two tabs creating "today" get the same note. */
export const periodNoteId = (kind: PageKind, periodStart: string) => `${kind}-${periodStart}`;

export function createPageService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();
  const links = createLinkService(ctx);

  async function siblings(parentId: string | null): Promise<Page[]> {
    const all = parentId ? await store.pages.listBy("parentId", parentId) : (await store.pages.list()).filter((p) => !p.parentId);
    return all.filter((p) => p.kind === "page" || p.kind === "template").sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  }

  async function writeContent(pageId: string, doc: unknown[]): Promise<PageContent> {
    const { text, outline } = deriveContent(doc);
    const content = await store.pageContents.put({ id: pageId, doc, text, outline, updatedAt: iso() });
    await links.reindex({ type: "page", id: pageId }, doc);
    return content;
  }

  async function create(input: PageInput = {}, id?: string): Promise<Page> {
    const now = iso();
    const parentId = input.parentId ?? null;
    if (parentId) await must(store.pages.get(parentId), "Parent page");
    const last = (await siblings(parentId)).at(-1);
    const page = pageSchema.parse({
      id: id ?? createId("page"),
      title: input.title?.trim() ?? "",
      icon: input.icon ?? null,
      kind: input.kind ?? "page",
      periodStart: input.periodStart ?? null,
      parentId,
      order: generateKeyBetween(last?.order ?? null, null),
      areaId: input.areaId ?? null,
      projectId: input.projectId ?? null,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
    // A natural id (period notes) may have just been created in another tab: keep what's there.
    if (id) {
      const existing = await store.pages.get(id);
      if (existing) return existing;
    }
    await store.pages.put(page);
    if (!(id && (await store.pageContents.get(id)))) {
      await writeContent(page.id, input.doc ?? (input.text ? textToBlocks(input.text) : []));
    }
    return page;
  }

  async function update(id: string, patch: Partial<Pick<Page, "title" | "icon" | "areaId" | "projectId" | "tags" | "favourite">>): Promise<Page> {
    const page = await must(store.pages.get(id), "Page");
    return store.pages.put(pageSchema.parse({ ...page, ...patch, updatedAt: iso() }));
  }

  /** Saves the editor's blocks and the derived text/outline. */
  async function saveContent(id: string, doc: unknown[]): Promise<PageContent> {
    const page = await must(store.pages.get(id), "Page");
    const content = await writeContent(id, doc);
    await store.pages.put({ ...page, updatedAt: content.updatedAt });
    return content;
  }

  async function descendants(id: string): Promise<Page[]> {
    const out: Page[] = [];
    const queue = [id];
    while (queue.length) {
      const children = await store.pages.listBy("parentId", queue.shift()!);
      out.push(...children);
      queue.push(...children.map((c) => c.id));
    }
    return out;
  }

  /** Moves a page under `parentId`, placed between two siblings (ids or null for the ends). */
  async function move(id: string, to: { parentId: string | null; after?: string | null; before?: string | null }): Promise<Page> {
    const page = await must(store.pages.get(id), "Page");
    if (to.parentId === id || (to.parentId && (await descendants(id)).some((d) => d.id === to.parentId))) {
      throw new DomainError("A page can’t be moved inside itself");
    }
    const sibs = (await siblings(to.parentId)).filter((p) => p.id !== id);
    let lo: string | null = null;
    let hi: string | null = null;
    if (to.after) {
      const i = sibs.findIndex((p) => p.id === to.after);
      lo = sibs[i]?.order ?? null;
      hi = sibs[i + 1]?.order ?? null;
    } else if (to.before) {
      const i = sibs.findIndex((p) => p.id === to.before);
      hi = sibs[i]?.order ?? null;
      lo = i > 0 ? sibs[i - 1].order : null;
    } else {
      lo = sibs.at(-1)?.order ?? null;
    }
    return store.pages.put({ ...page, parentId: to.parentId, order: generateKeyBetween(lo, hi), updatedAt: iso() });
  }

  /** Moves the page and every page under it (with their content) to the trash. */
  async function remove(id: string) {
    const page = await must(store.pages.get(id), "Page");
    const all = [page, ...(await descendants(id))];
    const contents = (await Promise.all(all.map((p) => store.pageContents.get(p.id)))).filter((c): c is PageContent => !!c);
    const outgoing = (await Promise.all(all.map((p) => links.outgoing({ type: "page", id: p.id })))).flat();
    return createTrashService(ctx).moveToTrash({
      type: "page",
      entityId: id,
      title: page.title || (page.periodStart ? `${page.kind} note ${page.periodStart}` : "Untitled"),
      rows: [
        ...all.map((p) => ({ collection: "pages" as const, row: p })),
        ...contents.map((c) => ({ collection: "pageContents" as const, row: c })),
        ...outgoing.map((l) => ({ collection: "links" as const, row: l })),
      ],
    });
  }

  /** Returns the note for a period, creating it (idempotently) if needed. */
  async function getOrCreatePeriodNote(kind: Exclude<PageKind, "page" | "template">, periodStart: string): Promise<Page> {
    const id = periodNoteId(kind, periodStart);
    const existing = await store.pages.get(id);
    if (existing) return existing;
    return create({ kind, periodStart }, id);
  }

  return {
    create,
    update,
    saveContent,
    move,
    remove,
    descendants,
    getOrCreatePeriodNote,
    async touch(id: string) {
      const page = await store.pages.get(id);
      if (page) await store.pages.put({ ...page, lastOpenedAt: iso() });
    },
    async content(id: string): Promise<PageContent | undefined> {
      return store.pageContents.get(id);
    },
  };
}

export type PageService = ReturnType<typeof createPageService>;
