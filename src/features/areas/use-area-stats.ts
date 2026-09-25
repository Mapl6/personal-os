"use client";

import { useMemo } from "react";
import { useAllBlocks, useAllTimeEntries, useGoals } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { timeByArea } from "@/lib/analytics/stats";
import { lastNDays } from "@/lib/date";
import { useLookups } from "@/features/tasks/use-lookups";

export function useAreaStats() {
  const lookups = useLookups();
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const goals = useGoals();
  const today = useToday();
  const stats = useMemo(() => {
    const out = new Map<string, { openTasks: number; projects: number; goals: number; minutes30: number; planned30: number }>();
    if (!today) return out;
    for (const a of lookups.areas) out.set(a.id, { openTasks: 0, projects: 0, goals: 0, minutes30: 0, planned30: 0 });
    for (const t of lookups.tasks) {
      const s = t.areaId ? out.get(t.areaId) : undefined;
      if (s && ["inbox", "planned", "in_progress"].includes(t.status)) s.openTasks++;
    }
    for (const p of lookups.projects) {
      const s = p.areaId ? out.get(p.areaId) : undefined;
      if (s && p.status === "active") s.projects++;
    }
    for (const g of goals.data ?? []) if (g.areaId && !g.archived && out.has(g.areaId)) out.get(g.areaId)!.goals++;
    for (const row of timeByArea(lastNDays(30, today), lookups.tasks, lookups.areas, blocks.data ?? [], entries.data ?? [])) {
      if (row.areaId && out.has(row.areaId)) {
        out.get(row.areaId)!.minutes30 = row.minutes;
        out.get(row.areaId)!.planned30 = row.plannedMinutes;
      }
    }
    return out;
  }, [today, lookups, blocks.data, entries.data, goals.data]);
  return { stats, lookups, today, isLoading: !today || lookups.isLoading || blocks.isLoading || entries.isLoading };
}
