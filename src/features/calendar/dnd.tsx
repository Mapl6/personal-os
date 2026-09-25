"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import * as React from "react";
import { clamp } from "@/lib/utils/collections";
import { formatTime, snapMinutes, type DateKey } from "@/lib/date";
import { createStore } from "@/store/create-store";
import type { ScheduleBlock, Task } from "@/types/domain";
import { workActions } from "@/features/tasks/actions";
import { useLookups } from "@/features/tasks/use-lookups";
import { BlockCard } from "@/features/tasks/block-card";
import { AreaDot } from "@/components/shared/area";
import { formatDuration } from "@/lib/date";

export type DragData =
  | { kind: "block"; block: ScheduleBlock }
  | { kind: "task"; task: Task; duration: number };

export type DropData =
  | { kind: "timeline"; date: DateKey; gridStart: number; gridEnd: number; pxPerMinute: number }
  | { kind: "day"; date: DateKey }
  | { kind: "unscheduled" };

interface Preview {
  date: DateKey;
  minutes: number;
  duration: number;
}

/** Drop-target preview (which slot the dragged item would land in). */
export const dropPreviewStore = createStore<{ preview: Preview | null }>({ preview: null });

const collision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length ? within : rectIntersection(args);
};

function durationOf(data: DragData) {
  return data.kind === "block" ? data.block.durationMinutes : data.duration;
}

function targetMinutes(event: DragMoveEvent | DragEndEvent, drop: Extract<DropData, { kind: "timeline" }>, duration: number) {
  const top = event.active.rect.current.translated?.top;
  const overTop = event.over?.rect.top;
  if (top === undefined || overTop === undefined) return null;
  const raw = drop.gridStart + (top - overTop) / drop.pxPerMinute;
  return clamp(snapMinutes(raw, 15), drop.gridStart, Math.max(drop.gridStart, drop.gridEnd - Math.min(duration, 60)));
}

/**
 * Drag & drop context for planner surfaces (timeline, week board, month).
 * - Pointer: 6px activation distance prevents accidental drags on click.
 * - Touch: 220ms press-and-hold so scrolling on phones stays natural.
 * - Keyboard: space/enter to pick up, arrows to move.
 */
export function PlannerDnd({ children }: { children: React.ReactNode }) {
  const { taskById, areaById } = useLookups();
  const [active, setActive] = React.useState<DragData | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current as DragData) ?? null);

  const onDragMove = (e: DragMoveEvent) => {
    const data = e.active.data.current as DragData | undefined;
    const drop = e.over?.data.current as DropData | undefined;
    if (!data || drop?.kind !== "timeline") {
      if (dropPreviewStore.get().preview) dropPreviewStore.set({ preview: null });
      return;
    }
    const duration = durationOf(data);
    const minutes = targetMinutes(e, drop, duration);
    const prev = dropPreviewStore.get().preview;
    if (minutes !== null && (prev?.minutes !== minutes || prev?.date !== drop.date)) {
      dropPreviewStore.set({ preview: { date: drop.date, minutes, duration } });
    }
  };

  const reset = () => {
    setActive(null);
    dropPreviewStore.set({ preview: null });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current as DragData | undefined;
    const drop = e.over?.data.current as DropData | undefined;
    reset();
    if (!data || !drop) return;

    if (drop.kind === "unscheduled") {
      if (data.kind === "block" && data.block.status === "planned") {
        const task = taskById.get(data.block.taskId);
        workActions.unscheduleBlock(data.block, task?.title ?? "Task");
      }
      return;
    }

    let date: DateKey;
    let start: number | null;
    if (drop.kind === "timeline") {
      date = drop.date;
      start = targetMinutes(e, drop, durationOf(data));
      if (start === null) return;
    } else {
      date = drop.date;
      // Dropping on a day keeps the time of day for blocks.
      start = data.kind === "block" ? data.block.startMinutes : null;
    }

    if (data.kind === "block") {
      const b = data.block;
      if (b.date === date && b.startMinutes === start) return;
      workActions.moveBlock(b, { date, startMinutes: start }, taskById.get(b.taskId)?.title);
    } else {
      workActions.scheduleTask(data.task.id, date, start, data.duration);
    }
  };

  const overlay = (() => {
    if (!active) return null;
    if (active.kind === "block") {
      const task = taskById.get(active.block.taskId);
      if (!task) return null;
      return (
        <div className="w-64 max-w-[80vw]">
          <BlockCard variant="row" block={active.block} task={task} area={task.areaId ? areaById.get(task.areaId) : null} dragging />
        </div>
      );
    }
    const area = active.task.areaId ? areaById.get(active.task.areaId) : null;
    return (
      <div className="flex w-60 items-center gap-2 rounded-lg border border-primary/40 bg-popover px-3 py-2 text-sm shadow-xl">
        <AreaDot color={area?.color} />
        <span className="truncate font-medium">{active.task.title}</span>
        <span className="ml-auto text-xs text-muted-foreground">{formatDuration(active.duration)}</span>
      </div>
    );
  })();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
      accessibility={{
        announcements: {
          onDragStart: () => "Picked up. Use arrow keys to move, space to drop, escape to cancel.",
          onDragOver: ({ over }) => {
            const d = over?.data.current as DropData | undefined;
            if (!d) return "Not over a drop target.";
            if (d.kind === "unscheduled") return "Over unscheduled tasks.";
            const p = dropPreviewStore.get().preview;
            return p && d.kind === "timeline" ? `Over ${d.date} at ${formatTime(p.minutes)}.` : `Over ${d.date}.`;
          },
          onDragEnd: ({ over }) => (over ? "Dropped." : "Dropped outside a target; nothing changed."),
          onDragCancel: () => "Drag cancelled; nothing changed.",
        },
      }}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 160, easing: "ease-out" }}>{overlay}</DragOverlay>
    </DndContext>
  );
}

export function useDraggableBlock(block: ScheduleBlock, disabled = false) {
  return useDraggable({ id: `block:${block.id}`, data: { kind: "block", block } satisfies DragData, disabled });
}

export function useDraggableTask(task: Task, duration: number) {
  return useDraggable({ id: `task:${task.id}`, data: { kind: "task", task, duration } satisfies DragData });
}

export function useDropTarget(id: string, data: DropData) {
  return useDroppable({ id, data });
}

export function useDropPreview(date: DateKey) {
  return dropPreviewStore.useStore((s) => (s.preview?.date === date ? s.preview : null));
}
