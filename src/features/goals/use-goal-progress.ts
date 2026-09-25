"use client";

import { useMemo } from "react";
import { useAllBlocks, useAllTimeEntries, useGoalProgress, useGoals, useSettings, useTasks } from "@/hooks/queries";
import type { DateKey, WeekdayIndex } from "@/lib/date";
import { computeGoalProgress, type GoalProgressResult } from "@/lib/goals/progress";
import type { GoalPeriod } from "@/types/domain";

/** Progress for all active goals of the given periods, relative to `reference`. */
export function useGoalProgressList(reference: DateKey | null, periods?: GoalPeriod[], areaId?: string) {
  const goals = useGoals();
  const tasks = useTasks();
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const progress = useGoalProgress();
  const { settings } = useSettings();
  const periodsKey = periods?.join() ?? "";
  const isLoading = goals.isLoading || tasks.isLoading || blocks.isLoading || entries.isLoading || progress.isLoading;

  const results = useMemo<GoalProgressResult[]>(() => {
    if (!reference || isLoading) return [];
    const data = {
      tasks: tasks.data ?? [],
      blocks: blocks.data ?? [],
      entries: entries.data ?? [],
      progress: progress.data ?? [],
    };
    return (goals.data ?? [])
      .filter((g) => !g.archived && (!periods || periods.includes(g.period)) && (!areaId || g.areaId === areaId))
      .map((g) => computeGoalProgress(g, reference, settings.weekStartsOn as WeekdayIndex, data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, isLoading, goals.data, tasks.data, blocks.data, entries.data, progress.data, settings.weekStartsOn, periodsKey, areaId]);

  return { results, isLoading };
}
