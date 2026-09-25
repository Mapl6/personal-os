"use client";

import { ArrowRight, CalendarCheck2, Clock, Flame, Gauge, ListChecks, Play, Redo2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AreaDot, areaColorVar } from "@/components/shared/area";
import { SectionTitle } from "@/components/shared/page-header";
import { Ring, Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlannerDnd } from "@/features/calendar/dnd";
import { TimeGrid, computeGridRange } from "@/features/calendar/time-grid";
import { GoalProgressList } from "@/features/goals/goal-progress-list";
import { workActions } from "@/features/tasks/actions";
import { UnscheduledPanel } from "@/features/tasks/unscheduled-panel";
import { TimerWidget } from "@/features/time-tracking/timer-widget";
import { DayAgenda } from "@/features/today/day-agenda";
import { useDay } from "@/features/today/use-day";
import { useAllBlocks, useAllTimeEntries, useBlocks } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import { summarizePeriod, timeByArea } from "@/lib/analytics/stats";
import {
  addDaysKey,
  formatDateKey,
  formatDuration,
  formatHours,
  formatTime,
  toDateKey,
  weekRange,
  type WeekdayIndex,
} from "@/lib/date";
import { ui } from "@/store/ui-store";

function greeting(hour: number) {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const now = useNow();
  const today = now ? toDateKey(now) : null;
  const day = useDay(today);

  if (!now || !today || day.isLoading || !day.progress) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-32" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const p = day.progress;
  const { gridStart, gridEnd } = computeGridRange(day.blocks, day.settings.dayStartMinutes, day.settings.dayEndMinutes);
  const next = day.blocks.find((b) => b.status === "planned" && b.startMinutes !== null && b.startMinutes + b.durationMinutes > day.nowMinutes);
  const nextTask = next ? day.lookups.taskById.get(next.taskId) : undefined;

  return (
    <PlannerDnd>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{formatDateKey(today, "EEEE, MMMM d")}</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {greeting(now.getHours())}
            {day.settings.name ? `, ${day.settings.name}` : ""}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => ui.openRollover()}>
            <Redo2 /> Carry over
          </Button>
          <Button size="sm" asChild>
            <Link href="/today">
              Plan today <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      {/* Today's progress */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 p-4">
          <Ring value={p.completionPercent} size={76} label={`Day progress ${p.completionPercent}%`} />
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            <Metric label="Planned" value={formatDuration(p.plannedMinutes)} />
            <Metric label="Completed" value={formatDuration(p.completedMinutes)} />
            <Metric label="Remaining" value={formatDuration(p.remainingMinutes)} />
            <Metric label="Tracked" value={formatDuration(p.trackedMinutes)} />
          </dl>
          <div className="hidden text-right text-sm text-muted-foreground sm:block">
            <div className="text-2xl font-semibold text-foreground tabular">
              {p.blocksCompleted}/{p.blocksTotal}
            </div>
            blocks done
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Today’s schedule</CardTitle>
                <Button asChild size="xs" variant="ghost">
                  <Link href="/today">Open</Link>
                </Button>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="hidden max-h-[520px] overflow-y-auto scrollbar-thin md:block">
                  <TimeGrid
                    days={[today]}
                    blocks={day.blocks}
                    lookups={day.lookups}
                    gridStart={gridStart}
                    gridEnd={gridEnd}
                    hourHeight={day.settings.density === "compact" ? 44 : 50}
                    today={today}
                    nowMinutes={day.nowMinutes}
                    runningBlockId={day.runningBlockId}
                  />
                </div>
                <div className="p-3 md:hidden">
                  <DayAgenda date={today} blocks={day.blocks} lookups={day.lookups} runningBlockId={day.runningBlockId} />
                </div>
              </CardContent>
            </Card>
            <UnscheduledPanel lookups={day.lookups} date={today} today={today} limit={6} className="self-start" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly goals</CardTitle>
              <Button asChild size="xs" variant="ghost">
                <Link href="/week">Week</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <GoalProgressList reference={today} periods={["weekly"]} />
            </CardContent>
          </Card>

          <QuickStats today={today} weekStartsOn={day.settings.weekStartsOn as WeekdayIndex} workingDays={day.settings.workingDays} />
        </div>

        <aside className="space-y-4" aria-label="Focus">
          <div>
            <SectionTitle>Current focus</SectionTitle>
            <TimerWidget variant="card" />
          </div>
          <div>
            <SectionTitle>Next up</SectionTitle>
            {next && nextTask ? (
              <Card className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground tabular">
                  <Clock className="size-3.5" />
                  {formatTime(next.startMinutes!)} · {formatDuration(next.durationMinutes)}
                  {next.startMinutes! <= day.nowMinutes && <span className="text-primary">· now</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 font-medium">
                  <AreaDot color={nextTask.areaId ? day.lookups.areaById.get(nextTask.areaId)?.color : null} />
                  {nextTask.title}
                </div>
                {day.runningBlockId !== next.id && (
                  <Button size="sm" className="mt-3 w-full" onClick={() => workActions.startTimer(nextTask.id, next.id)}>
                    <Play /> Start
                  </Button>
                )}
              </Card>
            ) : (
              <Card className="p-4 text-sm text-muted-foreground">Nothing else timed today. Rest counts too.</Card>
            )}
          </div>
          <div>
            <SectionTitle>Daily progress</SectionTitle>
            <DailyAreaBreakdown today={today} />
          </div>
        </aside>
      </div>
    </PlannerDnd>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold tabular">{value}</dd>
    </div>
  );
}

function DailyAreaBreakdown({ today }: { today: string }) {
  const range = { from: today, to: today };
  const blocks = useBlocks(range);
  const all = useAllBlocks();
  const entries = useAllTimeEntries();
  const day = useDay(today);
  const rows = React.useMemo(
    () => timeByArea(range, day.lookups.tasks, day.lookups.areas, all.data ?? [], entries.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, day.lookups.tasks, day.lookups.areas, all.data, entries.data, blocks.data],
  );
  if (rows.length === 0) return <Card className="p-4 text-sm text-muted-foreground">No time planned yet today.</Card>;
  return (
    <Card className="space-y-2.5 p-4">
      {rows.map((r) => (
        <div key={r.areaId ?? "none"} className="text-sm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <AreaDot color={r.color} /> {r.name}
            </span>
            <span className="text-xs text-muted-foreground tabular">
              {formatDuration(r.minutes)} / {formatDuration(r.plannedMinutes)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${r.plannedMinutes ? Math.min(100, (r.minutes / r.plannedMinutes) * 100) : 100}%`, background: areaColorVar(r.color) }}
            />
          </div>
        </div>
      ))}
    </Card>
  );
}

function QuickStats({ today, weekStartsOn, workingDays }: { today: string; weekStartsOn: WeekdayIndex; workingDays: number[] }) {
  const week = weekRange(today, weekStartsOn);
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const day = useDay(today);
  const s = React.useMemo(
    () =>
      summarizePeriod(week, today, {
        tasks: day.lookups.tasks,
        blocks: blocks.data ?? [],
        entries: entries.data ?? [],
        workingDays,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [week.from, today, day.lookups.tasks, blocks.data, entries.data, workingDays],
  );
  // Streak of consecutive active days ending yesterday/today.
  const streak = React.useMemo(() => {
    const active = new Set<string>();
    for (const b of blocks.data ?? []) if (b.status === "completed") active.add(b.date);
    for (const e of entries.data ?? []) active.add(e.date);
    let n = 0;
    let d = active.has(today) ? today : addDaysKey(today, -1);
    while (active.has(d)) {
      n++;
      d = addDaysKey(d, -1);
    }
    return n;
  }, [blocks.data, entries.data, today]);

  return (
    <section aria-label="This week">
      <SectionTitle
        action={
          <Button asChild size="xs" variant="ghost">
            <Link href="/analytics">Analytics</Link>
          </Button>
        }
      >
        This week
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat icon={<CalendarCheck2 />} label="Completed / planned" value={`${formatHours(s.completedMinutes)} / ${formatHours(s.plannedMinutes)}`} hint={`${s.completionPercent}% of plan`} />
        <Stat icon={<Gauge />} label="Avg daily focus" value={formatDuration(s.averageDailyFocusMinutes)} hint={`${formatHours(s.actualMinutes)} total`} />
        <Stat icon={<ListChecks />} label="Consistency" value={`${s.consistencyPercent}%`} hint={`${s.activeDays} of ${s.expectedDays} working days`} />
        <Stat icon={<Flame />} label="Active streak" value={`${streak} day${streak === 1 ? "" : "s"}`} hint={s.rescheduledBlocks ? `${s.rescheduledBlocks} blocks moved — flexible` : "Steady"} />
      </div>
    </section>
  );
}
