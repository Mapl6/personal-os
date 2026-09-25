"use client";

import { CSS } from "@dnd-kit/utilities";
import * as React from "react";
import { BlockCard } from "@/features/tasks/block-card";
import { workActions } from "@/features/tasks/actions";
import type { Lookups } from "@/features/tasks/use-lookups";
import { formatDateKey, formatDuration, formatTime, snapMinutes, type DateKey } from "@/lib/date";
import { layoutDayBlocks } from "@/lib/scheduling/layout";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import type { ScheduleBlock } from "@/types/domain";
import { useDraggableBlock, useDropPreview, useDropTarget } from "./dnd";

export interface TimeGridProps {
  days: DateKey[];
  blocks: ScheduleBlock[];
  lookups: Pick<Lookups, "taskById" | "areaById">;
  gridStart: number;
  gridEnd: number;
  hourHeight: number;
  today: DateKey;
  nowMinutes: number;
  runningBlockId: string | null;
  showDayHeaders?: boolean;
  className?: string;
}

/** Visible hour range covering working hours and every block, padded by an hour. */
export function computeGridRange(
  blocks: readonly ScheduleBlock[],
  dayStart: number,
  dayEnd: number,
): { gridStart: number; gridEnd: number } {
  let start = dayStart;
  let end = dayEnd;
  for (const b of blocks) {
    if (b.startMinutes === null) continue;
    start = Math.min(start, b.startMinutes);
    end = Math.max(end, b.startMinutes + b.durationMinutes);
  }
  return {
    gridStart: Math.max(0, Math.floor(start / 60) * 60 - 60),
    gridEnd: Math.min(24 * 60, Math.ceil(end / 60) * 60 + 60),
  };
}

export function TimeGrid({
  days,
  blocks,
  lookups,
  gridStart,
  gridEnd,
  hourHeight,
  today,
  nowMinutes,
  runningBlockId,
  showDayHeaders = days.length > 1,
  className,
}: TimeGridProps) {
  const pxPerMinute = hourHeight / 60;
  const hours: number[] = [];
  for (let m = gridStart; m < gridEnd; m += 60) hours.push(m);
  const byDay = React.useMemo(() => {
    const map = new Map<DateKey, ScheduleBlock[]>();
    for (const d of days) map.set(d, []);
    for (const b of blocks) map.get(b.date)?.push(b);
    return map;
  }, [blocks, days]);
  const hasAnytime = blocks.some((b) => b.startMinutes === null);

  return (
    <div className={cn("relative", className)}>
      {showDayHeaders && (
        <div className="sticky top-0 z-20 flex border-b border-border bg-background/95 backdrop-blur">
          <div className="w-12 shrink-0" />
          {days.map((d) => (
            <div
              key={d}
              className={cn(
                "flex-1 px-1 py-2 text-center text-xs font-medium",
                d === today ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div>{formatDateKey(d, "EEE")}</div>
              <div className={cn("mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm tabular", d === today && "bg-primary text-primary-foreground")}>
                {formatDateKey(d, "d")}
              </div>
            </div>
          ))}
        </div>
      )}

      {(hasAnytime || days.length === 1) && (
        <div className="flex border-b border-border">
          <div className="flex w-12 shrink-0 items-center justify-end pr-2 text-[10px] uppercase tracking-wide text-muted-foreground">
            Any
          </div>
          {days.map((d) => (
            <AnytimeRow key={d} date={d} blocks={(byDay.get(d) ?? []).filter((b) => b.startMinutes === null)} lookups={lookups} runningBlockId={runningBlockId} />
          ))}
        </div>
      )}

      <div className="relative flex pt-3">
        <div className="w-12 shrink-0" aria-hidden>
          {hours.map((m) => (
            <div key={m} style={{ height: hourHeight }} className="relative">
              <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground tabular">{formatTime(m)}</span>
            </div>
          ))}
        </div>
        {days.map((d) => (
          <DayColumn
            key={d}
            date={d}
            blocks={byDay.get(d) ?? []}
            lookups={lookups}
            gridStart={gridStart}
            gridEnd={gridEnd}
            hourHeight={hourHeight}
            pxPerMinute={pxPerMinute}
            isToday={d === today}
            nowMinutes={nowMinutes}
            runningBlockId={runningBlockId}
          />
        ))}
      </div>
    </div>
  );
}

function AnytimeRow({
  date,
  blocks,
  lookups,
  runningBlockId,
}: {
  date: DateKey;
  blocks: ScheduleBlock[];
  lookups: TimeGridProps["lookups"];
  runningBlockId: string | null;
}) {
  const { setNodeRef, isOver } = useDropTarget(`anytime:${date}`, { kind: "day", date });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-9 flex-1 space-y-1 border-l border-border p-1 transition-colors",
        isOver && "bg-primary/10",
      )}
      aria-label={`Anytime on ${formatDateKey(date)}`}
    >
      {blocks.map((b) => {
        const task = lookups.taskById.get(b.taskId);
        if (!task) return null;
        return (
          <DraggableRow key={b.id} block={b} label={task.title}>
            <div className="h-8">
              <BlockCard
                block={b}
                task={task}
                area={task.areaId ? lookups.areaById.get(task.areaId) : null}
                running={b.id === runningBlockId}
                height={30}
              />
            </div>
          </DraggableRow>
        );
      })}
    </div>
  );
}

function DraggableRow({ block, label, children }: { block: ScheduleBlock; label: string; children: React.ReactNode }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggableBlock(block);
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} aria-label={`Move ${label}, anytime`} className={cn("touch-manipulation", isDragging && "opacity-40")}>
      {children}
    </div>
  );
}

