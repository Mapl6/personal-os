import { daysInRange, isInRange, weekdayOf, type DateKey, type DateRange } from "@/lib/date";
import { percent } from "@/lib/utils/collections";
import type { Area, ScheduleBlock, Task, TimeEntry } from "@/types/domain";
import { blockActualMinutes, collectWork, entryMinutes } from "./work";

export interface DayProgress {
  date: DateKey;
  plannedMinutes: number;
  completedMinutes: number; // planned duration of completed blocks
  remainingMinutes: number;
  actualMinutes: number; // actual duration of completed work (incl. tracked, un-completed work)
  trackedMinutes: number; // raw timer/manual entries
  blocksTotal: number;
  blocksCompleted: number;
  blocksSkipped: number;
  completionPercent: number;
}

export function dayProgress(
  date: DateKey,
  blocks: readonly ScheduleBlock[],
  entries: readonly TimeEntry[],
  now: Date = new Date(),
): DayProgress {
  const dayBlocks = blocks.filter((b) => b.date === date);
  const active = dayBlocks.filter((b) => b.status !== "skipped");
  const completed = active.filter((b) => b.status === "completed");
  const planned = active.reduce((s, b) => s + b.durationMinutes, 0);
  const done = completed.reduce((s, b) => s + b.durationMinutes, 0);
  const range = { from: date, to: date };
  const actual = collectWork(blocks, entries, range, now).reduce((s, r) => s + r.minutes, 0);
  const tracked = entries.filter((e) => e.date === date).reduce((s, e) => s + entryMinutes(e, now), 0);
  return {
    date,
    plannedMinutes: planned,
    completedMinutes: done,
    remainingMinutes: Math.max(0, planned - done),
    actualMinutes: Math.round(actual),
    trackedMinutes: Math.round(tracked),
    blocksTotal: active.length,
    blocksCompleted: completed.length,
    blocksSkipped: dayBlocks.length - active.length,
    completionPercent: percent(done, planned),
  };
}

export function dailySeries(
  range: DateRange,
  blocks: readonly ScheduleBlock[],
  entries: readonly TimeEntry[],
  now: Date = new Date(),
): DayProgress[] {
  const inRangeBlocks = blocks.filter((b) => isInRange(b.date, range));
  const inRangeEntries = entries.filter((e) => isInRange(e.date, range));
  // Completed-block lookup must consider all blocks so entries aren't double counted.
  const completedOutside = blocks.filter((b) => b.status === "completed" && !isInRange(b.date, range));
  return daysInRange(range).map((day) =>
    dayProgress(day, [...inRangeBlocks, ...completedOutside], inRangeEntries, now),
  );
}

export interface AreaTime {
  areaId: string | null;
  name: string;
  color: string;
  minutes: number;
  plannedMinutes: number;
}

export function timeByArea(
  range: DateRange,
  tasks: readonly Task[],
  areas: readonly Area[],
  blocks: readonly ScheduleBlock[],
  entries: readonly TimeEntry[],
  now: Date = new Date(),
): AreaTime[] {
  const taskArea = new Map(tasks.map((t) => [t.id, t.areaId]));
  const totals = new Map<string | null, { minutes: number; planned: number }>();
  const bucket = (id: string | null) => {
    let v = totals.get(id);
    if (!v) totals.set(id, (v = { minutes: 0, planned: 0 }));
    return v;
  };
  for (const r of collectWork(blocks, entries, range, now)) bucket(taskArea.get(r.taskId) ?? null).minutes += r.minutes;
  for (const b of blocks) {
    if (b.status === "skipped" || !isInRange(b.date, range)) continue;
    bucket(taskArea.get(b.taskId) ?? null).planned += b.durationMinutes;
  }
  const areaMap = new Map(areas.map((a) => [a.id, a]));
  return [...totals.entries()]
    .map(([areaId, v]) => {
      const area = areaId ? areaMap.get(areaId) : undefined;
      return {
        areaId,
        name: area?.name ?? "No area",
        color: area?.color ?? "slate",
        minutes: Math.round(v.minutes),
        plannedMinutes: v.planned,
      };
    })
    .sort((a, b) => b.minutes - a.minutes || b.plannedMinutes - a.plannedMinutes);
}

