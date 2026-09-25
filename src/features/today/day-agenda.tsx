"use client";

import { CalendarPlus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useDraggableBlock } from "@/features/calendar/dnd";
import { BlockCard } from "@/features/tasks/block-card";
import type { Lookups } from "@/features/tasks/use-lookups";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import type { DateKey } from "@/lib/date";
import type { ScheduleBlock } from "@/types/domain";

/** Mobile-first list of the day's blocks with large touch targets. */
export function DayAgenda({
  date,
  blocks,
  lookups,
  runningBlockId,
}: {
  date: DateKey;
  blocks: ScheduleBlock[];
  lookups: Pick<Lookups, "taskById" | "areaById">;
  runningBlockId: string | null;
}) {
  if (blocks.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No tasks planned for this day."
        description="Pull something from Unscheduled or add a new task."
        action={
          <Button size="sm" onClick={() => ui.newTask({ date })}>
            Add a task
          </Button>
        }
      />
    );
  }
  return (
    <ul className="space-y-2">
      {blocks.map((b) => {
        const task = lookups.taskById.get(b.taskId);
        if (!task) return null;
        return (
          <AgendaItem key={b.id} block={b} label={task.title}>
            <BlockCard
              variant="row"
              block={b}
              task={task}
              area={task.areaId ? lookups.areaById.get(task.areaId) : null}
              running={b.id === runningBlockId}
            />
          </AgendaItem>
        );
      })}
    </ul>
  );
}

function AgendaItem({ block, label, children }: { block: ScheduleBlock; label: string; children: React.ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggableBlock(block);
  return (
    <li ref={setNodeRef} {...attributes} {...listeners} aria-label={`Move ${label}`} className={cn("touch-manipulation", isDragging && "opacity-40")}>
      {children}
    </li>
  );
}
