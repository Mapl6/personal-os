"use client";

import { ArrowRight, CalendarArrowUp } from "lucide-react";
import * as React from "react";
import { DurationInput } from "@/components/shared/duration-input";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { perform } from "@/hooks/perform";
import { useAllBlocks, useSettings } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import {
  addDaysKey,
  formatDateKey,
  formatDuration,
  formatTime,
  minutesOfDay,
  parseTime,
  relativeDayLabel,
  toDateKey,
  type WeekdayIndex,
} from "@/lib/date";
import type { PlanChange } from "@/lib/planning/changes";
import { computeRescheduleTargets, type RescheduleOption } from "@/lib/scheduling/slots";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { ui, uiStore } from "@/store/ui-store";
import { workActions } from "./actions";
import { useLookups } from "./use-lookups";

function useBlock(id: string | null) {
  const blocks = useAllBlocks();
  const { taskById } = useLookups();
  const block = id ? blocks.data?.find((b) => b.id === id) : undefined;
  return { block, task: block ? taskById.get(block.taskId) : undefined, blocks: blocks.data ?? [] };
}

// ------------------------------------------------------------------ reschedule

export function RescheduleDialog() {
  const id = uiStore.useStore((s) => s.rescheduleBlockId);
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && ui.closeReschedule()}>
      {id && <RescheduleContent key={id} id={id} />}
    </Dialog>
  );
}

