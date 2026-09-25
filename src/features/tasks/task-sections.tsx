"use client";

import { CalendarArrowUp, Inbox, Pencil, Play, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { DurationInput } from "@/components/shared/duration-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { perform } from "@/hooks/perform";
import { useAllBlocks, useAllTimeEntries } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { entryMinutes } from "@/lib/analytics/work";
import {
  formatDateKey,
  formatDuration,
  formatTimeRange,
  formatVariance,
  parseTime,
} from "@/lib/date";
import { getServices } from "@/services";
import { ui } from "@/store/ui-store";
import type { Task, TimeEntry } from "@/types/domain";
import { workActions } from "./actions";

export function TaskScheduleSection({ task }: { task: Task }) {
  const all = useAllBlocks();
  const today = useToday() ?? "";
  const blocks = React.useMemo(
    () =>
      (all.data ?? [])
        .filter((b) => b.taskId === task.id)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.startMinutes ?? 0) - (b.startMinutes ?? 0)),
    [all.data, task.id],
  );
  const upcoming = task.recurrence ? blocks.filter((b) => b.date >= today).slice(0, 8) : blocks;
  const [date, setDate] = React.useState(today);
  const [time, setTime] = React.useState("");
  const [duration, setDuration] = React.useState(task.estimatedMinutes);

  return (
    <section className="rounded-lg border border-border p-3" aria-labelledby="sched-h">
      <h3 id="sched-h" className="mb-2 text-[13px] font-medium text-muted-foreground">
        Scheduled blocks {task.recurrence && <span className="font-normal">(next occurrences)</span>}
      </h3>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not scheduled yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {upcoming.map((b) => (
            <li key={b.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="w-28 shrink-0 tabular">{formatDateKey(b.date, "EEE, MMM d")}</span>
              <span className="flex-1 text-muted-foreground tabular">
                {b.startMinutes !== null ? formatTimeRange(b.startMinutes, b.durationMinutes) : "Anytime"} ·{" "}
                {formatDuration(b.durationMinutes)}
              </span>
              {b.status !== "planned" && (
                <Badge variant={b.status === "completed" ? "success" : "default"}>{b.status}</Badge>
              )}
              {b.status === "planned" && (
                <>
                  <Button size="icon-xs" variant="ghost" aria-label="Reschedule" onClick={() => ui.reschedule(b.id)}>
                    <CalendarArrowUp />
                  </Button>
                  <Button size="icon-xs" variant="ghost" aria-label="Edit block" onClick={() => ui.editBlock(b.id)}>
                    <Pencil />
                  </Button>
                  <Button size="icon-xs" variant="ghost" aria-label="Unschedule" onClick={() => workActions.unscheduleBlock(b, task.title)}>
                    <Inbox />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {!task.recurrence && task.status !== "completed" && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-36" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Start</span>
            <Input type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} className="h-8 w-28" />
          </label>
          <div className="w-44">
            <span className="text-xs text-muted-foreground">Duration</span>
            <DurationInput value={duration} onChange={setDuration} presets={[30, 60, 120]} />
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={!date}
            onClick={() =>
              perform(() => getServices().schedule.scheduleTask(task.id, { date, startMinutes: time ? parseTime(time) : null, durationMinutes: duration }), {
                success: "Block added",
              })
            }
          >
            <Plus /> Add block
          </Button>
        </div>
      )}
    </section>
  );
}

export function TaskTimeSection({ task }: { task: Task }) {
  const entriesQ = useAllTimeEntries();
  const blocksQ = useAllBlocks();
  const today = useToday() ?? "";
  const entries = React.useMemo(
    () => (entriesQ.data ?? []).filter((e) => e.taskId === task.id).sort((a, b) => b.start.localeCompare(a.start)),
    [entriesQ.data, task.id],
  );
  const completed = (blocksQ.data ?? []).filter((b) => b.taskId === task.id && b.status === "completed");
  const tracked = entries.reduce((s, e) => s + entryMinutes(e), 0);
  const planned = completed.reduce((s, b) => s + b.durationMinutes, 0);
  const actual = completed.reduce((s, b) => s + (b.actualMinutes ?? b.durationMinutes), 0);
  const [manual, setManual] = React.useState(30);
  const [manualDate, setManualDate] = React.useState(today);

  return (
    <section className="rounded-lg border border-border p-3" aria-labelledby="time-h">
      <div className="mb-2 flex items-center justify-between">
        <h3 id="time-h" className="text-[13px] font-medium text-muted-foreground">
          Time tracking
        </h3>
        {task.status !== "completed" && (
          <Button size="xs" variant="secondary" onClick={() => workActions.startTimer(task.id)}>
            <Play /> Start timer
          </Button>
        )}
      </div>
      <dl className="mb-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Tracked</dt>
          <dd className="font-medium tabular">{formatDuration(tracked)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Estimate</dt>
          <dd className="font-medium tabular">{formatDuration(task.estimatedMinutes)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Done: planned vs actual</dt>
          <dd className="font-medium tabular">
            {completed.length ? `${formatDuration(planned)} → ${formatDuration(actual)} (${formatVariance(actual - planned)})` : "—"}
          </dd>
        </div>
      </dl>
      {entries.length > 0 && (
        <ul className="mb-3 max-h-40 divide-y divide-border overflow-y-auto scrollbar-thin">
          {entries.map((e) => (
            <EntryRow key={e.id} entry={e} />
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Date</span>
          <Input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="h-8 w-36" />
        </label>
        <div className="w-44">
          <span className="text-xs text-muted-foreground">Duration</span>
          <DurationInput value={manual} onChange={setManual} presets={[15, 30, 60]} />
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={!manualDate}
          onClick={() =>
            perform(() => getServices().time.addManual({ taskId: task.id, date: manualDate, minutes: manual }), {
              success: `Logged ${formatDuration(manual)}`,
              invalidate: [["goals"]],
            })
          }
        >
          <Plus /> Log time
        </Button>
      </div>
    </section>
  );
}

function EntryRow({ entry }: { entry: TimeEntry }) {
  const [minutes, setMinutes] = React.useState(Math.round(entry.durationMinutes));
  const running = entry.end === null;
  return (
    <li className="flex items-center gap-2 py-1.5 text-sm">
      <span className="w-24 shrink-0 tabular">{formatDateKey(entry.date, "MMM d")}</span>
      <span className="flex-1 text-muted-foreground tabular">
        {running ? "running…" : formatDuration(entry.durationMinutes)} · {entry.source}
      </span>
      {!running && (
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon-xs" variant="ghost" aria-label="Edit duration">
              <Pencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 space-y-2">
            <DurationInput value={minutes} onChange={setMinutes} presets={[15, 30, 60, 90]} />
            <Button
              size="sm"
              className="w-full"
              onClick={() => perform(() => getServices().time.updateEntry(entry.id, { minutes }), { success: "Entry updated" })}
            >
              Save
            </Button>
          </PopoverContent>
        </Popover>
      )}
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label="Delete entry"
        onClick={() =>
          perform(() => getServices().time.removeEntry(entry.id), {
            success: "Entry deleted",
            undo: () => getServices().store.timeEntries.put(entry),
          })
        }
      >
        <Trash2 />
      </Button>
    </li>
  );
}
