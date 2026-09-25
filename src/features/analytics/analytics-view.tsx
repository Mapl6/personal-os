"use client";

import { BarChart3 } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLookups } from "@/features/tasks/use-lookups";
import { useAllBlocks, useAllTimeEntries, useSettings } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { dailySeries, frequentlyRescheduled, summarizePeriod, timeByArea } from "@/lib/analytics/stats";
import {
  addDaysKey,
  formatDateKey,
  formatDuration,
  formatHours,
  formatVariance,
  lastNDays,
  monthRange,
  weekRange,
  weekdayOf,
  type WeekdayIndex,
} from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { AreaBars } from "./area-bars";
import { FocusTrendChart, PlannedVsCompletedChart, WeeklyTrendChart } from "./charts";

const RANGES = [7, 14, 30] as const;

export function AnalyticsView() {
  const today = useToday();
  const lookups = useLookups();
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const { settings } = useSettings();
  const [days, setDays] = React.useState<(typeof RANGES)[number]>(14);
  const ws = settings.weekStartsOn as WeekdayIndex;

  const data = React.useMemo(() => {
    if (!today || blocks.isLoading || entries.isLoading) return null;
    const b = blocks.data ?? [];
    const e = entries.data ?? [];
    const range = lastNDays(days, today);
    const ctx = { tasks: lookups.tasks, blocks: b, entries: e, workingDays: settings.workingDays };
    const series = dailySeries(range, b, e);
    const points = series.map((d) => ({
      label: formatDateKey(d.date, days > 14 ? "d" : "EEE d"),
      planned: +(d.plannedMinutes / 60).toFixed(2),
      completed: +(d.completedMinutes / 60).toFixed(2),
      actual: +(d.actualMinutes / 60).toFixed(2),
      date: d.date,
      active: d.blocksCompleted > 0 || d.trackedMinutes > 0,
      expected: settings.workingDays.includes(weekdayOf(d.date)),
    }));
    const weeks = Array.from({ length: 8 }, (_, i) => weekRange(addDaysKey(today, -7 * (7 - i)), ws));
    const weekly = weeks.map((w) => ({
      label: formatDateKey(w.from, "MMM d"),
      actual: +(summarizePeriod(w, today, ctx).actualMinutes / 60).toFixed(2),
    }));
    return {
      range,
      points,
      weekly,
      summary: summarizePeriod(range, today, ctx),
      week: summarizePeriod(weekRange(today, ws), today, ctx),
      month: summarizePeriod(monthRange(today), today, ctx),
      areas: timeByArea(range, lookups.tasks, lookups.areas, b, e),
      moved: frequentlyRescheduled(range, lookups.tasks, b, 2),
    };
  }, [today, blocks.data, blocks.isLoading, entries.data, entries.isLoading, lookups, days, settings.workingDays, ws]);

  if (!data) return <Skeleton className="h-[600px]" />;
  const s = data.summary;
  const hasData = s.plannedMinutes > 0 || s.actualMinutes > 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Where your time went, how plans compared with reality, and how consistent you’ve been."
        actions={
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as (typeof RANGES)[number])}>
            <TabsList aria-label="Range">
              {RANGES.map((r) => <TabsTrigger key={r} value={String(r)}>{r} days</TabsTrigger>)}
            </TabsList>
          </Tabs>
        }
      />

      {!hasData ? (
        <EmptyState icon={BarChart3} title="No tracked time yet." description="Complete blocks or run a timer — analytics fill in automatically." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
            <Stat label="Planned" value={formatHours(s.plannedMinutes)} />
            <Stat label="Completed" value={formatHours(s.completedMinutes)} hint={`${s.completionPercent}% of plan`} />
            <Stat label="Actual (tracked + done)" value={formatHours(s.actualMinutes)} hint={`Timer ${formatHours(s.trackedMinutes)}`} />
            <Stat label="Block completion rate" value={`${s.taskCompletionRate}%`} hint={`${s.blocksCompleted} of ${s.blocksDue} due`} />
            <Stat label="Avg daily focus" value={formatDuration(s.averageDailyFocusMinutes)} />
            <Stat label="Avg block length" value={formatDuration(s.averageBlockMinutes)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div><CardTitle>Planned vs completed</CardTitle><CardDescription>Hours per day, planned duration basis</CardDescription></div>
              </CardHeader>
              <CardContent><PlannedVsCompletedChart data={data.points} /></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div><CardTitle>Focused hours</CardTitle><CardDescription>Actual time per day (completed work + timers)</CardDescription></div>
              </CardHeader>
              <CardContent><FocusTrendChart data={data.points} average={s.averageDailyFocusMinutes / 60} /></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader><div><CardTitle>Where did my time go?</CardTitle><CardDescription>Actual vs planned by area · last {days} days</CardDescription></div></CardHeader>
              <CardContent><AreaBars rows={data.areas} /></CardContent>
            </Card>
            <Card>
              <CardHeader><div><CardTitle>Weekly trend</CardTitle><CardDescription>Actual hours, last 8 weeks</CardDescription></div></CardHeader>
              <CardContent><WeeklyTrendChart data={data.weekly} /></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>Consistency</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm tabular">
                  <div><div className="text-xs text-muted-foreground">Range</div><div className="text-lg font-semibold">{s.consistencyPercent}%</div></div>
                  <div><div className="text-xs text-muted-foreground">This week</div><div className="text-lg font-semibold">{data.week.consistencyPercent}%</div></div>
                  <div><div className="text-xs text-muted-foreground">This month</div><div className="text-lg font-semibold">{data.month.consistencyPercent}%</div></div>
                </div>
                <p className="text-xs text-muted-foreground">Active working days: days with completed work or tracked time. Rest days don’t count against you.</p>
                <ul className="flex flex-wrap gap-1" aria-label="Active days">
                  {data.points.map((p) => (
                    <li
                      key={p.date}
                      title={`${formatDateKey(p.date, "EEE, MMM d")}: ${p.active ? "active" : p.expected ? "no activity" : "rest day"}`}
                      className={cn("size-4 rounded-[3px] border", p.active ? "border-transparent bg-primary" : p.expected ? "border-border" : "border-dashed border-border/50")}
                    >
                      <span className="sr-only">{p.date} {p.active ? "active" : "inactive"}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Estimates vs actual</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Planned (completed blocks)</span><span className="tabular">{formatDuration(s.estimateMinutes)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Actual</span><span className="tabular">{formatDuration(s.estimateMinutes + s.estimateVarianceMinutes)}</span></div>
                <div className="flex justify-between font-medium"><span>Variance</span><span className="tabular">{formatVariance(s.estimateVarianceMinutes)}</span></div>
                <p className="pt-1 text-xs text-muted-foreground">
                  {s.estimateMinutes === 0
                    ? "Complete a few blocks to calibrate."
                    : Math.abs(s.estimateVarianceMinutes) / s.estimateMinutes < 0.1
                      ? "Your estimates are well calibrated."
                      : s.estimateVarianceMinutes > 0
                        ? "Work tends to take longer than planned — consider bigger blocks or buffers."
                        : "You tend to finish early — you could plan slightly less time."}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Plan changes</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Rescheduled blocks</span><span className="tabular">{s.rescheduledBlocks}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Skipped blocks</span><span className="tabular">{s.skippedBlocks}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tasks finished</span><span className="tabular">{s.tasksCompleted}</span></div>
                {data.moved.length > 0 && (
                  <div className="pt-2">
                    <SectionTitle>Moved repeatedly</SectionTitle>
                    <ul className="space-y-1">
                      {data.moved.slice(0, 4).map((m) => (
                        <li key={m.task.id} className="flex justify-between gap-2"><span className="truncate">{m.task.title}</span><span className="text-xs text-muted-foreground">{m.moves}×</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Data table</summary>
            <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full text-sm tabular">
                <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-medium">Day</th><th className="font-medium">Planned</th><th className="font-medium">Completed</th><th className="font-medium">Actual</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {data.points.map((p) => (
                    <tr key={p.date}><td className="py-1">{formatDateKey(p.date, "EEE, MMM d")}</td><td>{formatDuration(p.planned * 60)}</td><td>{formatDuration(p.completed * 60)}</td><td>{formatDuration(p.actual * 60)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </>
  );
}
