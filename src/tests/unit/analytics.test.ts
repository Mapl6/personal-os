import { describe, expect, it } from "vitest";
import { dayProgress, summarizePeriod, timeByArea } from "@/lib/analytics/stats";
import { computeGoalProgress } from "@/lib/goals/progress";
import { setupServices } from "../helpers";

async function fixture() {
  const ctx = setupServices(new Date(2026, 8, 24, 20)); // Thu 24 Sep
  const { services, store } = ctx;
  const fe = await services.areas.create({ name: "Frontend", color: "indigo" });
  const he = await services.areas.create({ name: "Health", color: "emerald" });
  const react = await services.tasks.create({ title: "React", areaId: fe.id, estimatedMinutes: 120 }, { date: "2026-09-24", startMinutes: 540 });
  const ts = await services.tasks.create({ title: "TS", areaId: fe.id, estimatedMinutes: 60 }, { date: "2026-09-24", startMinutes: 720 });
  const gym = await services.tasks.create({ title: "Gym", areaId: he.id, estimatedMinutes: 60 }, { date: "2026-09-22", startMinutes: 1080 });
  const [rb] = await store.blocks.listBy("taskId", react.id);
  const [gb] = await store.blocks.listBy("taskId", gym.id);
  await services.schedule.completeBlock(rb.id, { actualMinutes: 145 });
  await services.schedule.completeBlock(gb.id);
  // Tracked time on an uncompleted task still counts as work
  await services.time.addManual({ taskId: ts.id, date: "2026-09-24", minutes: 20 });
  return { ...ctx, fe, he, react, ts, gym };
}

describe("analytics", () => {
  it("computes day progress on planned basis and actual separately", async () => {
    const { store } = await fixture();
    const [blocks, entries] = await Promise.all([store.blocks.list(), store.timeEntries.list()]);
    const p = dayProgress("2026-09-24", blocks, entries);
    expect(p.plannedMinutes).toBe(180);
    expect(p.completedMinutes).toBe(120);
    expect(p.remainingMinutes).toBe(60);
    expect(p.completionPercent).toBe(67);
    expect(p.actualMinutes).toBe(165); // 145 completed + 20 tracked on open task
  });

  it("aggregates time by area without double counting", async () => {
    const { store, fe, he } = await fixture();
    const [tasks, areas, blocks, entries] = await Promise.all([store.tasks.list(), store.areas.list(), store.blocks.list(), store.timeEntries.list()]);
    const byArea = timeByArea({ from: "2026-09-21", to: "2026-09-27" }, tasks, areas, blocks, entries);
    expect(byArea.find((a) => a.areaId === fe.id)!.minutes).toBe(165);
    expect(byArea.find((a) => a.areaId === he.id)!.minutes).toBe(60);
  });

  it("summarizes a week with variance and consistency", async () => {
    const { store } = await fixture();
    const [tasks, blocks, entries] = await Promise.all([store.tasks.list(), store.blocks.list(), store.timeEntries.list()]);
    const s = summarizePeriod({ from: "2026-09-21", to: "2026-09-27" }, "2026-09-24", {
      tasks,
      blocks,
      entries,
      workingDays: [1, 2, 3, 4, 5],
    });
    expect(s.plannedMinutes).toBe(240);
    expect(s.blocksCompleted).toBe(2);
    expect(s.estimateMinutes).toBe(180);
    expect(s.estimateVarianceMinutes).toBe(25);
    expect(s.expectedDays).toBe(4);
    expect(s.activeDays).toBe(2);
    expect(s.consistencyPercent).toBe(50);
  });

  it("computes weekly goal progress (hours + sessions + manual)", async () => {
    const { services, store, fe, he } = await fixture();
    const hours = await services.goals.create({ title: "Frontend", period: "weekly", metric: "hours", target: 8, tracking: "auto", areaId: fe.id });
    const gym = await services.goals.create({ title: "Gym", period: "weekly", metric: "sessions", target: 2, tracking: "auto", areaId: he.id, keyword: "gym" });
    const pages = await services.goals.create({ title: "Book", period: "monthly", metric: "pages", target: 250, tracking: "manual" });
    await services.goals.logProgress(pages.id, 40, "2026-09-10");
    await services.goals.logProgress(pages.id, 30, "2026-08-30"); // previous month: excluded
    const data = {
      tasks: await store.tasks.list(),
      blocks: await store.blocks.list(),
      entries: await store.timeEntries.list(),
      progress: await store.goalProgress.list(),
    };
    expect(computeGoalProgress(hours, "2026-09-24", 1, data).current).toBe(2.8); // 165m
    expect(computeGoalProgress(gym, "2026-09-24", 1, data)).toMatchObject({ current: 1, percent: 50, label: "1 / 2 sessions" });
    expect(computeGoalProgress(pages, "2026-09-24", 1, data).current).toBe(40);
    // Next week starts fresh
    expect(computeGoalProgress(gym, "2026-09-28", 1, data).current).toBe(0);
  });
});
