"use client";

import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Plus, Sun } from "lucide-react";
import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kbd } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnscheduledPanel } from "@/features/tasks/unscheduled-panel";
import { useLookups } from "@/features/tasks/use-lookups";
import { useBlocks, useSettings, useTimerState } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import {
  addDaysKey,
  addMonthsKey,
  daysInRange,
  formatDateKey,
  minutesOfDay,
  monthGridRange,
  toDateKey,
  weekRange,
  type DateKey,
  type WeekdayIndex,
} from "@/lib/date";
import { ui, uiStore } from "@/store/ui-store";
import { PlannerDnd } from "./dnd";
import { MonthGrid } from "./month-grid";
import { TimeGrid, computeGridRange } from "./time-grid";

export type CalendarMode = "day" | "week" | "month";

export function CalendarView({ initialView, initialDate }: { initialView?: CalendarMode; initialDate?: string }) {
  const now = useNow();
  const today = now ? toDateKey(now) : null;
  const { settings } = useSettings();
  const [view, setView] = React.useState<CalendarMode>(initialView ?? "week");
  const [cursor, setCursor] = React.useState<DateKey | null>(initialDate ?? null);
  const date = cursor ?? today;
  const ws = settings.weekStartsOn as WeekdayIndex;

  const range = !date
    ? null
    : view === "day"
      ? { from: date, to: date }
      : view === "week"
        ? weekRange(date, ws)
        : monthGridRange(date, ws);
  const blocks = useBlocks(range);
  const lookups = useLookups();
  const timer = useTimerState();

  const step = React.useCallback(
    (dir: 1 | -1) => {
      if (!date) return;
      setCursor(view === "day" ? addDaysKey(date, dir) : view === "week" ? addDaysKey(date, 7 * dir) : addMonthsKey(date, dir));
    },
    [date, view],
  );

  // Keyboard: ←/→ navigate, T today, D/W/M switch view.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable) return;
      const s = uiStore.get();
      if (s.commandOpen || s.taskEditor || document.querySelector("[role=dialog],[role=menu]")) return;
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "t") setCursor(null);
      else if (e.key === "d") setView("day");
      else if (e.key === "w") setView("week");
      else if (e.key === "m") setView("month");
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  if (!date || !today || !range || blocks.isLoading || lookups.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[560px]" />
      </div>
    );
  }

  const title =
    view === "day"
      ? formatDateKey(date, "EEEE, MMMM d")
      : view === "week"
        ? `${formatDateKey(range.from, "MMM d")} – ${formatDateKey(range.to, "MMM d, yyyy")}`
        : formatDateKey(date, "MMMM yyyy");
  const data = (blocks.data ?? []).filter((b) => settings.customization.showCompletedInTimeline || b.status !== "completed");
  const { gridStart, gridEnd } = computeGridRange(data, settings.dayStartMinutes, settings.dayEndMinutes);
  const zoom = settings.customization.hourHeight * (settings.density === "compact" ? 0.8 : 1);
  const hourHeight = Math.round(view === "day" ? zoom : zoom * 0.86);
  const nowMinutes = now ? minutesOfDay(now) : 0;
  const running = timer.data?.running?.blockId ?? null;

  return (
    <PlannerDnd>
      <PageHeader
        title="Calendar"
        description={title}
        actions={
          <>
            <Tabs value={view} onValueChange={(v) => setView(v as CalendarMode)}>
              <TabsList aria-label="Calendar view">
                <TabsTrigger value="day"><Sun /> Day</TabsTrigger>
                <TabsTrigger value="week"><CalendarRange /> Week</TabsTrigger>
                <TabsTrigger value="month"><CalendarDays /> Month</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center rounded-lg border border-border">
              <Button size="icon-sm" variant="ghost" onClick={() => step(-1)} aria-label="Previous">
                <ChevronLeft />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCursor(null)}>
                Today
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => step(1)} aria-label="Next">
                <ChevronRight />
              </Button>
            </div>
            <Button size="sm" onClick={() => ui.newTask({ date })}>
              <Plus /> Task
            </Button>
          </>
        }
      />
      <p className="-mt-3 mb-3 hidden text-xs text-muted-foreground md:block">
        Drag to move · drag the bottom edge to resize · click an empty slot to add · <Kbd>←</Kbd> <Kbd>→</Kbd> navigate · <Kbd>D</Kbd>
        <Kbd>W</Kbd>
        <Kbd>M</Kbd> switch view · <Kbd>T</Kbd> today
      </p>

      {view === "month" ? (
        <MonthGrid
          grid={range}
          anchor={date}
          blocks={data}
          lookups={lookups}
          today={today}
          weekStartsOn={ws}
          onOpenDay={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      ) : (
        <div className={view === "day" ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" : ""}>
          <Card className="min-w-0 overflow-hidden">
            <div className="max-h-[calc(100dvh-220px)] min-h-[480px] overflow-auto scrollbar-thin">
              <div className={view === "week" ? "min-w-[760px]" : ""}>
                <TimeGrid
                  days={view === "day" ? [date] : daysInRange(range)}
                  blocks={data}
                  lookups={lookups}
                  gridStart={gridStart}
                  gridEnd={gridEnd}
                  hourHeight={hourHeight}
                  today={today}
                  nowMinutes={nowMinutes}
                  runningBlockId={running}
                  showDayHeaders={view === "week"}
                />
              </div>
            </div>
          </Card>
          {view === "day" && <UnscheduledPanel lookups={lookups} date={date} today={today} className="self-start" />}
        </div>
      )}
    </PlannerDnd>
  );
}
