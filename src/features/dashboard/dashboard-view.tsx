"use client";

import { ArrowRight, CalendarCheck2, Check, Clock, Flame, Gauge, ListChecks, Play, Redo2, SlidersHorizontal } from "lucide-react";
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
import { useAllBlocks, useAllTimeEntries, useBlocks, useHabitEntries, useHabits } from "@/hooks/queries";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import type { DashboardWidget } from "@/types/domain";
import { areaColorVar as habitColor } from "@/components/shared/area";
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
  weekdayOf,
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
          <Button asChild variant="ghost" size="sm">
            <Link href="/settings#customize">
              <SlidersHorizontal /> Customize
            </Link>
          </Button>
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

      {(() => {
        const widgets: Partial<Record<DashboardWidget, { side: boolean; node: React.ReactNode }>> = {
          progress: {
            side: false,
            node: (
              <Card>
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
            ),
          },
          schedule: {
            side: false,
            node: (
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
                        hourHeight={Math.round(day.settings.customization.hourHeight * (day.settings.density === "compact" ? 0.8 : 0.9))}
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
            ),
          },
          weeklyGoals: {
            side: false,
            node: (
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
            ),
          },
          monthlyGoals: {
            side: false,
            node: (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly goals</CardTitle>
                  <Button asChild size="xs" variant="ghost">
                    <Link href="/month">Month</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <GoalProgressList reference={today} periods={["monthly"]} />
                </CardContent>
              </Card>
            ),
          },
          stats: {
            side: false,
            node: <QuickStats today={today} weekStartsOn={day.settings.weekStartsOn as WeekdayIndex} workingDays={day.settings.workingDays} />,
          },
          focus: {
            side: true,
            node: (
              <div>
                <SectionTitle>Current focus</SectionTitle>
                <TimerWidget variant="card" />
              </div>
            ),
          },
          next: {
            side: true,
            node: (
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
            ),
          },
          habits: {
            side: true,
            node: (
              <div>
                <SectionTitle>Today’s habits</SectionTitle>
                <TodayHabits today={today} />
              </div>
            ),
          },
          areas: {
            side: true,
            node: (
              <div>
                <SectionTitle>Daily progress</SectionTitle>
                <DailyAreaBreakdown today={today} />
              </div>
            ),
          },
        };
        const visible = day.settings.customization.dashboardWidgets.filter((w) => w.visible && widgets[w.id]);
        const main = visible.filter((w) => !widgets[w.id]!.side);
        const side = visible.filter((w) => widgets[w.id]!.side);
        return (
          <div className={cn("grid gap-4", side.length > 0 && main.length > 0 && "lg:grid-cols-[minmax(0,1fr)_320px]")}>
            {main.length > 0 && (
              <div className="min-w-0 space-y-4">
                {main.map((w) => (
                  <React.Fragment key={w.id}>{widgets[w.id]!.node}</React.Fragment>
                ))}
              </div>
            )}
            {side.length > 0 && (
              <aside className="space-y-4" aria-label="Focus">
                {side.map((w) => (
                  <React.Fragment key={w.id}>{widgets[w.id]!.node}</React.Fragment>
                ))}
              </aside>
            )}
            {visible.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                All dashboard widgets are hidden. <Link className="text-primary underline" href="/settings#customize">Choose widgets</Link>
              </Card>
            )}
          </div>
        );
      })()}
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

function TodayHabits({ today }: { today: string }) {
  const habits = useHabits();
  const entries = useHabitEntries({ from: today, to: today });
  const toggle = useAction((habitId: string) => getServices().habits.toggle(habitId, today), { invalidate: ["habits"] });
  const due = (habits.data ?? []).filter((h) => !h.archived && h.weekdays.includes(weekdayOf(today)));
  const done = new Set((entries.data ?? []).map((e) => e.habitId));
  if (due.length === 0) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        No habits scheduled today. <Link className="text-primary underline" href="/habits">Manage habits</Link>
      </Card>
    );
  }
  return (
    <Card className="p-2">
      <ul>
        {due.map((h) => {
          const isDone = done.has(h.id);
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => toggle.mutate(h.id)}
                aria-pressed={isDone}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span
                  className={cn("flex size-5 items-center justify-center rounded-md border", isDone ? "border-transparent" : "border-border")}
                  style={isDone ? { background: habitColor(h.color) } : undefined}
                  aria-hidden
                >
                  {isDone && <Check className="size-3 text-background" strokeWidth={3} />}
                </span>
                <span className={cn("flex-1", isDone && "text-muted-foreground")}>{h.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
