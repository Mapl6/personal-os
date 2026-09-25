"use client";

import { ChevronLeft, ChevronRight, LayoutList, Plus, Redo2, Rows3 } from "lucide-react";
import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlannerDnd } from "@/features/calendar/dnd";
import { TimeGrid, computeGridRange } from "@/features/calendar/time-grid";
import { UnscheduledPanel } from "@/features/tasks/unscheduled-panel";
import { TimerWidget } from "@/features/time-tracking/timer-widget";
import { useBlocks } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { addDaysKey, formatDateKey, relativeDayLabel } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import { DayAgenda } from "./day-agenda";
import { DaySummaryStrip } from "./day-summary";
import { useDay } from "./use-day";

const VIEW_KEY = "pos-today-view";

export function TodayView() {
  const today = useToday();
  const [offset, setOffset] = React.useState(0);
  const date = today ? addDaysKey(today, offset) : null;
  const [view, setView] = React.useState<"timeline" | "list" | null>(null);

  React.useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(VIEW_KEY);
    } catch {}
    // Phones default to the list; larger screens to the timeline.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- responsive default resolved after mount
    setView((stored as "timeline" | "list") ?? (window.matchMedia("(min-width: 768px)").matches ? "timeline" : "list"));
  }, []);

  const changeView = (v: "timeline" | "list") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const day = useDay(date);
  const past = useBlocks(today ? { from: addDaysKey(today, -14), to: addDaysKey(today, -1) } : null);
  const unfinishedEarlier = (past.data ?? []).filter((b) => b.status === "planned").length;

  if (!date || !today || day.isLoading || !day.progress || !view) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20" />
        <Skeleton className="h-[480px]" />
      </div>
    );
  }

  const { gridStart, gridEnd } = computeGridRange(day.blocks, day.settings.dayStartMinutes, day.settings.dayEndMinutes);
  const hourHeight = day.settings.density === "compact" ? 48 : 56;

  return (
    <PlannerDnd>
      <PageHeader
        title={offset === 0 ? "Today" : relativeDayLabel(date, today)}
        description={formatDateKey(date, "EEEE, MMMM d")}
        actions={
          <>
            <div className="flex items-center rounded-lg border border-border">
              <Button size="icon-sm" variant="ghost" onClick={() => setOffset((o) => o - 1)} aria-label="Previous day">
                <ChevronLeft />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOffset(0)} disabled={offset === 0}>
                Today
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setOffset((o) => o + 1)} aria-label="Next day">
                <ChevronRight />
              </Button>
            </div>
            <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="View">
              <Button size="xs" variant={view === "timeline" ? "secondary" : "ghost"} onClick={() => changeView("timeline")} aria-pressed={view === "timeline"}>
                <Rows3 /> Timeline
              </Button>
              <Button size="xs" variant={view === "list" ? "secondary" : "ghost"} onClick={() => changeView("list")} aria-pressed={view === "list"}>
                <LayoutList /> List
              </Button>
            </div>
            {unfinishedEarlier > 0 && offset === 0 && (
              <Button size="sm" variant="secondary" onClick={() => ui.openRollover()}>
                <Redo2 /> {unfinishedEarlier} unfinished earlier
              </Button>
            )}
            <Button size="sm" onClick={() => ui.newTask({ date })} className="hidden sm:inline-flex">
              <Plus /> Task
            </Button>
          </>
        }
      />

      <DaySummaryStrip progress={day.progress} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className={cn("min-w-0", view === "list" && "border-0 bg-transparent shadow-none")}>
          {view === "timeline" ? (
            <div className="max-h-[calc(100dvh-280px)] min-h-[420px] overflow-y-auto rounded-xl scrollbar-thin">
              <TimeGrid
                days={[date]}
                blocks={day.blocks}
                lookups={day.lookups}
                gridStart={gridStart}
                gridEnd={gridEnd}
                hourHeight={hourHeight}
                today={today}
                nowMinutes={day.nowMinutes}
                runningBlockId={day.runningBlockId}
              />
            </div>
          ) : (
            <DayAgenda date={date} blocks={day.blocks} lookups={day.lookups} runningBlockId={day.runningBlockId} />
          )}
        </Card>
        <div className="space-y-4">
          <TimerWidget variant="card" />
          <UnscheduledPanel lookups={day.lookups} date={date} today={today} />
        </div>
      </div>
    </PlannerDnd>
  );
}
