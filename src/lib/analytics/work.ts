import { isInRange, type DateKey, type DateRange } from "@/lib/date";
import type { ScheduleBlock, TimeEntry } from "@/types/domain";

/** A unit of actually-done work, attributed to a task and a day. */
export interface WorkRecord {
  taskId: string;
  date: DateKey;
  minutes: number;
}

/** Minutes of a time entry; a running timer counts up to `now`. */
export function entryMinutes(entry: TimeEntry, now: Date = new Date()): number {
  if (entry.end) return entry.durationMinutes;
  return Math.max(0, (now.getTime() - new Date(entry.start).getTime()) / 60000);
}

export function blockActualMinutes(block: ScheduleBlock): number {
  return block.actualMinutes ?? block.durationMinutes;
}

/**
 * Single source of truth for "time actually spent" so analytics and goals
 * never double count:
 *  - completed blocks contribute their recorded actual duration;
 *  - time entries contribute only when they are NOT attached to a completed
 *    block (whose actual already includes them).
 */
export function collectWork(
  blocks: readonly ScheduleBlock[],
  entries: readonly TimeEntry[],
  range: DateRange,
  now: Date = new Date(),
): WorkRecord[] {
  const completedIds = new Set<string>();
  const records: WorkRecord[] = [];
  for (const block of blocks) {
    if (block.status !== "completed") continue;
    completedIds.add(block.id);
    if (isInRange(block.date, range)) {
      records.push({ taskId: block.taskId, date: block.date, minutes: blockActualMinutes(block) });
    }
  }
  for (const entry of entries) {
    if (!isInRange(entry.date, range)) continue;
    if (entry.blockId && completedIds.has(entry.blockId)) continue;
    records.push({ taskId: entry.taskId, date: entry.date, minutes: entryMinutes(entry, now) });
  }
  return records;
}

export function trackedMinutes(entries: readonly TimeEntry[], range: DateRange, now: Date = new Date()): number {
  let total = 0;
  for (const e of entries) if (isInRange(e.date, range)) total += entryMinutes(e, now);
  return total;
}
