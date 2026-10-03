"use client";

import { Pause, Play, Square, Timer } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { workActions } from "@/features/tasks/actions";
import { useLookups } from "@/features/tasks/use-lookups";
import { useTimeEntries, useTimerState } from "@/hooks/queries";
import { useNowSeconds, useToday } from "@/hooks/use-now";
import { entryMinutes } from "@/lib/analytics/work";
import { formatDuration } from "@/lib/date";
import { cn } from "@/lib/utils/cn";

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Live elapsed time of the running session (re-renders every second — kept tiny on purpose). */
function Elapsed({ start }: { start: string }) {
  const now = useNowSeconds();
  if (!now) return null;
  return <>{formatClock((now.getTime() - new Date(start).getTime()) / 1000)}</>;
}

/**
 * Current session + today's tracked total. Renders nothing when no timer is
 * running or paused — tracking is optional.
 */
export function TimerWidget({ variant = "sidebar" }: { variant?: "sidebar" | "floating" | "card" }) {
  const timer = useTimerState();
  const { taskById } = useLookups();
  const today = useToday();
  const entries = useTimeEntries(today ? { from: today, to: today } : null);
  const running = timer.data?.running;
  const paused = timer.data?.paused;
  const session = running ?? paused;
  if (!session) return variant === "card" ? <IdleCard /> : null;
  const task = taskById.get(session.taskId);
  const todayTotal = (entries.data ?? []).reduce((s, e) => s + entryMinutes(e), 0);
  const taskTotal = (entries.data ?? []).filter((e) => e.taskId === session.taskId).reduce((s, e) => s + entryMinutes(e), 0);

  return (
    <div
      role="region"
      aria-label="Timer"
      className={cn(
        "rounded-xl border bg-card",
        running ? "border-success/40" : "border-border",
        variant === "floating" && "flex items-center gap-2 px-3 py-2 shadow-xl shadow-black/30",
        variant === "sidebar" && "p-3",
        variant === "card" && "p-5",
      )}
    >
      <div className={cn("min-w-0", variant === "floating" && "flex-1")}>
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", running ? "animate-pulse bg-success" : "bg-warning")} aria-hidden />
          {running ? "Focus session" : "Paused"}
        </div>
        <div className="truncate text-sm font-medium">{task?.title ?? "Task"}</div>
        <div className={cn("metric font-bold", variant === "card" ? "mt-2 text-[2rem] leading-none" : "text-lg")}>
          {running ? <Elapsed start={running.start} /> : formatDuration(paused?.durationMinutes ?? 0)}
        </div>
        {variant !== "floating" && (
          <div className="mt-2 text-xs text-muted-foreground tabular">
            Task today {formatDuration(taskTotal)} · All today {formatDuration(todayTotal)}
          </div>
        )}
      </div>
      <div className={cn("flex gap-1", variant !== "floating" && "mt-2")}>
        {running ? (
          <Button size={variant === "floating" ? "icon-sm" : "sm"} variant="secondary" onClick={() => workActions.pauseTimer()} aria-label="Pause timer">
            <Pause /> {variant !== "floating" && "Pause"}
          </Button>
        ) : (
          <Button size={variant === "floating" ? "icon-sm" : "sm"} onClick={() => workActions.resumeTimer()} aria-label="Resume timer">
            <Play /> {variant !== "floating" && "Resume"}
          </Button>
        )}
        <Button size={variant === "floating" ? "icon-sm" : "sm"} variant="ghost" onClick={() => workActions.stopTimer()} aria-label="Stop timer">
          <Square /> {variant !== "floating" && "Stop"}
        </Button>
      </div>
    </div>
  );
}

function IdleCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
      <div className="mb-1.5 flex items-center gap-2 font-medium text-foreground">
        <Timer className="size-4 text-muted-foreground" /> No timer running
      </div>
      Press <Play className="inline size-3 align-[-1px]" aria-label="Start" /> on any block to track time. Tracking is optional — you can also log time manually.
    </div>
  );
}
