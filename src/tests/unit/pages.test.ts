import { describe, expect, it } from "vitest";
import { extractLinks, extractTags } from "@/lib/pages/links";
import { createMemoryStore } from "@/repositories/memory-store";
import { createServices } from "@/services";

const NOW = new Date("2026-03-10T09:00:00");
const make = () => createServices(createMemoryStore(), () => NOW);

const para = (id: string, content: unknown[]) => ({ id, type: "paragraph", props: {}, content, children: [] });
const text = (t: string) => ({ type: "text", text: t, styles: {} });
const wiki = (id: string, title: string) => ({ type: "wikilink", props: { type: "page", id, title } });

describe("link extraction", () => {
  it("finds tags in any script, not inside words or URLs", () => {
    expect(extractTags("#reading and #کتاب_خوانی, see a#b and https://x.com/#frag (#nested/tag)")).toEqual([
      "reading",
      "کتاب_خوانی",
      "nested/tag",
    ]);
  });

  it("collects wiki links, mentions and tags with block context", () => {
    const doc = [
      para("b1", [text("Read "), wiki("p2", "Dune"), text(" #books")]),
      { ...para("b2", [{ type: "mention", props: { type: "task", id: "t1", label: "Buy" } }]), children: [para("b3", [wiki("p2", "Dune")])] },
    ];
    const links = extractLinks(doc);
    expect(links.map((l) => `${l.kind}:${l.to.type}:${l.to.id}@${l.blockId}`)).toEqual([
      "wikilink:page:p2@b1",
      "tag:tag:books@b1",
      "mention:task:t1@b2",
      "wikilink:page:p2@b3",
    ]);
    expect(links[0].context).toBe("Read [[Dune]] #books");
  });
});

describe("pages", () => {
  it("orders siblings with fractional keys and moves pages", async () => {
    const s = make();
    const a = await s.pages.create({ title: "A" });
    const b = await s.pages.create({ title: "B" });
    const c = await s.pages.create({ title: "C" });
    await s.pages.move(c.id, { parentId: null, before: a.id });
    const roots = (await s.store.pages.list()).sort((x, y) => (x.order < y.order ? -1 : 1)).map((p) => p.title);
    expect(roots).toEqual(["C", "A", "B"]);
    await s.pages.move(b.id, { parentId: a.id });
    await expect(s.pages.move(a.id, { parentId: b.id })).rejects.toThrow(/inside itself/);
  });

  it("indexes links on save and restores them from the trash", async () => {
    const s = make();
    const target = await s.pages.create({ title: "Dune" });
    const src = await s.pages.create({ title: "Reading" });
    await s.pages.saveContent(src.id, [para("b1", [text("Next: "), wiki(target.id, "Dune"), text(" #sci-fi")])]);
    expect((await s.links.backlinks({ type: "page", id: target.id })).map((l) => l.fromKey)).toEqual([`page:${src.id}`]);
    expect(await s.links.tags()).toEqual([{ tag: "sci-fi", count: 1 }]);
    expect((await s.pages.content(src.id))?.text).toBe("Next: [[Dune]] #sci-fi");

    // Editing replaces the old links.
    await s.pages.saveContent(src.id, [para("b1", [text("nothing")])]);
    expect(await s.links.backlinks({ type: "page", id: target.id })).toEqual([]);

    await s.pages.saveContent(src.id, [para("b1", [wiki(target.id, "Dune")])]);
    const child = await s.pages.create({ title: "Child", parentId: src.id });
    const trashed = await s.pages.remove(src.id);
    expect(await s.store.pages.get(child.id)).toBeUndefined();
    expect(await s.links.backlinks({ type: "page", id: target.id })).toEqual([]);
    await s.trash.restore(trashed.id);
    expect(await s.store.pages.get(child.id)).toBeDefined();
    expect(await s.links.backlinks({ type: "page", id: target.id })).toHaveLength(1);
  });

  it("gives every day exactly one daily note", async () => {
    const s = make();
    const [a, b] = await Promise.all([
      s.pages.getOrCreatePeriodNote("daily", "2026-03-10"),
      s.pages.getOrCreatePeriodNote("daily", "2026-03-10"),
    ]);
    expect(a.id).toBe(b.id);
    expect((await s.store.pages.list()).filter((p) => p.kind === "daily")).toHaveLength(1);
  });
});
