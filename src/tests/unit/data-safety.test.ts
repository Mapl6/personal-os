import { describe, expect, it } from "vitest";
import { createChangeFeed, withChangeFeed, type Change } from "@/repositories/change-feed";
import { createMemoryStore } from "@/repositories/memory-store";
import { listSnapshots, migrateData, SCHEMA_VERSION, setSchemaVersion } from "@/repositories/migrations";
import { createServices } from "@/services";
import { blobToDataUrl } from "@/services/data-service";
import { setupServices } from "../helpers";

/** A backup as version 1 of the app wrote it (no updatedAt on areas/habits/time entries). */
const v1Backup = {
  version: 1,
  exportedAt: "2026-09-25T10:00:00.000Z",
  settings: { id: "settings", name: "Old", onboarded: true },
  areas: [{ id: "a1", name: "Frontend", color: "indigo", createdAt: "2026-09-01T00:00:00.000Z" }],
  projects: [],
  tasks: [{ id: "t1", title: "Learn React", status: "inbox", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z" }],
  blocks: [],
  timeEntries: [
    { id: "te1", taskId: "t1", date: "2026-09-02", start: "2026-09-02T09:00:00.000Z", end: "2026-09-02T10:00:00.000Z", durationMinutes: 60, source: "timer" },
  ],
  goals: [],
  goalProgress: [],
  habits: [{ id: "h1", name: "Gym", weekdays: [1, 4], createdAt: "2026-09-01T00:00:00.000Z" }],
  habitEntries: [{ id: "he1", habitId: "h1", date: "2026-09-03", createdAt: "2026-09-03T00:00:00.000Z" }],
  reviews: [
    { id: "r1", type: "daily", periodStart: "2026-09-03", answers: {}, energy: 4, createdAt: "2026-09-03T20:00:00.000Z", updatedAt: "2026-09-03T20:00:00.000Z" },
  ],
  templates: [],
};

describe("migrations", () => {
  it("upgrades a v1 dataset: base fields and check-ins from review energy", () => {
    const data = migrateData(
      {
        version: 1,
        settings: {},
        collections: { areas: structuredClone(v1Backup.areas), reviews: structuredClone(v1Backup.reviews), timeEntries: structuredClone(v1Backup.timeEntries) },
      },
      "2026-10-01T00:00:00.000Z",
    );
    expect(data.version).toBe(SCHEMA_VERSION);
    expect(data.collections.areas[0].updatedAt).toBe("2026-09-01T00:00:00.000Z");
    expect(data.collections.timeEntries[0].updatedAt).toBe("2026-09-02T09:00:00.000Z");
    expect(data.collections.checkIns).toEqual([expect.objectContaining({ date: "2026-09-03", energy: 4, mood: null })]);
    expect(data.collections.pages).toEqual([]);
  });

  it("refuses data from a newer app", () => {
    expect(() => migrateData({ version: SCHEMA_VERSION + 1, settings: {}, collections: {} }, "x")).toThrow(/newer version/);
  });

  it("imports an old backup file and keeps a snapshot of what it replaced", async () => {
    const { services } = setupServices();
    await services.tasks.create({ title: "Current task" });
    await services.data.importAll(structuredClone(v1Backup));
    const tasks = await services.store.tasks.list();
    expect(tasks.map((t) => t.title)).toEqual(["Learn React"]);
    expect((await services.store.checkIns.list())[0].energy).toBe(4);
    const snaps = await listSnapshots(services.store);
    expect(snaps[0].reason).toMatch(/importing/);
    await services.data.restoreSnapshot(snaps[0].id);
    expect((await services.store.tasks.list()).map((t) => t.title)).toEqual(["Current task"]);
  });

  it("upgrades a live store on boot, with a snapshot first", async () => {
    const store = createMemoryStore();
    const services = createServices(store, () => new Date("2026-10-01T00:00:00Z"));
    await store.settings.save({ ...(await store.settings.get()), onboarded: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await store.habits.put(structuredClone(v1Backup.habits[0]) as any);
    await setSchemaVersion(store, 1);
    const result = await services.data.boot();
    expect(result.migratedFrom).toBe(1);
    expect((await store.habits.get("h1"))!.updatedAt).toBe("2026-09-01T00:00:00.000Z");
    expect((await listSnapshots(store)).length).toBe(1);
    expect((await services.data.boot()).migratedFrom).toBeNull();
  });

  it("stamps a fresh install without migrating", async () => {
    const services = createServices(createMemoryStore());
    expect((await services.data.boot()).migratedFrom).toBeNull();
    expect(await listSnapshots(services.store)).toHaveLength(0);
  });

  it("round-trips attachments through JSON export", async () => {
    // Memory store: fake-indexeddb cannot structured-clone jsdom Blobs (real browsers can).
    const services = createServices(createMemoryStore());
    const now = new Date().toISOString();
    await services.store.attachments.put({
      id: "f1", name: "a.txt", mime: "text/plain", size: 5, sha256: "x", blob: new Blob(["hello"], { type: "text/plain" }), createdAt: now, updatedAt: now,
    });
    const backup = JSON.parse(JSON.stringify(await services.data.exportAll()));
    expect(backup.attachments[0].blob).toMatch(/^data:text\/plain;base64,/);
    await services.data.reset();
    await services.data.importAll(backup);
    const att = await services.store.attachments.get("f1");
    expect(await blobToDataUrl(att!.blob)).toBe(`data:text/plain;base64,${btoa("hello")}`);
  });
});

describe("trash", () => {
  it("deletes a task with its blocks and entries, and restores all of it with dependency links", async () => {
    const { services, store } = setupServices();
    const a = await services.tasks.create({ title: "A" }, { date: "2026-09-24", startMinutes: 540 });
    const b = await services.tasks.create({ title: "B", dependencies: [a.id] });
    await services.time.addManual({ taskId: a.id, date: "2026-09-24", minutes: 30 });
    const item = await services.tasks.remove(a.id);
    expect(await store.tasks.get(a.id)).toBeUndefined();
    expect(await store.blocks.listBy("taskId", a.id)).toHaveLength(0);
    expect((await store.tasks.get(b.id))!.dependencies).toEqual([]);
    expect(item.rows).toHaveLength(3);

    await services.trash.restore(item.id);
    expect(await store.tasks.get(a.id)).toBeDefined();
    expect(await store.blocks.listBy("taskId", a.id)).toHaveLength(1);
    expect(await store.timeEntries.listBy("taskId", a.id)).toHaveLength(1);
    expect((await store.tasks.get(b.id))!.dependencies).toEqual([a.id]);
    expect(await store.trash.list()).toHaveLength(0);
  });

  it("detaches tasks from a deleted project and re-attaches them on restore", async () => {
    const { services, store } = setupServices();
    const p = await services.projects.create({ name: "MVP" });
    const t = await services.tasks.create({ title: "DB", projectId: p.id });
    const item = await services.projects.remove(p.id);
    expect((await store.tasks.get(t.id))!.projectId).toBeNull();
    await services.trash.restore(item.id);
    expect((await store.tasks.get(t.id))!.projectId).toBe(p.id);
  });

  it("purges items older than the retention window on boot", async () => {
    const { services, store, clock } = setupServices(new Date(2026, 8, 1));
    const t = await services.tasks.create({ title: "Old" });
    await services.tasks.remove(t.id);
    clock.advance(31 * 24 * 60);
    const { purged } = await services.data.boot();
    expect(purged).toBe(1);
    expect(await store.trash.list()).toHaveLength(0);
  });
});

describe("change feed", () => {
  it("announces writes, batched per tick", async () => {
    const feed = createChangeFeed();
    const store = withChangeFeed(createMemoryStore(), feed);
    const seen: Change[][] = [];
    feed.subscribe((c) => seen.push(c));
    const services = createServices(store);
    await services.tasks.create({ title: "X" }, { date: "2026-09-24", startMinutes: 600 });
    await new Promise((r) => setTimeout(r, 0));
    const collections = seen.flat().map((c) => c.collection);
    expect(collections).toContain("tasks");
    expect(collections).toContain("blocks");
  });
});
