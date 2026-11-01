"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Circle, SkipForward } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DateField } from "@/components/shared/date-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckInCard, ENERGY_LABELS, MOODS } from "@/features/checkin/check-in-card";
import { useDay } from "@/features/today/use-day";
import { useCheckIns, useFeatures, useHabitEntries, useHabits, usePages } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { addDaysKey, formatDateKey, formatDuration, formatTime, isDateKey, relativeDayLabel, type DateKey } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { PageDocument } from "./page-document";

/** A note for every day, with that day's live plan beside it. */
export function DailyView({ date: requested }: { date?: string }) {
  const today = useToday();
  const router = useRouter();
  const date = requested && isDateKey(requested) ? requested : today;
  // Idempotent: two tabs opening the same day get the same note (natural id).
  const note = useQuery({
    queryKey: ["pages", "period", "daily", date],
    queryFn: () => getServices().pages.getOrCreatePeriodNote("daily", date!),
    enabled: !!date,
  });
  const pages = usePages();
  const live = pages.data?.find((p) => p.id === note.data?.id) ?? note.data;

  if (!date || !today || !live) return <Skeleton className="h-96" />;
  const go = (d: DateKey) => router.push(d === today ? "/daily" : `/daily/${d}`);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button size="icon-sm" variant="ghost" onClick={() => go(addDaysKey(date, -1))} aria-label="Previous day">
            <ChevronLeft />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => go(addDaysKey(date, 1))} aria-label="Next day">
            <ChevronRight />
          </Button>
          {date !== today && (
            <Button size="sm" variant="ghost" onClick={() => go(today)}>
              Today
            </Button>
          )}
          <DateField value={date} onChange={(d) => d && go(d)} aria-label="Jump to date" className="w-44" />
          <NoteStrip date={date} today={today} onPick={go} />
        </div>
        <PageDocument
          key={live.id}
          page={live}
          fixedTitle={`${relativeDayLabel(date, today)}${["Today", "Yesterday", "Tomorrow"].includes(relativeDayLabel(date, today)) ? ` · ${formatDateKey(date, "EEE, MMM d")}` : ""}`}
        />
      </div>
      <aside className="space-y-4">
        <DayPlan date={date} />
        <DayHabits date={date} />
        <DayCheckIns date={date} today={today} />
      </aside>
    </div>
  );
}

/** Last 14 days; filled dots mark days with a note. */
function NoteStrip({ date, today, onPick }: { date: DateKey; today: DateKey; onPick: (d: DateKey) => void }) {
  const pages = usePages();
  const withNotes = React.useMemo(
    () => new Set((pages.data ?? []).filter((p) => p.kind === "daily" && p.periodStart).map((p) => p.periodStart!)),
    [pages.data],
  );
  const days = Array.from({ length: 14 }, (_, i) => addDaysKey(today, i - 13));
  return (
    <div className="ml-auto hidden items-center gap-1 sm:flex" aria-label="Recent daily notes">
      {days.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onPick(d)}
          title={formatDateKey(d, "EEE, MMM d")}
          aria-label={`${formatDateKey(d, "EEE, MMM d")}${withNotes.has(d) ? ", has a note" : ""}`}
          className={cn(
            "size-3 rounded-sm border border-border",
            withNotes.has(d) && "border-primary/50 bg-primary/40",
            d === date && "ring-2 ring-ring",
          )}
        />
      ))}
    </div>
  );
}

function DayPlan({ date }: { date: DateKey }) {
  const day = useDay(date);
  if (day.isLoading || !day.progress) return <Skeleton className="h-40" />;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex w-full items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" /> Plan
          </span>
          <Link href={`/calendar?date=${date}`} className="text-xs font-normal text-muted-foreground hover:text-foreground">
            Open calendar
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {day.blocks.length === 0 ? (
          <p className="text-muted-foreground">Nothing scheduled.</p>
        ) : (
          <ul className="space-y-1">
            {day.blocks.map((b) => {
              const task = day.lookups.taskById.get(b.taskId);
              const Icon = b.status === "completed" ? Check : b.status === "skipped" ? SkipForward : Circle;
              return (
                <li key={b.id} className="flex items-center gap-2">
                  <Icon className={cn("size-3.5 shrink-0", b.status === "completed" ? "text-success" : "text-muted-foreground")} />
                  <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">{b.startMinutes != null ? formatTime(b.startMinutes) : "—"}</span>
                  <span className={cn("truncate", b.status === "completed" && "text-muted-foreground line-through")}>{task?.title ?? "Task"}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="border-t border-border pt-2 text-xs text-muted-foreground">
          {day.progress.blocksCompleted}/{day.progress.blocksTotal} done · {formatDuration(day.progress.plannedMinutes)} planned
          {day.progress.trackedMinutes > 0 && ` · ${formatDuration(day.progress.trackedMinutes)} tracked`}
        </p>
      </CardContent>
    </Card>
  );
}

function DayHabits({ date }: { date: DateKey }) {
  const features = useFeatures();
  const habits = useHabits();
  const entries = useHabitEntries({ from: date, to: date });
  if (!features.isOn("habits") || !habits.data?.length) return null;
  const done = new Set((entries.data ?? []).filter((e) => e.date === date).map((e) => e.habitId));
  const active = habits.data.filter((h) => !h.archived);
  if (!active.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Habits</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {active.map((h) => (
            <li key={h.id} className="flex items-center gap-2">
              {done.has(h.id) ? <Check className="size-3.5 text-success" /> : <Circle className="size-3.5 text-muted-foreground" />}
              <span className={cn(!done.has(h.id) && "text-muted-foreground")}>{h.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DayCheckIns({ date, today }: { date: DateKey; today: DateKey }) {
  const features = useFeatures();
  const entries = useCheckIns(date).data ?? [];
  if (!features.isOn("mood")) return null;
  if (date === today) return <CheckInCard date={date} />;
  if (!entries.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Check-ins</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5 text-xs">
        {entries.map((c) => (
          <span key={c.id} className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
            {new Date(c.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} {c.mood && MOODS[c.mood - 1]}
            {c.energy && ` · ${ENERGY_LABELS[c.energy - 1]}`}
          </span>
        ))}
      </CardContent>
    </Card>
  );
}
