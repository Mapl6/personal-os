"use client";

import { Check, CircleSlash, Pause, Play, Repeat, Shuffle } from "lucide-react";
import * as React from "react";
import { areaColorVar } from "@/components/shared/area";
import { Button } from "@/components/ui/button";
import { formatDuration, formatTimeRange } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import type { Area, ScheduleBlock, Task } from "@/types/domain";
import { workActions } from "./actions";
import { BlockMenu } from "./block-menu";

export interface BlockCardProps {
  block: ScheduleBlock;
  task: Task;
  area?: Area | null;
  running?: boolean;
  variant?: "timeline" | "row" | "chip";
  /** Height in px when used in a timeline (drives compact layout). */
  height?: number;
  className?: string;
  dragging?: boolean;
  /** Rendered in the timeline for resize. */
  resizeHandle?: React.ReactNode;
}

function CompleteToggle({ block, task, size = "sm" }: { block: ScheduleBlock; task: Task; size?: "sm" | "lg" }) {
  const done = block.status === "completed";
  const skipped = block.status === "skipped";
  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (block.status === "planned") workActions.completeBlock(block, task.title);
        else workActions.reopenBlock(block);
      }}
      aria-label={done ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`}
      aria-pressed={done}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
        size === "lg" ? "size-7" : "size-4.5",
        done
          ? "border-success bg-success text-background"
          : skipped
            ? "border-dashed border-muted-foreground/50 text-muted-foreground"
            : "border-muted-foreground/40 hover:border-success hover:bg-success/15",
      )}
    >
      {done && <Check className={size === "lg" ? "size-4" : "size-3"} strokeWidth={3} />}
      {skipped && <CircleSlash className={size === "lg" ? "size-3.5" : "size-2.5"} />}
    </button>
  );
}

function TimerButton({ block, task, running, size = "xs" }: { block: ScheduleBlock; task: Task; running: boolean; size?: "xs" | "sm" }) {
  if (block.status !== "planned") return null;
  return (
    <Button
      variant={running ? "secondary" : "ghost"}
      size={size === "sm" ? "icon-sm" : "icon-xs"}
      aria-label={running ? `Pause timer for ${task.title}` : `Start timer for ${task.title}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        if (running) workActions.pauseTimer();
        else workActions.startTimer(task.id, block.id);
      }}
      className={cn(running && "text-primary")}
    >
      {running ? <Pause /> : <Play />}
    </Button>
  );
}

function Meta({ block, task }: { block: ScheduleBlock; task: Task }) {
  return (
    <>
      {task.recurrence && <Repeat aria-label="Recurring" className="size-3 shrink-0 text-muted-foreground" />}
      {block.rescheduleCount > 0 && (
        <span
          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
          title={`Moved ${block.rescheduleCount}× — plans change, that's fine`}
        >
          <Shuffle className="size-2.5" aria-hidden />
          {block.rescheduleCount}
        </span>
      )}
    </>
  );
}

export const BlockCard = React.memo(function BlockCard({
  block,
  task,
  area,
  running = false,
  variant = "timeline",
  height,
  className,
  dragging,
  resizeHandle,
}: BlockCardProps) {
  const color = areaColorVar(area?.color);
  const done = block.status === "completed";
  const skipped = block.status === "skipped";
  const time =
    block.startMinutes !== null ? formatTimeRange(block.startMinutes, block.durationMinutes) : "Anytime";

  if (variant === "chip") {
    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-tight",
          done ? "text-muted-foreground" : "text-foreground",
          skipped && "opacity-50",
          className,
        )}
        style={{ background: `color-mix(in oklch, ${color} 16%, transparent)` }}
        title={`${task.title} · ${time}`}
      >
        {done && <Check className="size-2.5 shrink-0 text-success" strokeWidth={3} />}
        <span className="truncate">{task.title}</span>
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors",
          running && "border-primary/50 ring-1 ring-primary/30",
          skipped && "border-dashed bg-transparent",
          dragging && "shadow-xl ring-1 ring-primary/40",
          className,
        )}
      >
        <span aria-hidden className="h-8 w-1 shrink-0 rounded-full" style={{ background: color, opacity: done || skipped ? 0.4 : 1 }} />
        <CompleteToggle block={block} task={task} size="lg" />
        <div className="min-w-0 flex-1">
          <div className={cn("flex items-center gap-1.5 truncate text-sm font-medium", (done || skipped) && "text-muted-foreground")}>
            <span className="truncate">{task.title}</span>
            <Meta block={block} task={task} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground tabular">
            <span>{time}</span>
            <span aria-hidden>·</span>
            <span>{formatDuration(block.durationMinutes)}</span>
            {done && block.actualMinutes !== null && block.actualMinutes !== block.durationMinutes && (
              <span className="text-muted-foreground/80">(actual {formatDuration(block.actualMinutes)})</span>
            )}
            {skipped && <span>· skipped</span>}
            {area && <span className="hidden truncate sm:inline">· {area.name}</span>}
          </div>
        </div>
        <TimerButton block={block} task={task} running={running} size="sm" />
        <BlockMenu block={block} task={task} running={running} />
      </div>
    );
  }

  // timeline
  const compact = (height ?? 60) < 44;
  return (
    <div
      className={cn(
        "group relative flex h-full overflow-hidden rounded-md border text-left transition-shadow",
        "border-border/70 bg-card hover:shadow-md",
        running && "ring-1 ring-primary/60",
        skipped && "border-dashed bg-transparent opacity-60",
        done && "opacity-70",
        dragging && "shadow-xl ring-1 ring-primary/50",
        className,
      )}
      style={{ background: skipped ? undefined : `color-mix(in oklch, ${color} 13%, var(--card))` }}
    >
      <span aria-hidden className="w-[3px] shrink-0" style={{ background: color }} />
      <div className={cn("flex min-w-0 flex-1 gap-1.5 px-1.5", compact ? "items-center py-0.5" : "items-start py-1.5")}>
        <CompleteToggle block={block} task={task} />
        <div className="min-w-0 flex-1">
          <div className={cn("flex items-center gap-1 truncate text-[13px] font-medium leading-tight", done && "text-muted-foreground")}>
            <span className="truncate">{task.title}</span>
            <Meta block={block} task={task} />
          </div>
          {!compact && (
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground tabular">
              {time} · {formatDuration(block.durationMinutes)}
              {area ? ` · ${area.name}` : ""}
            </div>
          )}
        </div>
        <div
          className={cn(
            // Overlay so hidden actions don't steal width from the title in narrow columns.
            "absolute right-0.5 top-0.5 flex items-center rounded-md bg-card/95 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100",
            running && "opacity-100",
          )}
        >
          <TimerButton block={block} task={task} running={running} />
          <BlockMenu block={block} task={task} running={running} />
        </div>
      </div>
      {resizeHandle}
    </div>
  );
});