function DayColumn({
  date,
  blocks,
  lookups,
  gridStart,
  gridEnd,
  hourHeight,
  pxPerMinute,
  isToday,
  nowMinutes,
  runningBlockId,
}: {
  date: DateKey;
  blocks: ScheduleBlock[];
  lookups: TimeGridProps["lookups"];
  gridStart: number;
  gridEnd: number;
  hourHeight: number;
  pxPerMinute: number;
  isToday: boolean;
  nowMinutes: number;
  runningBlockId: string | null;
}) {
  const { setNodeRef, isOver } = useDropTarget(`timeline:${date}`, {
    kind: "timeline",
    date,
    gridStart,
    gridEnd,
    pxPerMinute,
  });
  const preview = useDropPreview(date);
  const positioned = React.useMemo(() => layoutDayBlocks(blocks), [blocks]);
  const height = (gridEnd - gridStart) * pxPerMinute;

  const createAt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minutes = snapMinutes(gridStart + (e.clientY - rect.top) / pxPerMinute - 15, 30);
    ui.newTask({ date, startMinutes: Math.max(gridStart, minutes) });
  };

  return (
    <div
      ref={setNodeRef}
      onClick={createAt}
      className={cn("relative flex-1 cursor-cell border-l border-border", isOver && "bg-primary/[0.04]")}
      style={{
        height,
        backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${hourHeight / 2}px, color-mix(in oklch, var(--border) 45%, transparent) ${hourHeight / 2}px ${hourHeight / 2 + 1}px, transparent ${hourHeight / 2 + 1}px ${hourHeight}px)`,
      }}
      aria-label={`Timeline for ${formatDateKey(date)}. Click an empty slot to add a task.`}
    >
      {isToday && nowMinutes >= gridStart && nowMinutes <= gridEnd && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
          style={{ top: (nowMinutes - gridStart) * pxPerMinute }}
        >
          <span className="-ml-1 size-2 rounded-full bg-danger" />
          <span className="h-px flex-1 bg-danger/80" />
        </div>
      )}

      {preview && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 z-30 rounded-md border-2 border-dashed border-primary/70 bg-primary/10"
          style={{ top: (preview.minutes - gridStart) * pxPerMinute, height: Math.max(18, preview.duration * pxPerMinute) }}
        >
          <span className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground tabular">
            {formatTime(preview.minutes)}–{formatTime(preview.minutes + preview.duration)}
          </span>
        </div>
      )}

      {positioned.map(({ block, lane, lanes }) => (
        <TimelineBlock
          key={block.id}
          block={block}
          lookups={lookups}
          top={(block.startMinutes! - gridStart) * pxPerMinute}
          lane={lane}
          lanes={lanes}
          pxPerMinute={pxPerMinute}
          running={block.id === runningBlockId}
        />
      ))}
    </div>
  );
}

function TimelineBlock({
  block,
  lookups,
  top,
  lane,
  lanes,
  pxPerMinute,
  running,
}: {
  block: ScheduleBlock;
  lookups: TimeGridProps["lookups"];
  top: number;
  lane: number;
  lanes: number;
  pxPerMinute: number;
  running: boolean;
}) {
  const [previewDuration, setPreviewDuration] = React.useState<number | null>(null);
  const { setNodeRef, attributes, listeners, isDragging, transform } = useDraggableBlock(block, previewDuration !== null);
  const task = lookups.taskById.get(block.taskId);
  if (!task) return null;
  const duration = previewDuration ?? block.durationMinutes;
  const height = Math.max(18, duration * pxPerMinute - 2);

  const onResizeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startDuration = block.durationMinutes;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    let latest = startDuration;
    const move = (ev: PointerEvent) => {
      latest = Math.max(15, snapMinutes(startDuration + (ev.clientY - startY) / pxPerMinute, 15));
      setPreviewDuration(latest);
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
      setPreviewDuration(null);
      if (latest !== startDuration) workActions.resizeBlock(block, latest);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  };

  const onResizeKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.key === "ArrowDown" ? 15 : -15;
      workActions.resizeBlock(block, Math.max(15, block.durationMinutes + delta));
    }
  };

  const width = 100 / lanes;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${task.title}, ${formatTime(block.startMinutes!)}, ${formatDuration(block.durationMinutes)}. Press space to move.`}
      className={cn(
        "absolute z-10 cursor-grab touch-manipulation px-0.5 active:cursor-grabbing",
        isDragging && "z-30 opacity-40",
      )}
      style={{
        top: top + 1,
        height,
        left: `${lane * width}%`,
        width: `${width}%`,
        transform: isDragging ? undefined : CSS.Translate.toString(transform),
      }}
    >
      <BlockCard
        block={block}
        task={task}
        area={task.areaId ? lookups.areaById.get(task.areaId) : null}
        running={running}
        height={height}
        resizeHandle={
          block.status === "planned" ? (
            <div
              role="slider"
              tabIndex={0}
              aria-label={`Resize ${task.title}`}
              aria-valuenow={duration}
              aria-valuemin={15}
              aria-valuemax={720}
              aria-valuetext={formatDuration(duration)}
              onPointerDown={onResizeStart}
              onKeyDown={onResizeKey}
              className="absolute inset-x-0 bottom-0 flex h-2 cursor-ns-resize items-end justify-center opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <span className="mb-0.5 h-0.5 w-6 rounded-full bg-muted-foreground/60" />
            </div>
          ) : undefined
        }
      />
      {previewDuration !== null && (
        <span className="absolute -bottom-5 left-1 z-40 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground tabular">
          {formatDuration(previewDuration)}
        </span>
      )}
    </div>
  );
}
