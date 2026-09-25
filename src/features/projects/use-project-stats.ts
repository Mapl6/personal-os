"use client";

import { useMemo } from "react";
import { useAllBlocks, useAllTimeEntries } from "@/hooks/queries";
import { computeProjectStats } from "@/lib/analytics/projects";
import { useLookups } from "@/features/tasks/use-lookups";

export function useProjectStats() {
  const lookups = useLookups();
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const stats = useMemo(
    () => computeProjectStats(lookups.projects, lookups.tasks, blocks.data ?? [], entries.data ?? []),
    [lookups.projects, lookups.tasks, blocks.data, entries.data],
  );
  return { stats, lookups, isLoading: lookups.isLoading || blocks.isLoading || entries.isLoading };
}
