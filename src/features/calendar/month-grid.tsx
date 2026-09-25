"use client";

import * as React from "react";
import { BlockCard } from "@/features/tasks/block-card";
import type { Lookups } from "@/features/tasks/use-lookups";
import { daysInRange, formatDateKey, formatHours, WEEKDAY_SHORT, type DateKey, type DateRange } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import type { ScheduleBlock } from "@/types/domain";
import { useDraggableBlock, useDropTarget } from "./dnd";

const MAX_CHIPS = 3;

export function MonthGrid({
  grid,
  month,
  blocks,
  lookups,
  today,
  weekStartsOn,
  onOpenDay,
}: {
  grid: DateRange;
  month: string; // yyyy-MM
  blocks: ScheduleBlock[];
  lookups: Pick<Lookups, "taskById" | "areaById">;
  today: DateKey;
  weekStartsOn: number;
  onOpenDay: (date: DateKey) => void;
}) {
  const days = daysInRange(grid);
  const byDay = React.useMemo(() => {
    const m = new Map<DateKey, ScheduleBlock[]>();
    for (const b of blocks) {
      const list = m.get(b.date) ?? [];
      list.push(b);
      m.set(b.date, list);
    }
    for (const list of m.values()) list.sort((a, b) => (a.startMinutes ?? -1) - (b.startMinutes ?? -1));
    return m;
  }, [blocks]);
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAY_SHORT[(i + weekStartsOn) % 7]);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-surface">
        {headers.map((h) => (
          <div key={h} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => (
          <MonthCell
            key={d}
            date={d}
            inMonth={d.startsWith(month)}
            isToday={d === today}
            blocks={byDay.get(d) ?? []}
            lookups={lookups}
            onOpenDay={onOpenDay}
          />
        ))}
      </div>
    </div>
  );
}

function MonthCell({
  date,
  inMonth,
  isToday,
  blocks,
  lookups,
  onOpenDay,
}: {
  date: DateKey;
  inMonth: boolean;
  isToday: boolean;
  blocks: ScheduleBlock[];
  lookups: Pick<Lookups, "taskById" | "areaById">;
  onOpenDay: (date: DateKey) => void;
}) {
  const { setNodeRef, isOver } = useDropTarget(`month:${date}`, { kind: "day", date });
  const planned = blocks.filter((b) => b.status !== "skipped").reduce((s, b) => s + b.durationMinutes, 0);
  const done = blocks.filter((b) => b.status === "completed").reduce((s, b) => s + b.durationMinutes, 0);
  const extra = blocks.length - MAX_CHIPS;
  return (
    <div
      ref={setNodeRef}
      onDoubleClick={(e) => {
        if (e.target === e.currentTarget) ui.newTask({ date });
      }}
      className={cn(
        "min-h-24 border-b border-r border-border p-1.5 transition-colors sm:min-h-28 [&:nth-child(7n)]:border-r-0",
        !inMonth && "bg-surface/60 text-muted-foreground",
        isOver && "bg-primary/10",
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onOpenDay(date)}
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs tabular hover:bg-accent",
            isToday && "bg-primary text-primary-foreground hover:bg-primary",
          )}
          aria-label={`Open ${formatDateKey(date, "EEEE, MMMM d")}`}
        >
          {formatDateKey(date, "d")}
        </button>
        {planned > 0 && (
          <span className="hidden text-[10px] text-muted-foreground tabular sm:inline" title="Completed / planned">
            {formatHours(done)}/{formatHours(planned)}
          </span>
        )}
      </div>
      <ul className="space-y-0.5">
        {blocks.slice(0, MAX_CHIPS).map((b) => {
          const task = lookups.taskById.get(b.taskId);
          if (!task) return null;
          return <Chip key={b.id} block={b} label={task.title}>{<BlockCard variant="chip" block={b} task={task} area={task.areaId ? lookups.areaById.get(task.areaId) : null} />}</Chip>;
        })}
      </ul>
      {extra > 0 && (
        <button type="button" onClick={() => onOpenDay(date)} className="mt-0.5 px-1 text-[11px] text-muted-foreground hover:text-foreground">
          +{extra} more
        </button>
      )}
    </div>
  );
}

function Chip({ block, label, children }: { block: ScheduleBlock; label: string; children: React.ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggableBlock(block);
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${label}. Press enter to edit, space to move.`}
      onClick={() => ui.editBlock(block.id)}
      className={cn("cursor-grab touch-manipulation", isDragging && "opacity-40")}
    >
      {children}
    </li>
  );
}
