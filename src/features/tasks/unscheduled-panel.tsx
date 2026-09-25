"use client";

import { CalendarPlus, GripVertical, Inbox, Plus } from "lucide-react";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDraggableTask, useDropTarget } from "@/features/calendar/dnd";
import { useAllBlocks } from "@/hooks/queries";
import { useNowMinutes } from "@/hooks/use-now";
import { addDaysKey, formatDuration, relativeDayLabel, type DateKey } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import type { Area, Task } from "@/types/domain";
import { workActions } from "./actions";
import { PriorityBadge } from "./task-status";
import type { Lookups } from "./use-lookups";

const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

/** Open tasks with no planned block (the "backlog" to pull into the timeline). */
export function useUnscheduledTasks(lookups: Pick<Lookups, "tasks">) {
  const blocks = useAllBlocks();
  return React.useMemo(() => {
    const withPlanned = new Set((blocks.data ?? []).filter((b) => b.status === "planned").map((b) => b.taskId));
    return lookups.tasks
      .filter(
        (t) =>
          !t.recurrence &&
          !withPlanned.has(t.id) &&
          (t.status === "inbox" || t.status === "planned" || t.status === "in_progress"),
      )
      .sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
          a.createdAt.localeCompare(b.createdAt),
      );
  }, [blocks.data, lookups.tasks]);
}

export function UnscheduledPanel({
  lookups,
  date,
  today,
  className,
  limit,
}: {
  lookups: Lookups;
  date: DateKey;
  today: DateKey;
  className?: string;
  limit?: number;
}) {
  const tasks = useUnscheduledTasks(lookups);
  const { setNodeRef, isOver } = useDropTarget("unscheduled", { kind: "unscheduled" });
  const shown = limit ? tasks.slice(0, limit) : tasks;

  return (
    <section
      ref={setNodeRef}
      aria-label="Unscheduled tasks"
      className={cn("rounded-xl border border-border bg-surface p-3 transition-colors", isOver && "border-primary/60 bg-primary/5", className)}
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          Unscheduled <Badge>{tasks.length}</Badge>
        </h2>
        <Button size="xs" variant="ghost" onClick={() => ui.newTask()}>
          <Plus /> Add
        </Button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Drag onto the timeline, or drop a block here to unschedule it.</p>
      {tasks.length === 0 ? (
        <EmptyState compact icon={Inbox} title="Nothing waiting" description="Every open task has a place in your plan." />
      ) : (
        <ul className="space-y-1.5">
          {shown.map((task) => (
            <UnscheduledItem
              key={task.id}
              task={task}
              area={task.areaId ? lookups.areaById.get(task.areaId) : undefined}
              date={date}
              today={today}
            />
          ))}
          {limit && tasks.length > limit && (
            <li className="pt-1 text-center text-xs text-muted-foreground">+{tasks.length - limit} more in Tasks</li>
          )}
        </ul>
      )}
    </section>
  );
}

const UnscheduledItem = React.memo(function UnscheduledItem({
  task,
  area,
  date,
  today,
}: {
  task: Task;
  area?: Area;
  date: DateKey;
  today: DateKey;
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggableTask(task, task.estimatedMinutes);
  const nowMinutes = useNowMinutes() ?? 0;
  const notBefore = date === today ? nowMinutes : 0;
  return (
    <li
      ref={setNodeRef}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 text-sm transition-shadow hover:shadow-sm",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${task.title}`}
        className="cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <AreaDot color={area?.color} />
      <button type="button" onClick={() => ui.editTask(task.id)} className="min-w-0 flex-1 text-left">
        <span className="block truncate font-medium">{task.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground tabular">
          {formatDuration(task.estimatedMinutes)}
          {task.dueDate && <span>· due {relativeDayLabel(task.dueDate, today)}</span>}
          {(task.priority === "high" || task.priority === "critical") && <PriorityBadge priority={task.priority} />}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label={`Schedule ${task.title}`}>
            <CalendarPlus />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => workActions.scheduleNextSlot(task, date, notBefore)}>
            Next free slot {date === today ? "today" : relativeDayLabel(date, today).toLowerCase()}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => workActions.scheduleNextSlot(task, addDaysKey(date, 1))}>
            {relativeDayLabel(addDaysKey(date, 1), today)}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => workActions.scheduleTask(task.id, date, null)}>
            {relativeDayLabel(date, today)}, anytime
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => ui.editTask(task.id)}>Pick date & time…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
});
