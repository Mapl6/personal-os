"use client";

import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "@/lib/date";
import { getServices } from "@/services";
import { DEFAULT_SETTINGS } from "@/types/domain";

export const qk = {
  settings: ["settings"] as const,
  areas: ["areas"] as const,
  projects: ["projects"] as const,
  tasks: ["tasks"] as const,
  blocks: ["blocks"] as const,
  blocksRange: (r: DateRange) => ["blocks", "range", r.from, r.to] as const,
  blocksAll: ["blocks", "all"] as const,
  entries: ["timeEntries"] as const,
  entriesRange: (r: DateRange) => ["timeEntries", "range", r.from, r.to] as const,
  entriesAll: ["timeEntries", "all"] as const,
  goals: ["goals"] as const,
  goalProgress: ["goalProgress"] as const,
  habits: ["habits"] as const,
  habitEntries: ["habitEntries"] as const,
  reviews: ["reviews"] as const,
  templates: ["templates"] as const,
};

const s = () => getServices();

export function useSettings() {
  const q = useQuery({ queryKey: qk.settings, queryFn: () => s().data.getSettings() });
  return { ...q, settings: q.data ?? DEFAULT_SETTINGS };
}

export function useAreas() {
  return useQuery({
    queryKey: qk.areas,
    queryFn: async () => (await s().store.areas.list()).sort((a, b) => a.order - b.order),
  });
}

export function useProjects() {
  return useQuery({
    queryKey: qk.projects,
    queryFn: async () => (await s().store.projects.list()).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  });
}

export function useTasks() {
  return useQuery({ queryKey: qk.tasks, queryFn: () => s().store.tasks.list() });
}

export function useBlocks(range: DateRange | null) {
  return useQuery({
    queryKey: range ? qk.blocksRange(range) : ["blocks", "range", "none"],
    queryFn: () => s().store.blocks.listByRange("date", range!.from, range!.to),
    enabled: !!range,
  });
}

export function useAllBlocks() {
  return useQuery({ queryKey: qk.blocksAll, queryFn: () => s().store.blocks.list() });
}

export function useTimeEntries(range: DateRange | null) {
  return useQuery({
    queryKey: range ? qk.entriesRange(range) : ["timeEntries", "range", "none"],
    queryFn: () => s().store.timeEntries.listByRange("date", range!.from, range!.to),
    enabled: !!range,
  });
}

export function useAllTimeEntries() {
  return useQuery({ queryKey: qk.entriesAll, queryFn: () => s().store.timeEntries.list() });
}

/** Running timer and the most recent paused session (for Resume). */
export function useTimerState() {
  return useQuery({
    queryKey: ["timeEntries", "timer"],
    queryFn: async () => {
      const [running, paused] = await Promise.all([s().time.running(), s().time.lastPaused()]);
      return { running: running ?? null, paused: paused ?? null };
    },
  });
}

export function useGoals() {
  return useQuery({
    queryKey: qk.goals,
    queryFn: async () => (await s().store.goals.list()).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
  });
}

export function useGoalProgress() {
  return useQuery({ queryKey: qk.goalProgress, queryFn: () => s().store.goalProgress.list() });
}

export function useHabits() {
  return useQuery({
    queryKey: qk.habits,
    queryFn: async () => (await s().store.habits.list()).sort((a, b) => a.order - b.order),
  });
}

export function useHabitEntries(range: DateRange | null) {
  return useQuery({
    queryKey: range ? ["habitEntries", range.from, range.to] : ["habitEntries", "none"],
    queryFn: () => s().store.habitEntries.listByRange("date", range!.from, range!.to),
    enabled: !!range,
  });
}

export function useReviews() {
  return useQuery({
    queryKey: qk.reviews,
    queryFn: async () => (await s().store.reviews.list()).sort((a, b) => b.periodStart.localeCompare(a.periodStart)),
  });
}

export function useTemplates() {
  return useQuery({ queryKey: qk.templates, queryFn: () => s().store.templates.list() });
}
