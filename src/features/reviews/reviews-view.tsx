"use client";

import { ChevronLeft, ChevronRight, NotebookPen, Redo2 } from "lucide-react";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { Field } from "@/components/shared/field";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaBars } from "@/features/analytics/area-bars";
import { useGoalProgressList } from "@/features/goals/use-goal-progress";
import { useLookups } from "@/features/tasks/use-lookups";
import { useAction } from "@/hooks/use-action";
import { useAllBlocks, useAllTimeEntries, useReviews, useSettings } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { computeProjectStats } from "@/lib/analytics/projects";
import { frequentlyRescheduled, summarizePeriod, timeByArea } from "@/lib/analytics/stats";
import {
  addDaysKey,
  addMonthsKey,
  formatDateKey,
  formatDuration,
  formatHours,
  monthRange,
  weekRange,
  type DateKey,
  type DateRange,
  type WeekdayIndex,
} from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { ui } from "@/store/ui-store";
import type { Review, ReviewType } from "@/types/domain";
import { REVIEW_QUESTIONS } from "./questions";

export function ReviewsView({ initialType }: { initialType?: ReviewType }) {
  const today = useToday();
  const { settings } = useSettings();
  const [type, setType] = React.useState<ReviewType>(initialType ?? "daily");
  const [cursor, setCursor] = React.useState<DateKey | null>(null);
  const reviews = useReviews();
  const ws = settings.weekStartsOn as WeekdayIndex;
  const ref = cursor ?? today;
  if (!ref || !today || reviews.isLoading) return <Skeleton className="h-96" />;

  const range: DateRange = type === "daily" ? { from: ref, to: ref } : type === "weekly" ? weekRange(ref, ws) : monthRange(ref);
  const step = (dir: 1 | -1) =>
    setCursor(type === "daily" ? addDaysKey(ref, dir) : type === "weekly" ? addDaysKey(ref, 7 * dir) : addMonthsKey(ref, dir));
  const existing = (reviews.data ?? []).find((r) => r.type === type && r.periodStart === range.from);
  const history = (reviews.data ?? []).filter((r) => r.type === type);
  const label =
    type === "daily" ? formatDateKey(range.from, "EEEE, MMMM d") : type === "weekly" ? `${formatDateKey(range.from, "MMM d")} – ${formatDateKey(range.to, "MMM d")}` : formatDateKey(range.from, "MMMM yyyy");

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Look back without judgement, then adjust the plan."
        actions={
          <Tabs value={type} onValueChange={(v) => { setType(v as ReviewType); setCursor(null); }}>
            <TabsList>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />
      <div className="mb-4 flex items-center gap-2">
        <div className="flex items-center rounded-lg border border-border">
          <Button size="icon-sm" variant="ghost" onClick={() => step(-1)} aria-label="Previous period"><ChevronLeft /></Button>
          <Button size="sm" variant="ghost" onClick={() => setCursor(null)}>Current</Button>
          <Button size="icon-sm" variant="ghost" onClick={() => step(1)} aria-label="Next period" disabled={range.to >= today}><ChevronRight /></Button>
        </div>
        <span className="text-sm font-medium">{label}</span>
        {existing && <span className="text-xs text-muted-foreground">· saved {formatDateKey(existing.updatedAt.slice(0, 10), "MMM d")}</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ReviewForm key={`${type}:${range.from}:${existing?.updatedAt ?? ""}`} type={type} periodStart={range.from} existing={existing} />
        <div className="space-y-4">
          <ReviewContext type={type} range={range} today={today} />
          <Card>
            <CardHeader><CardTitle>Past {type} reviews</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet. Your first one is the most useful.</p>
              ) : (
                <ul className="space-y-1">
                  {history.slice(0, 12).map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => setCursor(r.periodStart)} className={cn("w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent", r.periodStart === range.from && "bg-accent")}>
                        {type === "monthly" ? formatDateKey(r.periodStart, "MMMM yyyy") : formatDateKey(r.periodStart, "EEE, MMM d")}
                        <span className="ml-2 line-clamp-1 text-xs text-muted-foreground">
                          {Object.values(r.answers).find((a) => a.trim()) ?? ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function ReviewForm({ type, periodStart, existing }: { type: ReviewType; periodStart: DateKey; existing?: Review }) {
  const [answers, setAnswers] = React.useState<Record<string, string>>(existing?.answers ?? {});
  const [energy, setEnergy] = React.useState<number | null>(existing?.energy ?? null);
  const [dirty, setDirty] = React.useState(false);
  const { settings } = useSettings();
  const questions = settings.customization.reviewQuestions?.[type] ?? REVIEW_QUESTIONS[type];
  const save = useAction(() => getServices().reviews.save({ type, periodStart, answers, energy }), {
    invalidate: ["reviews"],
    success: "Review saved",
    onSuccess: () => setDirty(false),
  });

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <CardContent className="space-y-4 pt-4">
          {type === "daily" && (
            <Field label="How was my energy?">
              <div className="flex gap-1" role="radiogroup" aria-label="Energy">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={energy === n}
                    onClick={() => { setEnergy(n); setDirty(true); }}
                    className={cn("h-9 flex-1 rounded-md border text-sm transition-colors", energy === n ? "border-primary/60 bg-primary/15 text-primary" : "border-border hover:bg-accent")}
                  >
                    {["Drained", "Low", "Okay", "Good", "Great"][n - 1]}
                  </button>
                ))}
              </div>
            </Field>
          )}
          {questions.map((q) => (
            <Field key={q.id} label={q.label} htmlFor={`rq-${q.id}`}>
              <Textarea
                id={`rq-${q.id}`}
                rows={q.id === "notes" ? 3 : 2}
                placeholder={"placeholder" in q ? (q.placeholder as string | undefined) : undefined}
                value={answers[q.id] ?? ""}
                onChange={(e) => {
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }));
                  setDirty(true);
                }}
              />
            </Field>
          ))}
          <div className="flex items-center justify-end gap-2">
            {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
            <Button type="submit" disabled={save.isPending}>
              <NotebookPen /> {save.isPending ? "Saving…" : existing ? "Update review" : "Save review"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

function ReviewContext({ type, range, today }: { type: ReviewType; range: DateRange; today: DateKey }) {
  const lookups = useLookups();
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const { settings } = useSettings();
  const goals = useGoalProgressList(range.from, type === "monthly" ? ["monthly"] : type === "weekly" ? ["weekly"] : ["daily"]);
  const b = React.useMemo(() => blocks.data ?? [], [blocks.data]);
  const e = React.useMemo(() => entries.data ?? [], [entries.data]);
  const summary = React.useMemo(
    () => summarizePeriod(range, today, { tasks: lookups.tasks, blocks: b, entries: e, workingDays: settings.workingDays }),
    [range, today, lookups.tasks, b, e, settings.workingDays],
  );
  const areas = React.useMemo(() => timeByArea(range, lookups.tasks, lookups.areas, b, e), [range, lookups, b, e]);
  const moved = React.useMemo(() => frequentlyRescheduled(range, lookups.tasks, b, type === "daily" ? 1 : 2), [range, lookups.tasks, b, type]);

  if (blocks.isLoading) return <Skeleton className="h-64" />;
  const dayBlocks = b.filter((x) => x.date === range.from);

  return (
    <Card>
      <CardHeader><CardTitle>What the data says</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Planned vs completed" value={`${formatHours(summary.completedMinutes)} / ${formatHours(summary.plannedMinutes)}`} hint={`${summary.completionPercent}%`} />
          <Stat label="Actual time" value={formatHours(summary.actualMinutes)} hint={summary.estimateMinutes ? `Est. variance ${summary.estimateVarianceMinutes >= 0 ? "+" : ""}${formatDuration(summary.estimateVarianceMinutes)}` : undefined} />
        </div>

        {type === "daily" && (
          <div className="space-y-2 text-sm">
            <SectionTitle>Blocks</SectionTitle>
            {dayBlocks.length === 0 && <p className="text-muted-foreground">Nothing was planned.</p>}
            <ul className="space-y-1">
              {dayBlocks.map((x) => {
                const t = lookups.taskById.get(x.taskId);
                return (
                  <li key={x.id} className="flex items-center gap-2">
                    <span className={cn("size-1.5 rounded-full", x.status === "completed" ? "bg-success" : x.status === "skipped" ? "bg-muted-foreground" : "bg-warning")} aria-hidden />
                    <span className="flex-1 truncate">{t?.title}</span>
                    <span className="text-xs text-muted-foreground">{x.status === "planned" ? "open" : x.status}</span>
                  </li>
                );
              })}
            </ul>
            {dayBlocks.some((x) => x.status === "planned") && range.from <= today && (
              <Button size="sm" variant="secondary" onClick={() => ui.openRollover()}><Redo2 /> Move unfinished forward…</Button>
            )}
          </div>
        )}

        {type !== "daily" && (
          <>
            <div>
              <SectionTitle>Most productive area</SectionTitle>
              {areas[0] && areas[0].minutes > 0 ? (
                <p className="flex items-center gap-1.5 text-sm"><AreaDot color={areas[0].color} /> {areas[0].name} · {formatHours(areas[0].minutes)}</p>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
            <div>
              <SectionTitle>Time distribution</SectionTitle>
              <AreaBars rows={areas} />
            </div>
          </>
        )}

        <div>
          <SectionTitle>{type === "daily" ? "Moved today" : "Repeatedly rescheduled"}</SectionTitle>
          {moved.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing moved repeatedly.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {moved.slice(0, 6).map((m) => (
                <li key={m.task.id} className="flex justify-between gap-2">
                  <span className="truncate">{m.task.title}</span>
                  <span className="text-xs text-muted-foreground">moved {m.moves}×</span>
                </li>
              ))}
            </ul>
          )}
          {moved.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Repeated moves often mean the task is too big or unclear — consider splitting it.</p>}
        </div>

        {goals.results.length > 0 && (
          <div>
            <SectionTitle>Goals</SectionTitle>
            <ul className="space-y-1 text-sm">
              {goals.results.map((g) => (
                <li key={g.goal.id} className="flex justify-between gap-2">
                  <span className="truncate">{g.goal.title}</span>
                  <span className={cn("text-xs tabular", g.percent >= 100 ? "text-success" : "text-muted-foreground")}>{g.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {type === "monthly" && <MonthlyProjects />}
      </CardContent>
    </Card>
  );
}

function MonthlyProjects() {
  const lookups = useLookups();
  const blocks = useAllBlocks();
  const entries = useAllTimeEntries();
  const stats = [...computeProjectStats(lookups.projects, lookups.tasks, blocks.data ?? [], entries.data ?? []).values()].filter((p) => p.project.status === "active");
  if (stats.length === 0) return null;
  return (
    <div>
      <SectionTitle>Projects progress</SectionTitle>
      <ul className="space-y-1 text-sm">
        {stats.map((s) => (
          <li key={s.project.id} className="flex justify-between gap-2">
            <span className="truncate">{s.project.name}</span>
            <span className="text-xs text-muted-foreground tabular">{s.percent}% · {s.completed}/{s.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