function RescheduleContent({ id }: { id: string }) {
  const { block, task, blocks } = useBlock(id);
  const { settings } = useSettings();
  const now = useNow();
  const [choice, setChoice] = React.useState<RescheduleOption>("tomorrow");
  const today = now ? toDateKey(now) : "";
  const [customDate, setCustomDate] = React.useState(today ? addDaysKey(today, 1) : "");
  const [customTime, setCustomTime] = React.useState(block?.startMinutes != null ? formatTime(block.startMinutes) : "");

  const targets = React.useMemo(() => {
    if (!block || !now) return [];
    return computeRescheduleTargets(
      block,
      blocks,
      { date: toDateKey(now), minutes: minutesOfDay(now) },
      {
        dayStartMinutes: settings.dayStartMinutes,
        dayEndMinutes: settings.dayEndMinutes,
        breakMinutes: settings.defaultBreakMinutes,
        workingDays: settings.workingDays,
      },
      settings.weekStartsOn as WeekdayIndex,
    );
  }, [block, blocks, now, settings]);

  if (!block || !task) return null;

  const target =
    choice === "custom"
      ? { date: customDate, startMinutes: customTime ? parseTime(customTime) : null }
      : targets.find((t) => t.option === choice);

  const confirm = async () => {
    if (!target?.date) return;
    ui.closeReschedule();
    await workActions.moveBlock(block, { date: target.date, startMinutes: target.startMinutes }, task.title);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reschedule “{task.title}”</DialogTitle>
        <DialogDescription>
          Plans are hypotheses. Pick a new spot — {formatDuration(block.durationMinutes)} currently on{" "}
          {formatDateKey(block.date, "EEE, MMM d")}
          {block.startMinutes !== null && ` at ${formatTime(block.startMinutes)}`}.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div role="radiogroup" aria-label="Reschedule to" className="space-y-1.5">
          {targets.map((t) => (
            <OptionCard key={t.option} selected={choice === t.option} onSelect={() => setChoice(t.option)} label={t.label}>
              {relativeDayLabel(t.date, today)}, {formatDateKey(t.date, "MMM d")} · {t.startMinutes !== null ? formatTime(t.startMinutes) : "anytime"}
            </OptionCard>
          ))}
          <OptionCard selected={choice === "custom"} onSelect={() => setChoice("custom")} label="Custom date">
            Choose any day and time
          </OptionCard>
        </div>
        {choice === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="rs-date">
              <Input id="rs-date" type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
            </Field>
            <Field label="Time" htmlFor="rs-time" hint="Empty = anytime">
              <Input id="rs-time" type="time" step={900} value={customTime} onChange={(e) => setCustomTime(e.target.value)} />
            </Field>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={() => ui.closeReschedule()}>
          Cancel
        </Button>
        <Button onClick={confirm} disabled={!target?.date}>
          <CalendarArrowUp /> Move
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function OptionCard({
  selected,
  onSelect,
  label,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        selected ? "border-primary/60 bg-primary/10" : "border-border hover:bg-accent",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground tabular">{children}</span>
    </button>
  );
}

// ------------------------------------------------------------------ split

export function SplitDialog() {
  const id = uiStore.useStore((s) => s.splitBlockId);
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && ui.closeSplit()}>
      {id && <SplitContent key={id} id={id} />}
    </Dialog>
  );
}

function SplitContent({ id }: { id: string }) {
  const { block, task } = useBlock(id);
  const [first, setFirst] = React.useState(() => Math.max(15, Math.round((block?.durationMinutes ?? 60) / 2 / 15) * 15));
  const [date, setDate] = React.useState(block ? addDaysKey(block.date, 1) : "");
  const [time, setTime] = React.useState(block?.startMinutes != null ? formatTime(block.startMinutes) : "");
  if (!block || !task) return null;
  const rest = block.durationMinutes - first;
  const valid = first >= 5 && rest >= 5 && !!date;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Split “{task.title}”</DialogTitle>
        <DialogDescription>
          Keep part of the block here and plan the rest elsewhere. It stays one task — just two sessions.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <Field label={`Keep on ${formatDateKey(block.date, "EEE, MMM d")}`} htmlFor="split-first">
          <DurationInput id="split-first" value={first} onChange={setFirst} presets={[30, 45, 60, 90, 120].filter((p) => p < block.durationMinutes)} />
        </Field>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRight className="size-4" /> Remaining <strong className="text-foreground tabular">{rest > 0 ? formatDuration(rest) : "—"}</strong> goes to:
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="split-date">
            <Input id="split-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Time" htmlFor="split-time" hint="Empty = anytime">
            <Input id="split-time" type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-1">
          <Button size="xs" variant="secondary" onClick={() => setDate(block.date)}>
            Same day
          </Button>
          <Button size="xs" variant="secondary" onClick={() => setDate(addDaysKey(block.date, 1))}>
            Next day
          </Button>
        </div>
        {!valid && rest < 5 && <p className="text-xs text-danger">The first part must be shorter than {formatDuration(block.durationMinutes)}.</p>}
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={() => ui.closeSplit()}>
          Cancel
        </Button>
        <Button
          disabled={!valid}
          onClick={async () => {
            ui.closeSplit();
            await perform(
              () => getServices().schedule.splitBlock(block.id, first, { date, startMinutes: time ? parseTime(time) : null }),
              { success: `Split into ${formatDuration(first)} + ${formatDuration(rest)}`, undo: ([a, b]) => getServices().schedule.mergeBlocks([a.id, b.id]) },
            );
          }}
        >
          Split
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ------------------------------------------------------------------ block editor

export function BlockEditorDialog() {
  const id = uiStore.useStore((s) => s.blockEditorId);
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && ui.closeBlockEditor()}>
      {id && <BlockEditorContent key={id} id={id} />}
    </Dialog>
  );
}

