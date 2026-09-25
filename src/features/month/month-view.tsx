"use client";

import { ChevronLeft, ChevronRight, Flag, FolderKanban } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Ring, Stat } from "@/components/shared/stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaBars } from "@/features/analytics/area-bars";
import { GoalProgressList } from "@/features/goals/goal-progress-list";
import { useLookups } from "@/features/tasks/use-lookups";
import { useAllBlocks, useAllTimeEntries, useGoals, useSettings } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { computeProjectStats } from "@/lib/analytics/projects";
import { dailySeries, summarizePeriod, timeByArea } from "@/lib/analytics/stats";
import {
  addDaysKey,
  addMonthsKey,
  formatDateKey,
  formatDuration,
  formatHours,
  isInRange,
  monthGridRange,
  monthRange,
  weekRange,
  type WeekdayIndex,
} from "@/lib/date";
import { cn } from "@/lib/utils/cn";

export function MonthView() {
  const today = useToday();
  const { settings } = useSettings();
  const [offset, setOffset] = React.useState(0);
  const anchor = today ? addMonthsKey(today.slice(0, 8) + "01", offset) : null;
  const lookups = useLookups();
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const goals = useGoals();
  const ws = settings.weekStartsOn as WeekdayIndex;

  const data = React.useMemo(() => {
    if (!anchor || !today || blocks.isLoading || entries.isLoading) return null;
    const range = monthRange(anchor);
    const b = blocks.data ?? [];
    const e = entries.data ?? [];
    const summary = summarizePeriod(range, today, { tasks: lookups.tasks, blocks: b, entries: e, workingDays: settings.workingDays });
    const areas = timeByArea(range, lookups.tasks, lookups.areas, b, e);
    const weeks: { from: string; to: string }[] = [];
    for (let d = weekRange(range.from, ws).from; d <= range.to; d = addDaysKey(d, 7)) weeks.push(weekRange(d, ws));
    const weekly = weeks.map((w) => {
      const clipped = { from: w.from < range.from ? range.from : w.from, to: w.to > range.to ? range.to : w.to };
      return { range: w, summary: summarizePeriod(clipped, today, { tasks: lookups.tasks, blocks: b, entries: e, workingDays: settings.workingDays }) };
    });
    const series = dailySeries(monthGridRange(anchor, ws), b, e);
    const projects = [...computeProjectStats(lookups.projects, lookups.tasks, b, e).values()].filter((p) => p.project.status === "active");
    return { range, summary, areas, weekly, series, projects };
  }, [anchor, today, blocks.data, blocks.isLoading, entries.data, entries.isLoading, lookups, settings.workingDays, ws]);

  if (!data || !anchor || !today) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const milestones = (goals.data ?? [])
    .filter((g) => !g.archived)
    .flatMap((g) => g.milestones.map((m) => ({ goal: g, m })))
    .filter(({ m, goal }) => (m.dueDate ? isInRange(m.dueDate, data.range) : goal.period === "long_term"))
    .slice(0, 10);

  return (
    <>
      <PageHeader
        title={formatDateKey(anchor, "MMMM yyyy")}
        description="Monthly goals, projects, milestones and how the weeks added up."
        actions={
          <div className="flex items-center rounded-lg border border-border">
            <Button size="icon-sm" variant="ghost" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month">
              <ChevronLeft />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOffset(0)} disabled={offset === 0}>
              This month
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={() => setOffset((o) => o + 1)} aria-label="Next month">
              <ChevronRight />
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly goals</CardTitle>
              <Button asChild size="xs" variant="ghost">
                <Link href="/goals">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <GoalProgressList reference={anchor} periods={["monthly"]} emptyHint="E.g. Frontend 40h, Gym 8 sessions, Book 250 pages." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly summaries</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Weekly summaries for {formatDateKey(anchor, "MMMM")}</caption>
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1.5 font-medium">Week</th>
                    <th className="py-1.5 font-medium">Planned</th>
                    <th className="py-1.5 font-medium">Completed</th>
                    <th className="py-1.5 font-medium">Actual</th>
                    <th className="py-1.5 font-medium">Consistency</th>
                    <th className="w-32 py-1.5 font-medium"><span className="sr-only">Progress</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border tabular">
                  {data.weekly.map(({ range, summary }) => (
                    <tr key={range.from}>
                      <td className="py-2">{formatDateKey(range.from, "MMM d")} – {formatDateKey(range.to, "MMM d")}</td>
                      <td>{formatHours(summary.plannedMinutes)}</td>
                      <td>{formatHours(summary.completedMinutes)}</td>
                      <td>{formatHours(summary.actualMinutes)}</td>
                      <td>{range.from > today ? "—" : `${summary.consistencyPercent}%`}</td>
                      <td>
                        <Progress value={summary.completionPercent} label={`Week of ${range.from}: ${summary.completionPercent}%`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Major projects</CardTitle>
              <Button asChild size="xs" variant="ghost">
                <Link href="/projects">All projects</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.projects.length === 0 ? (
                <EmptyState compact icon={FolderKanban} title="No projects yet." action={<Button asChild size="sm" variant="secondary"><Link href="/projects">Create project</Link></Button>} />
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {data.projects.map((p) => {
                    const area = p.project.areaId ? lookups.areaById.get(p.project.areaId) : undefined;
                    const dueThisMonth = p.project.deadline && isInRange(p.project.deadline, data.range);
                    return (
                      <li key={p.project.id}>
                        <Link href={`/projects/${p.project.id}`} className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/40">
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                              <AreaDot color={area?.color} /> {p.project.name}
                            </span>
                            {dueThisMonth && <Badge variant="warning">due {formatDateKey(p.project.deadline!, "MMM d")}</Badge>}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground tabular">
                            <span>{p.completed}/{p.total} tasks</span>
                            <span>{formatHours(p.minutesSpent)} spent</span>
                          </div>
                          <Progress value={p.percent} className="mt-1.5" label={`${p.project.name} ${p.percent}%`} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Ring value={data.summary.completionPercent} size={72} label={`Overall completion ${data.summary.completionPercent}%`} />
              <div>
                <div className="text-sm font-medium">Overall completion</div>
                <div className="text-xs text-muted-foreground tabular">
                  {formatHours(data.summary.completedMinutes)} of {formatHours(data.summary.plannedMinutes)} planned
                </div>
                <div className="text-xs text-muted-foreground tabular">{data.summary.tasksCompleted} tasks finished</div>
              </div>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Actual time" value={formatHours(data.summary.actualMinutes)} />
            <Stat label="Consistency" value={`${data.summary.consistencyPercent}%`} hint={`${data.summary.activeDays}/${data.summary.expectedDays} days`} />
            <Stat label="Avg / day" value={formatDuration(data.summary.averageDailyFocusMinutes)} />
            <Stat label="Moved" value={data.summary.rescheduledBlocks} hint="flexibility, not failure" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Time distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <AreaBars rows={data.areas} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones this month.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {milestones.map(({ goal, m }) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <Flag className={cn("size-3.5", m.done ? "text-success" : "text-muted-foreground")} />
                      <span className={cn("flex-1 truncate", m.done && "text-muted-foreground line-through")}>{m.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{goal.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="p-4">
            <div className="mb-2 text-sm font-medium">Daily completion</div>
            <Heatmap series={data.series} month={anchor.slice(0, 7)} weekStartsOn={ws} />
          </Card>
        </aside>
      </div>
    </>
  );
}

function Heatmap({ series, month, weekStartsOn }: { series: ReturnType<typeof dailySeries>; month: string; weekStartsOn: number }) {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i}>{labels[(i + weekStartsOn) % 7]}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {series.map((d) => {
          const inMonth = d.date.startsWith(month);
          const v = d.plannedMinutes ? d.completionPercent : 0;
          return (
            <Link
              key={d.date}
              href={`/calendar?view=day&date=${d.date}`}
              title={`${formatDateKey(d.date, "MMM d")}: ${d.plannedMinutes ? `${v}% of ${formatHours(d.plannedMinutes)}` : "nothing planned"}`}
              className={cn("aspect-square rounded-[4px] border border-border/50", !inMonth && "opacity-30")}
              style={{ background: d.plannedMinutes ? `color-mix(in oklch, var(--primary) ${15 + v * 0.75}%, transparent)` : undefined }}
            >
              <span className="sr-only">{d.date}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