export interface PeriodSummary {
  plannedMinutes: number;
  completedMinutes: number;
  actualMinutes: number;
  trackedMinutes: number;
  completionPercent: number;
  blocksCompleted: number;
  blocksDue: number;
  taskCompletionRate: number;
  tasksCompleted: number;
  rescheduledBlocks: number;
  skippedBlocks: number;
  averageDailyFocusMinutes: number;
  averageBlockMinutes: number;
  estimateMinutes: number; // planned duration of completed blocks
  estimateVarianceMinutes: number; // actual - planned for completed blocks
  activeDays: number;
  expectedDays: number;
  consistencyPercent: number;
}

/**
 * Aggregates a period. Days after `today` are excluded from "due"/consistency
 * so the future doesn't count against the user.
 */
export function summarizePeriod(
  range: DateRange,
  today: DateKey,
  data: {
    tasks: readonly Task[];
    blocks: readonly ScheduleBlock[];
    entries: readonly TimeEntry[];
    workingDays: readonly number[];
  },
  now: Date = new Date(),
): PeriodSummary {
  const series = dailySeries(range, data.blocks, data.entries, now);
  const blocks = data.blocks.filter((b) => isInRange(b.date, range));
  const completed = blocks.filter((b) => b.status === "completed");
  const due = blocks.filter((b) => b.status !== "skipped" && b.date <= today);
  const planned = series.reduce((s, d) => s + d.plannedMinutes, 0);
  const done = series.reduce((s, d) => s + d.completedMinutes, 0);
  const actual = series.reduce((s, d) => s + d.actualMinutes, 0);
  const tracked = series.reduce((s, d) => s + d.trackedMinutes, 0);
  const elapsed = series.filter((d) => d.date <= today);
  const expected = elapsed.filter((d) => data.workingDays.includes(weekdayOf(d.date)));
  const activeDays = elapsed.filter((d) => d.blocksCompleted > 0 || d.trackedMinutes > 0).length;
  const estimate = completed.reduce((s, b) => s + b.durationMinutes, 0);
  const actualCompleted = completed.reduce((s, b) => s + blockActualMinutes(b), 0);
  const tasksCompleted = data.tasks.filter(
    (t) => t.status === "completed" && t.completedAt && isInRange(t.completedAt.slice(0, 10), range),
  ).length;
  return {
    plannedMinutes: planned,
    completedMinutes: done,
    actualMinutes: actual,
    trackedMinutes: tracked,
    completionPercent: percent(done, planned),
    blocksCompleted: completed.length,
    blocksDue: due.length,
    taskCompletionRate: percent(completed.filter((b) => b.date <= today).length, due.length),
    tasksCompleted,
    rescheduledBlocks: blocks.filter((b) => b.rescheduleCount > 0).length,
    skippedBlocks: blocks.filter((b) => b.status === "skipped").length,
    averageDailyFocusMinutes: elapsed.length ? Math.round(actual / Math.max(1, elapsed.length)) : 0,
    averageBlockMinutes: completed.length ? Math.round(actualCompleted / completed.length) : 0,
    estimateMinutes: estimate,
    estimateVarianceMinutes: actualCompleted - estimate,
    activeDays,
    expectedDays: expected.length,
    consistencyPercent: Math.min(100, percent(activeDays, expected.length)),
  };
}

export interface RescheduledTask {
  task: Task;
  moves: number;
}

/** Tasks whose blocks in range were moved at least `minMoves` times. */
export function frequentlyRescheduled(
  range: DateRange,
  tasks: readonly Task[],
  blocks: readonly ScheduleBlock[],
  minMoves = 2,
): RescheduledTask[] {
  const moves = new Map<string, number>();
  for (const b of blocks) {
    if (!isInRange(b.date, range) && !isInRange(b.originalDate, range)) continue;
    if (b.rescheduleCount > 0) moves.set(b.taskId, (moves.get(b.taskId) ?? 0) + b.rescheduleCount);
  }
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return [...moves.entries()]
    .filter(([, n]) => n >= minMoves)
    .map(([id, n]) => ({ task: byId.get(id)!, moves: n }))
    .filter((r) => r.task)
    .sort((a, b) => b.moves - a.moves);
}
