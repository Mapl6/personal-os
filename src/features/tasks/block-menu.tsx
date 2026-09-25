"use client";

import {
  CalendarArrowUp,
  Check,
  CircleSlash,
  Clock,
  Inbox,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Scissors,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ui } from "@/store/ui-store";
import type { ScheduleBlock, Task } from "@/types/domain";
import { workActions } from "./actions";

export function BlockMenu({
  block,
  task,
  running,
  className,
}: {
  block: ScheduleBlock;
  task: Task;
  running: boolean;
  className?: string;
}) {
  const planned = block.status === "planned";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className={className}
          aria-label={`Actions for ${task.title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {planned ? (
          <>
            <DropdownMenuItem onSelect={() => workActions.completeBlock(block, task.title)}>
              <Check /> Complete
            </DropdownMenuItem>
            {running ? (
              <DropdownMenuItem onSelect={() => workActions.pauseTimer()}>
                <Pause /> Pause timer
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={() => workActions.startTimer(task.id, block.id)}>
                <Play /> Start timer
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => ui.reschedule(block.id)}>
              <CalendarArrowUp /> Reschedule…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => ui.split(block.id)}>
              <Scissors /> Split…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => workActions.skipBlock(block, task.title)}>
              <CircleSlash /> Skip
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onSelect={() => workActions.reopenBlock(block)}>
            <RotateCcw /> Mark as not done
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => ui.editBlock(block.id)}>
          <Clock /> Edit time / duration…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => ui.editTask(task.id)}>
          <Pencil /> Edit task…
        </DropdownMenuItem>
        {planned && (
          <DropdownMenuItem onSelect={() => workActions.unscheduleBlock(block, task.title)}>
            <Inbox /> Unschedule
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => workActions.deleteTask(task)}>
          <Trash2 /> Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