function BlockEditorContent({ id }: { id: string }) {
  const { block, task, blocks } = useBlock(id);
  const [date, setDate] = React.useState(block?.date ?? "");
  const [time, setTime] = React.useState(block?.startMinutes != null ? formatTime(block.startMinutes) : "");
  const [duration, setDuration] = React.useState(block?.durationMinutes ?? 60);
  const [actual, setActual] = React.useState(block?.actualMinutes ?? block?.durationMinutes ?? 60);
  if (!block || !task) return null;
  const siblings = blocks.filter((b) => b.taskId === block.taskId && b.id !== block.id && b.status === "planned" && block.status === "planned");

  const save = async () => {
    ui.closeBlockEditor();
    await perform(
      () =>
        getServices().schedule.updateBlock(block.id, {
          date,
          startMinutes: time ? parseTime(time) : null,
          durationMinutes: duration,
          ...(block.status === "completed" ? { actualMinutes: actual } : {}),
        }),
      { success: "Block updated", invalidate: [["goals"]] },
    );
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{task.title}</DialogTitle>
        <DialogDescription>Adjust this session. Other sessions of the task are unaffected.</DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="be-date">
            <Input id="be-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Start" htmlFor="be-time" hint="Empty = anytime">
            <Input id="be-time" type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Planned duration" htmlFor="be-dur">
          <DurationInput id="be-dur" value={duration} onChange={setDuration} />
        </Field>
        {block.status === "completed" && (
          <Field label="Actual duration" htmlFor="be-actual" hint={`Variance ${actual - duration >= 0 ? "+" : ""}${formatDuration(actual - duration)}`}>
            <DurationInput id="be-actual" value={actual} onChange={setActual} />
          </Field>
        )}
        {siblings.length > 0 && (
          <div className="rounded-lg border border-border p-3 text-sm">
            <p className="mb-2 text-muted-foreground">
              This task has {siblings.length} other planned session{siblings.length > 1 ? "s" : ""}.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                ui.closeBlockEditor();
                await perform(() => getServices().schedule.mergeBlocks([block.id, ...siblings.map((s) => s.id)]), {
                  success: "Sessions merged into one block",
                });
              }}
            >
              Merge all sessions into one
            </Button>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={() => ui.closeBlockEditor()}>
          Cancel
        </Button>
        <Button onClick={save} disabled={!date}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ------------------------------------------------------------------ rollover (proposal → confirm → apply)

export function RolloverDialog() {
  const open = uiStore.useStore((s) => s.rolloverOpen);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && ui.closeRollover()}>
      {open && <RolloverContent />}
    </Dialog>
  );
}

function RolloverContent() {
  const now = useNow();
  const today = now ? toDateKey(now) : "";
  const hour = now ? now.getHours() : 0;
  // Late in the day, "unfinished" means today's leftovers → tomorrow.
  const [mode, setMode] = React.useState<"past" | "today">(hour >= 17 ? "today" : "past");
  const [changes, setChanges] = React.useState<PlanChange[] | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    if (!today) return;
    let alive = true;
    const from = mode === "today" ? today : addDaysKey(today, -1);
    const to = mode === "today" ? addDaysKey(today, 1) : today;
    getServices()
      .schedule.proposeRollover(from, to)
      .then((c) => {
        if (!alive) return;
        setChanges(c);
        setSelected(new Set(c.map((x) => (x.kind === "move_block" ? x.blockId : ""))));
      });
    return () => {
      alive = false;
    };
  }, [mode, today]);

  const moves = (changes ?? []).filter((c): c is Extract<PlanChange, { kind: "move_block" }> => c.kind === "move_block");

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Carry unfinished work forward</DialogTitle>
        <DialogDescription>Nothing moves until you confirm. Uncheck anything you’d rather handle differently.</DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <div className="flex gap-1">
          <Button size="xs" variant={mode === "past" ? "default" : "secondary"} onClick={() => setMode("past")}>
            Earlier days → today
          </Button>
          <Button size="xs" variant={mode === "today" ? "default" : "secondary"} onClick={() => setMode("today")}>
            Today → tomorrow
          </Button>
        </div>
        {changes === null ? (
          <p className="text-sm text-muted-foreground">Looking for unfinished blocks…</p>
        ) : moves.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing to carry over. You’re all caught up.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {moves.map((c) => (
              <li key={c.blockId} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Checkbox
                  checked={selected.has(c.blockId)}
                  onCheckedChange={(v) =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (v) n.add(c.blockId);
                      else n.delete(c.blockId);
                      return n;
                    })
                  }
                  aria-label={`Include ${c.title}`}
                />
                <span className="min-w-0 flex-1 truncate font-medium">{c.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular">
                  {formatDateKey(c.from.date, "EEE")} → {formatDateKey(c.to.date, "EEE")}{" "}
                  {c.to.startMinutes !== null ? formatTime(c.to.startMinutes) : "anytime"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={() => ui.closeRollover()}>
          Cancel
        </Button>
        <Button
          disabled={applying || selected.size === 0 || moves.length === 0}
          onClick={async () => {
            setApplying(true);
            const chosen = moves.filter((c) => selected.has(c.blockId));
            await perform(() => getServices().schedule.applyChanges(chosen), {
              success: (n) => `Moved ${n} block${n === 1 ? "" : "s"}`,
            });
            setApplying(false);
            ui.closeRollover();
          }}
        >
          {applying ? "Applying…" : `Apply ${selected.size} change${selected.size === 1 ? "" : "s"}`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
