import { toDateKey } from "@/lib/date";
import { createId } from "@/lib/utils/id";
import type { TimeEntry } from "@/types/domain";
import { DomainError, must, type ServiceContext } from "./context";
import type { TaskService } from "./task-service";

/**
 * Timer + manual time tracking. Tracking is independent from planning: a
 * task can be tracked without being scheduled and completed without a timer.
 * Only one timer runs at a time.
 */
export function createTimeService(ctx: ServiceContext, deps: { tasks: () => TaskService }) {
  const { store } = ctx;

  function close(entry: TimeEntry, reason: "pause" | "stop"): TimeEntry {
    const end = ctx.now();
    const minutes = Math.max(0, (end.getTime() - new Date(entry.start).getTime()) / 60000);
    return { ...entry, end: end.toISOString(), durationMinutes: Math.round(minutes * 100) / 100, endReason: reason };
  }

  async function running(): Promise<TimeEntry | undefined> {
    // Running timers are rare; scanning today's + yesterday's entries is enough,
    // but a full scan keeps it correct across midnight boundaries.
    return (await store.timeEntries.list()).find((e) => e.end === null);
  }

  async function start(taskId: string, blockId: string | null = null): Promise<TimeEntry> {
    await must(store.tasks.get(taskId), "Task");
    const current = await running();
    if (current) {
      if (current.taskId === taskId && current.blockId === blockId) return current;
      await store.timeEntries.put(close(current, "stop"));
      await deps.tasks().syncStatus(current.taskId);
    }
    const now = ctx.now();
    const entry: TimeEntry = {
      id: createId("te"),
      taskId,
      blockId,
      date: toDateKey(now),
      start: now.toISOString(),
      end: null,
      durationMinutes: 0,
      source: "timer",
      endReason: null,
      note: "",
    };
    await store.timeEntries.put(entry);
    await deps.tasks().syncStatus(taskId);
    return entry;
  }

  async function pause(): Promise<TimeEntry | undefined> {
    const current = await running();
    if (!current) return undefined;
    const closed = close(current, "pause");
    await store.timeEntries.put(closed);
    return closed;
  }

  /** Resume the most recently paused session. */
  async function resume(): Promise<TimeEntry> {
    const last = await lastPaused();
    if (!last) throw new DomainError("Nothing to resume");
    return start(last.taskId, last.blockId);
  }

  async function stop(): Promise<TimeEntry | undefined> {
    const current = await running();
    if (current) {
      const closed = close(current, "stop");
      await store.timeEntries.put(closed);
      await deps.tasks().syncStatus(current.taskId);
      return closed;
    }
    const paused = await lastPaused();
    if (paused) {
      const ended = { ...paused, endReason: "stop" as const };
      await store.timeEntries.put(ended);
      await deps.tasks().syncStatus(paused.taskId);
      return ended;
    }
    return undefined;
  }

  async function stopForBlock(blockId: string): Promise<void> {
    const current = await running();
    if (current?.blockId === blockId) await store.timeEntries.put(close(current, "stop"));
    const paused = await lastPaused();
    if (paused?.blockId === blockId) await store.timeEntries.put({ ...paused, endReason: "stop" });
  }

  async function lastPaused(): Promise<TimeEntry | undefined> {
    const entries = await store.timeEntries.list();
    if (entries.some((e) => e.end === null)) return undefined;
    const latest = entries
      .filter((e) => e.end !== null)
      .sort((a, b) => (b.end! > a.end! ? 1 : -1))[0];
    return latest?.endReason === "pause" ? latest : undefined;
  }

  async function addManual(input: {
    taskId: string;
    blockId?: string | null;
    date: string;
    minutes: number;
    note?: string;
  }): Promise<TimeEntry> {
    await must(store.tasks.get(input.taskId), "Task");
    if (input.minutes <= 0) throw new DomainError("Duration must be positive");
    const start = new Date(`${input.date}T12:00:00`);
    const entry: TimeEntry = {
      id: createId("te"),
      taskId: input.taskId,
      blockId: input.blockId ?? null,
      date: input.date,
      start: start.toISOString(),
      end: new Date(start.getTime() + input.minutes * 60000).toISOString(),
      durationMinutes: input.minutes,
      source: "manual",
      endReason: "stop",
      note: input.note ?? "",
    };
    await store.timeEntries.put(entry);
    return entry;
  }

  async function updateEntry(id: string, patch: { minutes?: number; date?: string; note?: string }): Promise<TimeEntry> {
    const entry = await must(store.timeEntries.get(id), "Time entry");
    if (entry.end === null) throw new DomainError("Stop the timer before editing this entry");
    const next: TimeEntry = {
      ...entry,
      durationMinutes: patch.minutes ?? entry.durationMinutes,
      date: patch.date ?? entry.date,
      note: patch.note ?? entry.note,
    };
    await store.timeEntries.put(next);
    return next;
  }

  async function removeEntry(id: string): Promise<void> {
    const entry = await store.timeEntries.get(id);
    await store.timeEntries.delete(id);
    if (entry) await deps.tasks().syncStatus(entry.taskId);
  }

  return { start, pause, resume, stop, stopForBlock, running, lastPaused, addManual, updateEntry, removeEntry };
}

export type TimeService = ReturnType<typeof createTimeService>;
