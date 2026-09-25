"use client";

import { useMemo } from "react";
import { useBlocks, useSettings, useTimeEntries, useTimerState } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import { dayProgress } from "@/lib/analytics/stats";
import { toDateKey, minutesOfDay, type DateKey } from "@/lib/date";
import { useLookups } from "@/features/tasks/use-lookups";

/** Everything a single-day planner needs. */
export function useDay(date: DateKey | null) {
  const range = date ? { from: date, to: date } : null;
  const blocks = useBlocks(range);
  const entries = useTimeEntries(range);
  const lookups = useLookups();
  const timer = useTimerState();
  const { settings } = useSettings();
  const now = useNow();

  const progress = useMemo(
    () => (date ? dayProgress(date, blocks.data ?? [], entries.data ?? [], now ?? new Date()) : null),
    [date, blocks.data, entries.data, now],
  );
  const sorted = useMemo(
    () =>
      [...(blocks.data ?? [])].sort(
        (a, b) => (a.startMinutes ?? -1) - (b.startMinutes ?? -1) || a.createdAt.localeCompare(b.createdAt),
      ),
    [blocks.data],
  );

  return {
    blocks: sorted,
    progress,
    lookups,
    settings,
    runningBlockId: timer.data?.running?.blockId ?? null,
    today: now ? toDateKey(now) : null,
    nowMinutes: now ? minutesOfDay(now) : 0,
    isLoading: blocks.isLoading || lookups.isLoading || !date,
  };
}
