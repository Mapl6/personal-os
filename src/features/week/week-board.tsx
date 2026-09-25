"use client";

import { Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDraggableBlock, useDropTarget } from "@/features/calendar/dnd";
import { BlockCard } from "@/features/tasks/block-card";
import type { Lookups } from "@/features/tasks/use-lookups";
import type { DayProgress } from "@/lib/analytics/stats";
import { formatDateKey, formatHours, type DateKey } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import type { ScheduleBlock } from "@/types/domain";

/** Seven droppable day columns; drag blocks between days (time of day is kept). */
export function WeekBoard({
  days,
  blocks,
  series,
  lookups,
  today,
  runningBlockId,
  workingDays,
}: {
  days: DateKey[];
  blocks: ScheduleBlock[];
  series: DayProgress[];
  lookups: Pick<Lookups, "taskById" | "areaById">;
  today: DateKey;
  runningBlockId: string | null;
  workingDays: number[];
}) {
  const byDay = React.useMemo(() => {
    const m = new Map<DateKey, ScheduleBlock[]>(days.map((d) => [d, []]));
    for (const b of blocks) m.get(b.date)?.push(b);
    for (const list of m.values()) list.sort((a, b) => (a.startMinutes ?? -1) - (b.startMinutes ?? -1));
    return m;
  }, [blocks, days]);
  const stats = new Map(series.map((s) => [s.date, s]));

  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((d) => (
        <DayColumn
          key={d}
          date={d}
          blocks={byDay.get(d) ?? []}
          stats={stats.get(d)}
          lookups={lookups}
          isToday={d === today}
          isPast={d < today}
          isRestDay={!workingDays.includes(new Date(`${d}T00:00:00`).getDay())}
          runningBlockId={runningBlockId}
        />
      ))}
    </div>
  );
}

function DayColumn({
  date,
  blocks,
  stats,
  lookups,
  isToday,
  isPast,
  isRestDay,
  runningBlockId,
}: {
  date: DateKey;
  blocks: ScheduleBlock[];
  stats?: DayProgress;
  lookups: Pick<Lookups, "taskById" | "areaById">;
  isToday: boolean;
  isPast: boolean;
  isRestDay: boolean;
  runningBlockId: string | null;
}) {
  const { setNodeRef, isOver } = useDropTarget(`weekday:${date}`, { kind: "day", date });
  return (
    <section
      ref={setNodeRef}
      aria-label={formatDateKey(date, "EEEE, MMMM d")}
      className={cn(
        "flex min-h-40 flex-col rounded-xl border bg-surface p-2 transition-colors md:min-h-[420px]",
        isToday ? "border-primary/50" : "border-border",
        isOver && "border-primary bg-primary/5",
        isPast && !isToday && "opacity-80",
      )}
    >
      <header className="mb-2 px-1">
        <div className="flex items-center justify-between">
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", isToday ? "text-primary" : "text-muted-foreground")}>
            {formatDateKey(date, "EEEE")}
          </h3>
          <span className="text-xs text-muted-foreground tabular">{formatDateKey(date, "MMM d")}</span>
        </div>
        {stats && stats.plannedMinutes > 0 ? (
          <>
            <div className="mt-1 flex items-baseline justify-between text-xs tabular">
              <span className="text-foreground">
                {formatHours(stats.completedMinutes)} <span className="text-muted-foreground">/ {formatHours(stats.plannedMinutes)}</span>
              </span>
              <span className="text-muted-foreground">{stats.completionPercent}%</span>
            </div>
            <Progress value={stats.completionPercent} className="mt-1 h-1" label={`${formatDateKey(date, "EEEE")} progress`} />
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">{isRestDay ? "Rest day" : "Nothing planned"}</p>
        )}
      </header>
      <ul className="flex-1 space-y-1.5">
        {blocks.map((b) => {
          const task = lookups.taskById.get(b.taskId);
          if (!task) return null;
          return (
            <DraggableItem key={b.id} block={b} label={task.title}>
              <div className="h-[52px]">
                <BlockCard block={b} task={task} area={task.areaId ? lookups.areaById.get(task.areaId) : null} running={b.id === runningBlockId} height={52} />
              </div>
            </DraggableItem>
          );
        })}
      </ul>
      <Button size="xs" variant="ghost" className="mt-2 w-full" onClick={() => ui.newTask({ date })} aria-label={`Add task on ${formatDateKey(date, "EEEE")}`}>
        <Plus /> Add
      </Button>
    </section>
  );
}

function DraggableItem({ block, label, children }: { block: ScheduleBlock; label: string; children: React.ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggableBlock(block);
  return (
    <li ref={setNodeRef} {...attributes} {...listeners} aria-label={`Move ${label}`} className={cn("cursor-grab touch-manipulation active:cursor-grabbing", isDragging && "opacity-40")}>
      {children}
    </li>
  );
}
