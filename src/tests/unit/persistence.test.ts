import { describe, expect, it } from "vitest";
import { createIndexedDbStore } from "@/repositories/indexeddb-store";
import { createServices } from "@/services";
import { setupWorkspace, DEFAULT_AREAS, DEFAULT_WEEKLY_GOALS } from "@/services/seed";

describe("persistence (IndexedDB)", () => {
  it("persists across store instances and supports range queries", async () => {
    const name = `test-${Math.random()}`;
    const s1 = createServices(createIndexedDbStore(name));
    const task = await s1.tasks.create({ title: "Persist me" }, { date: "2026-09-24", startMinutes: 600 });
    await s1.tasks.create({ title: "Other" }, { date: "2026-10-02", startMinutes: 600 });

    const s2 = createServices(createIndexedDbStore(name));
    expect((await s2.store.tasks.get(task.id))!.title).toBe("Persist me");
    const inSept = await s2.store.blocks.listByRange("date", "2026-09-01", "2026-09-30");
    expect(inSept).toHaveLength(1);
  });

  it("round-trips export → reset → import", async () => {
    const services = createServices(createIndexedDbStore(`test-${Math.random()}`), () => new Date(2026, 8, 24, 10));
    await setupWorkspace(
      services,
      {
        name: "Me",
        workingDays: [1, 2, 3, 4, 5, 6],
        dayStartMinutes: 540,
        dayEndMinutes: 1140,
        areaNames: DEFAULT_AREAS.map((a) => a.name),
        weeklyGoals: DEFAULT_WEEKLY_GOALS,
        includeExamples: true,
      },
      new Date(2026, 8, 24, 10),
    );
    const backup = await services.data.exportAll();
    expect(backup.tasks.length).toBeGreaterThan(10);
    await services.data.reset();
    expect(await services.store.tasks.list()).toHaveLength(0);
    expect((await services.data.getSettings()).onboarded).toBe(false);
    await services.data.importAll(JSON.parse(JSON.stringify(backup)));
    expect(await services.store.tasks.list()).toHaveLength(backup.tasks.length);
    expect((await services.data.getSettings()).onboarded).toBe(true);
    await expect(services.data.importAll({ version: 99 })).rejects.toThrow(/Invalid backup/);
  });
});
