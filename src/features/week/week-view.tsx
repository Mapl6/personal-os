"use client";

import { ChevronLeft, ChevronRight, Redo2 } from "lucide-react";
import * as React from "react";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlannerDnd } from "@/features/calendar/dnd";
import { GoalProgressList } from "@/features/goals/goal-progress-list";
import { UnscheduledPanel } from "@/features/tasks/unscheduled-panel";
import { useLookups } from "@/features/tasks/use-lookups";
import { useAllBlocks, useBlocks, useSettings, useTimeEntries, useTimerState } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { dailySeries, summarizePeriod } from "@/lib/analytics/stats";
import { addDaysKey, daysInRange, formatDateKey, formatDuration, formatHours, weekRange, type WeekdayIndex } from "@/lib/date";
import { ui } from "@/store/ui-store";
import { ApplyTemplateDialog } from "./template-dialog";
import { WeekBoard } from "./week-board";

export function WeekView() {
  const today = useToday();
  const { settings } = useSettings();
  const [offset, setOffset] = React.useState(0);
  const anchor = today ? addDaysKey(today, offset * 7) : null;
  const range = anchor ? weekRange(anchor, settings.weekStartsOn as WeekdayIndex) : null;
  const blocks = useBlocks(range);
  const entries = useTimeEntries(range);
  const allBlocks = useAllBlocks();
  const lookups = useLookups();
  const timer = useTimerState();

  const series = React.useMemo(
    () => (range ? dailySeries(range, allBlocks.data ?? [], entries.data ?? []) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range?.from, allBlocks.data, entries.data],
  );
  const summary = React.useMemo(
    () =>
      range && today
        ? summarizePeriod(range, today, { tasks: lookups.tasks, blocks: allBlocks.data ?? [], entries: entries.data ?? [], workingDays: settings.workingDays })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range?.from, today, lookups.tasks, allBlocks.data, entries.data, settings.workingDays],
  );

  if (!range || !today || !anchor || blocks.isLoading || lookups.isLoading || !summary) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24" />
        <Skeleton className="h-[420px]" />
      </div>
    );
  }

  const days = daysInRange(range);
  const label = offset === 0 ? "This week" : offset === 1 ? "Next week" : offset === -1 ? "Last week" : "Week";

  return (
    <PlannerDnd>
      <PageHeader
        title={label}
        description={`${formatDateKey(range.from, "MMM d")} – ${formatDateKey(range.to, "MMM d, yyyy")}`}
        actions={
          <>
            <div className="flex items-center rounded-lg border border-border">
              <Button size="icon-sm" variant="ghost" onClick={() => setOffset((o) => o - 1)} aria-label="Previous week">
                <ChevronLeft />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOffset(0)} disabled={offset === 0}>
                This week
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setOffset((o) => o + 1)} aria-label="Next week">
                <ChevronRight />
              </Button>
            </div>
            <ApplyTemplateDialog weekStart={range.from} today={today} />
            {offset === 0 && (
              <Button size="sm" variant="secondary" onClick={() => ui.openRollover()}>
                <Redo2 /> Carry over
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="pt-4">
          <SectionTitle>Weekly goal progress</SectionTitle>
          <GoalProgressList reference={anchor} periods={["weekly"]} columns={4} />
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Planned" value={formatHours(summary.plannedMinutes)} hint={`${summary.blocksDue} blocks due so far`} />
        <Stat label="Completed" value={formatHours(summary.completedMinutes)} hint={`${summary.completionPercent}% of plan`} />
        <Stat label="Actual time" value={formatHours(summary.actualMinutes)} hint={`Tracked ${formatHours(summary.trackedMinutes)}`} />
        <Stat label="Consistency" value={`${summary.consistencyPercent}%`} hint={`${summary.activeDays}/${summary.expectedDays} working days`} />
        <Stat
          label="Estimate vs actual"
          value={summary.estimateMinutes ? `${summary.estimateVarianceMinutes >= 0 ? "+" : ""}${formatDuration(summary.estimateVarianceMinutes)}` : "—"}
          hint={summary.rescheduledBlocks ? `${summary.rescheduledBlocks} moved · ${summary.skippedBlocks} skipped` : "No moves"}
          className="col-span-2 md:col-span-1"
        />
      </div>

      <WeekBoard
        days={days}
        blocks={blocks.data ?? []}
        series={series}
        lookups={lookups}
        today={today}
        runningBlockId={timer.data?.running?.blockId ?? null}
        workingDays={settings.workingDays}
      />

      <div className="mt-4">
        <UnscheduledPanel lookups={lookups} date={offset === 0 ? today : range.from} today={today} />
      </div>
    </PlannerDnd>
  );
}
