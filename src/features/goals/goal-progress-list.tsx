"use client";

import { Target } from "lucide-react";
import Link from "next/link";
import { AreaDot, areaColorVar } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAreas } from "@/hooks/queries";
import type { DateKey } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import type { GoalPeriod } from "@/types/domain";
import { useGoalProgressList } from "./use-goal-progress";

export function GoalProgressList({
  reference,
  periods,
  columns = 2,
  areaId,
  emptyHint = "Set a target like “Frontend · 8h/week” to see progress here.",
}: {
  reference: DateKey | null;
  periods: GoalPeriod[];
  columns?: 1 | 2 | 4;
  areaId?: string;
  emptyHint?: string;
}) {
  const { results, isLoading } = useGoalProgressList(reference, periods, areaId);
  const areas = useAreas();
  const areaById = new Map((areas.data ?? []).map((a) => [a.id, a]));

  if (isLoading || !reference) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }
  if (results.length === 0) {
    return (
      <EmptyState
        compact
        icon={Target}
        title={`No ${periods.map((p) => p.replace("_", "-")).join("/")} goals`}
        description={emptyHint}
        action={
          <Button asChild size="sm" variant="secondary">
            <Link href="/goals?new=1">Create goal</Link>
          </Button>
        }
      />
    );
  }
  return (
    <ul className={cn("grid gap-x-6 gap-y-4", columns >= 2 && "sm:grid-cols-2", columns === 4 && "xl:grid-cols-4")}>
      {results.map((r) => {
        const area = r.goal.areaId ? areaById.get(r.goal.areaId) : undefined;
        const done = r.percent >= 100;
        return (
          <li key={r.goal.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 font-medium">
                <AreaDot color={area?.color} />
                <span className="truncate">{r.goal.title}</span>
              </span>
              <span className={cn("shrink-0 text-xs tabular", done ? "text-success" : "text-muted-foreground")}>{r.label}</span>
            </div>
            <Progress value={r.percent} color={areaColorVar(area?.color ?? "indigo")} label={`${r.goal.title}: ${r.label}`} />
          </li>
        );
      })}
    </ul>
  );
}
