import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/repositories/memory-store";
import { createServices } from "@/services";

const NOW = new Date("2026-03-10T09:00:00");
const make = () => createServices(createMemoryStore(), () => NOW);

describe("inbox", () => {
  it("captures text, links and files with the right kind", async () => {
    const s = make();
    const text = await s.inbox.capture({ text: "Call mum" });
    const link = await s.inbox.capture({ text: "https://example.com/a" });
    const img = await s.inbox.capture({ files: [{ blob: new Blob(["png"], { type: "image/png" }), name: "a.png" }] });
    expect([text.kind, link.kind, img.kind]).toEqual(["text", "link", "image"]);
    expect(link.url).toBe("https://example.com/a");
    expect(img.attachmentIds).toHaveLength(1);
    await expect(s.inbox.capture({ text: "  " })).rejects.toThrow(/Nothing/);
    expect((await s.inbox.openItems()).map((i) => i.id)).toHaveLength(3);
  });

  it("dedupes identical attachments", async () => {
    const s = make();
    const a = await s.attachments.add(new Blob(["same"]), "a.txt");
    const b = await s.attachments.add(new Blob(["same"]), "b.txt");
    expect(b.id).toBe(a.id);
  });

  it("turns items into tasks using the quick-add grammar", async () => {
    const s = make();
    const item = await s.inbox.capture({ text: "Write report 2h tomorrow\nwith the Q1 numbers" });
    const task = await s.inbox.toTask(item.id);
    expect(task.title).toBe("Write report");
    expect(task.estimatedMinutes).toBe(120);
    expect(task.notes).toContain("Q1 numbers");
    const blocks = await s.store.blocks.list();
    expect(blocks[0]?.date).toBe("2026-03-11");
    const after = await s.store.inbox.get(item.id);
    expect(after?.status).toBe("processed");
    expect(after?.processedTo).toEqual({ type: "task", id: task.id });
  });

  it("turns items into pages, archives, reopens and trashes", async () => {
    const s = make();
    const item = await s.inbox.capture({ text: "Book ideas\nA novel about lighthouses" });
    const page = await s.inbox.toPage(item.id);
    expect(page.title).toBe("Book ideas");
    expect((await s.pages.content(page.id))?.text).toContain("lighthouses");

    const other = await s.inbox.capture({ text: "maybe later" });
    expect((await s.inbox.archive(other.id)).status).toBe("archived");
    expect((await s.inbox.reopen(other.id)).status).toBe("new");
    const trashed = await s.inbox.remove(other.id);
    expect(await s.store.inbox.get(other.id)).toBeUndefined();
    await s.trash.restore(trashed.id);
    expect(await s.store.inbox.get(other.id)).toBeDefined();
  });

  it("brain dump makes one item per non-empty line", async () => {
    const s = make();
    const items = await s.inbox.captureLines("one\n\n  two  \nthree\n");
    expect(items.map((i) => i.text)).toEqual(["one", "two", "three"]);
    expect(items.every((i) => i.source === "brain_dump")).toBe(true);
  });
});

describe("check-ins", () => {
  it("logs mood then energy, and validates ranges", async () => {
    const s = make();
    const c = await s.checkIns.log({ mood: 4 });
    expect(c.date).toBe("2026-03-10");
    const u = await s.checkIns.update(c.id, { energy: 2 });
    expect([u.mood, u.energy]).toEqual([4, 2]);
    await expect(s.checkIns.log({ mood: 6 })).rejects.toThrow(/1 to 5/);
    await expect(s.checkIns.log({})).rejects.toThrow();
    expect(await s.checkIns.forDate("2026-03-10")).toHaveLength(1);
  });

  it("keeps one rating per day", async () => {
    const s = make();
    await s.checkIns.rateDay("2026-03-10", 3);
    const r = await s.checkIns.rateDay("2026-03-10", 5);
    expect(r.rating).toBe(5);
    expect(await s.store.dayRatings.list()).toHaveLength(1);
  });
});
