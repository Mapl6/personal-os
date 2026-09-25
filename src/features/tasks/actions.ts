"use client";

import { formatDateKey, formatDuration, formatTime, isInRange, type DateKey } from "@/lib/date";
import { getQueryClient } from "@/lib/query/client";
import { perform } from "@/hooks/perform";
import { getServices } from "@/services";
import type { ScheduleBlock, Task } from "@/types/domain";

const svc = () => getServices();

/**
 * Optimistically patches a block across every cached blocks query so drag &
 * drop feels instant. Returns a rollback function.
 */
function optimisticBlock(blockId: string, patch: Partial<ScheduleBlock>) {
  const qc = getQueryClient();
  const snapshots = qc.getQueriesData<ScheduleBlock[]>({ queryKey: ["blocks"] });
  let original: ScheduleBlock | undefined;
  for (const [, data] of snapshots) original ??= data?.find((b) => b.id === blockId);
  if (!original) return () => {};
  const updated = { ...original, ...patch };
  for (const [key, data] of snapshots) {
    if (!data) continue;
    const [, kind, from, to] = key as [string, string, string, string];
    let next = data.filter((b) => b.id !== blockId);
    const inRange = kind !== "range" || isInRange(updated.date, { from, to });
    if (inRange) next = [...next, updated];
    qc.setQueryData(key, next);
  }
  return () => snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
}

export const workActions = {
  completeBlock(block: ScheduleBlock, title: string, actualMinutes?: number) {
    return perform(() => svc().schedule.completeBlock(block.id, { actualMinutes }), {
      success: (b) => `Completed “${title}” · ${formatDuration(b.actualMinutes ?? b.durationMinutes)}`,
      undo: () => svc().schedule.reopenBlock(block.id),
      optimistic: () => optimisticBlock(block.id, { status: "completed" }),
      invalidate: [["goals"]],
    });
  },

  skipBlock(block: ScheduleBlock, title: string) {
    return perform(() => svc().schedule.skipBlock(block.id), {
      success: `Skipped “${title}” — no problem.`,
      undo: () => svc().schedule.reopenBlock(block.id),
      optimistic: () => optimisticBlock(block.id, { status: "skipped" }),
    });
  },

  reopenBlock(block: ScheduleBlock) {
    return perform(() => svc().schedule.reopenBlock(block.id), {
      optimistic: () => optimisticBlock(block.id, { status: "planned", actualMinutes: null }),
    });
  },

  moveBlock(block: ScheduleBlock, to: { date: DateKey; startMinutes: number | null }, title?: string) {
    const from = { date: block.date, startMinutes: block.startMinutes };
    const dayChanged = to.date !== block.date;
    return perform(() => svc().schedule.moveBlock(block.id, to), {
      optimistic: () => optimisticBlock(block.id, { ...to, status: block.status === "skipped" ? "planned" : block.status }),
      success: dayChanged && title ? `Moved “${title}” to ${formatDateKey(to.date, "EEE, MMM d")}` : undefined,
      undo: dayChanged
        ? async () => {
            const b = await svc().schedule.moveBlock(block.id, from);
            // Undoing a move shouldn't count as another reschedule.
            await svc().store.blocks.put({ ...b, rescheduleCount: block.rescheduleCount });
          }
        : undefined,
    });
  },

  resizeBlock(block: ScheduleBlock, durationMinutes: number) {
    return perform(() => svc().schedule.resizeBlock(block.id, durationMinutes), {
      optimistic: () => optimisticBlock(block.id, { durationMinutes }),
    });
  },

  unscheduleBlock(block: ScheduleBlock, title: string) {
    return perform(() => svc().schedule.unscheduleBlock(block.id), {
      success: `“${title}” moved back to unscheduled`,
      undo: () => svc().store.blocks.put(block),
    });
  },

  scheduleTask(taskId: string, date: DateKey, startMinutes: number | null, durationMinutes?: number) {
    return perform(() => svc().schedule.scheduleTask(taskId, { date, startMinutes, durationMinutes }));
  },

  scheduleNextSlot(task: Task, date: DateKey, notBefore = 0) {
    return perform(() => svc().schedule.scheduleInNextSlot(task.id, date, notBefore), {
      success: (b) =>
        `Scheduled “${task.title}” · ${formatDateKey(b.date, "EEE")} ${b.startMinutes !== null ? formatTime(b.startMinutes) : "anytime"}`,
      undo: (b) => svc().schedule.unscheduleBlock(b.id),
    });
  },

  completeTask(task: Task) {
    return perform(() => svc().tasks.complete(task.id), {
      success: `Completed “${task.title}”`,
      undo: () => svc().tasks.reopen(task.id),
      invalidate: [["goals"]],
    });
  },

  reopenTask(task: Task) {
    return perform(() => svc().tasks.reopen(task.id));
  },

  async deleteTask(task: Task) {
    const s = svc();
    const [blocks, entries] = await Promise.all([
      s.store.blocks.listBy("taskId", task.id),
      s.store.timeEntries.listBy("taskId", task.id),
    ]);
    return perform(() => s.tasks.remove(task.id), {
      success: `Deleted “${task.title}”`,
      undo: async () => {
        await s.store.tasks.put(task);
        await s.store.blocks.putMany(blocks);
        await s.store.timeEntries.putMany(entries);
      },
    });
  },

  startTimer(taskId: string, blockId: string | null = null) {
    return perform(() => svc().time.start(taskId, blockId));
  },
  pauseTimer() {
    return perform(() => svc().time.pause());
  },
  resumeTimer() {
    return perform(() => svc().time.resume());
  },
  stopTimer() {
    return perform(() => svc().time.stop(), {
      success: (e) => (e ? `Timer stopped · ${formatDuration(e.durationMinutes)} tracked` : "Timer stopped"),
    });
  },
};
