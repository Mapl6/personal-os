import { parseQuickAdd } from "@/lib/quick-add/parser";
import { firstLine } from "@/lib/pages/blocks";
import { createId } from "@/lib/utils/id";
import type { InboxItem, Page, Task } from "@/types/domain";
import { DomainError, must, type ServiceContext } from "./context";
import type { AttachmentService } from "./attachment-service";
import type { PageService } from "./page-service";
import type { TaskService } from "./task-service";
import { createTrashService } from "./trash-service";

const URL_RE = /^(https?:\/\/\S+)$/i;

export interface CaptureInput {
  text?: string;
  files?: { blob: Blob; name: string }[];
  source?: InboxItem["source"];
}

/**
 * The universal inbox: capture now (text, links, files), decide later.
 * Processing turns an item into a task or page and remembers where it went.
 */
export function createInboxService(
  ctx: ServiceContext,
  deps: { tasks: () => TaskService; pages: () => PageService; attachments: () => AttachmentService },
) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();

  async function capture(input: CaptureInput): Promise<InboxItem> {
    const text = (input.text ?? "").trim();
    const files = input.files ?? [];
    if (!text && files.length === 0) throw new DomainError("Nothing to capture");
    const attachmentIds: string[] = [];
    for (const f of files) attachmentIds.push((await deps.attachments().add(f.blob, f.name)).id);
    const url = URL_RE.exec(text)?.[1] ?? null;
    const kind: InboxItem["kind"] = files.length
      ? files.every((f) => f.blob.type.startsWith("image/"))
        ? "image"
        : "file"
      : url
        ? "link"
        : "text";
    const now = iso();
    return store.inbox.put({
      id: createId("in"),
      kind,
      text,
      url,
      attachmentIds,
      source: input.source ?? "app",
      status: "new",
      processedTo: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async function markProcessed(item: InboxItem, to: InboxItem["processedTo"]) {
    await store.inbox.put({ ...item, status: "processed", processedTo: to, error: null, updatedAt: iso() });
  }

  /** Turns an item into a task, reading dates/durations/areas with the Quick Add grammar. */
  async function toTask(id: string, override?: string): Promise<Task> {
    const item = await must(store.inbox.get(id), "Inbox item");
    const source = (override ?? item.text).trim() || item.url || "Captured item";
    try {
      const [areas, projects, settings] = await Promise.all([store.areas.list(), store.projects.list(), store.settings.get()]);
      const p = parseQuickAdd(firstLine(source, 200), { now: ctx.now(), weekStartsOn: settings.weekStartsOn, areas, projects });
      const rest = source.split(/\r?\n/).slice(1).join("\n").trim();
      const task = await deps.tasks().create(
        {
          title: p.title || firstLine(source, 200),
          areaId: p.areaId,
          projectId: p.projectId,
          priority: p.priority ?? undefined,
          tags: p.tags,
          estimatedMinutes: p.durationMinutes ?? settings.defaultDurationMinutes,
          notes: [rest, item.url && item.url !== source ? item.url : ""].filter(Boolean).join("\n"),
          recurrence: p.recurrence ? { ...p.recurrence, startDate: p.date ?? new Date(ctx.now()).toISOString().slice(0, 10) } : null,
        },
        p.date && !p.recurrence ? { date: p.date, startMinutes: p.startMinutes } : undefined,
      );
      await markProcessed(item, { type: "task", id: task.id });
      return task;
    } catch (e) {
      await store.inbox.put({ ...item, error: e instanceof Error ? e.message : String(e), updatedAt: iso() });
      throw e;
    }
  }

  /** Turns an item into a page: first line is the title, the rest (and the link) the body. */
  async function toPage(id: string): Promise<Page> {
    const item = await must(store.inbox.get(id), "Inbox item");
    try {
      const title = firstLine(item.text) || item.url || "Captured note";
      const body = item.text.split(/\r?\n/).slice(1).join("\n");
      const page = await deps.pages().create({ title, text: [item.url && item.url !== title ? item.url : "", body].filter(Boolean).join("\n") });
      await markProcessed(item, { type: "page", id: page.id });
      return page;
    } catch (e) {
      await store.inbox.put({ ...item, error: e instanceof Error ? e.message : String(e), updatedAt: iso() });
      throw e;
    }
  }

  return {
    capture,
    toTask,
    toPage,
    async archive(id: string) {
      const item = await must(store.inbox.get(id), "Inbox item");
      return store.inbox.put({ ...item, status: "archived", updatedAt: iso() });
    },
    async reopen(id: string) {
      const item = await must(store.inbox.get(id), "Inbox item");
      return store.inbox.put({ ...item, status: "new", updatedAt: iso() });
    },
    async update(id: string, text: string) {
      const item = await must(store.inbox.get(id), "Inbox item");
      return store.inbox.put({ ...item, text, updatedAt: iso() });
    },
    async remove(id: string) {
      const item = await must(store.inbox.get(id), "Inbox item");
      return createTrashService(ctx).moveToTrash({
        type: "inbox",
        entityId: id,
        title: firstLine(item.text) || item.url || "Inbox item",
        rows: [{ collection: "inbox", row: item }],
      });
    },
    /** Brain dump: one inbox item per non-empty line. */
    async captureLines(text: string): Promise<InboxItem[]> {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const out: InboxItem[] = [];
      for (const line of lines) out.push(await capture({ text: line, source: "brain_dump" }));
      return out;
    },
    async openItems(): Promise<InboxItem[]> {
      return (await store.inbox.listBy("status", "new")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}

export type InboxService = ReturnType<typeof createInboxService>;

export const newInboxId = () => createId("in");
