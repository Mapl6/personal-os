"use client";

import { Check, Flame, MoreHorizontal, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import * as React from "react";
import { areaColorVar } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { Field, WeekdayPicker } from "@/components/shared/field";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAction } from "@/hooks/use-action";
import { useHabitEntries, useHabits, useSettings } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { currentStreak, longestStreak } from "@/lib/habits/streak";
import { addDaysKey, formatDateKey, lastNDays, weekdayOf, type DateKey } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { AREA_COLORS, type AreaColor, type Habit } from "@/types/domain";

const DAYS_SHOWN = 14;

export function HabitsView() {
  const today = useToday();
  const habits = useHabits();
  const range = today ? lastNDays(120, today) : null;
  const entries = useHabitEntries(range);
  const [dialog, setDialog] = React.useState<{ habit?: Habit } | null>(null);

  const doneByHabit = React.useMemo(() => {
    const m = new Map<string, Set<DateKey>>();
    for (const e of entries.data ?? []) {
      if (!m.has(e.habitId)) m.set(e.habitId, new Set());
      m.get(e.habitId)!.add(e.date);
    }
    return m;
  }, [entries.data]);

  if (!today || habits.isLoading || entries.isLoading) return <Skeleton className="h-96" />;
  const list = (habits.data ?? []).filter((h) => !h.archived);
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDaysKey(today, i - DAYS_SHOWN + 1));

  return (
    <>
      <PageHeader
        title="Habits"
        description="Small, repeatable things. A missed day is just a day — streaks restart, progress doesn’t."
        actions={<Button size="sm" onClick={() => setDialog({})}><Plus /> New habit</Button>}
      />
      {list.length === 0 ? (
        <EmptyState icon={Repeat} title="No habits yet." description="E.g. Sleep before 23:30, Gym, Reading, Daily planning." action={<Button size="sm" onClick={() => setDialog({})}><Plus /> Add habit</Button>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Habit completion for the last {DAYS_SHOWN} days</caption>
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2 text-left font-medium">Habit</th>
                {days.map((d) => (
                  <th key={d} scope="col" className={cn("w-9 py-2 text-center font-medium", d === today && "text-primary")}>
                    <div>{formatDateKey(d, "EEEEE")}</div>
                    <div className="tabular">{formatDateKey(d, "d")}</div>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">Streak</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">30d</th>
                <th className="w-10"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((h) => (
                <HabitRow key={h.id} habit={h} days={days} today={today} done={doneByHabit.get(h.id) ?? new Set()} onEdit={() => setDialog({ habit: h })} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <HabitDialog open={!!dialog} habit={dialog?.habit} onOpenChange={(o) => !o && setDialog(null)} />
    </>
  );
}

function HabitRow({ habit, days, today, done, onEdit }: { habit: Habit; days: DateKey[]; today: DateKey; done: Set<DateKey>; onEdit: () => void }) {
  const [confirm, setConfirm] = React.useState(false);
  const toggle = useAction((date: DateKey) => getServices().habits.toggle(habit.id, date), { invalidate: ["habits"] });
  const remove = useAction(() => getServices().habits.remove(habit.id), { invalidate: ["habits"], success: "Habit deleted" });
  const streak = currentStreak(habit, done, today);
  const best = longestStreak(habit, done);
  const last30 = lastNDays(30, today);
  let expected = 0;
  let hit = 0;
  for (let d = last30.from; d <= last30.to; d = addDaysKey(d, 1)) {
    if (habit.weekdays.includes(weekdayOf(d))) {
      expected++;
      if (done.has(d)) hit++;
    }
  }
  const rate = expected ? Math.round((hit / expected) * 100) : 0;
  const color = areaColorVar(habit.color);
  const schedule = habit.weekdays.length === 7 ? "Daily" : habit.weekdays.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ");

  return (
    <tr>
      <th scope="row" className="px-4 py-2.5 text-left font-normal">
        <div className="font-medium">{habit.name}</div>
        <div className="text-xs text-muted-foreground">{schedule}</div>
      </th>
      {days.map((d) => {
        const expectedDay = habit.weekdays.includes(weekdayOf(d));
        const isDone = done.has(d);
        return (
          <td key={d} className="text-center">
            <button
              type="button"
              onClick={() => toggle.mutate(d)}
              aria-pressed={isDone}
              aria-label={`${habit.name} on ${formatDateKey(d, "EEEE, MMM d")}: ${isDone ? "done" : "not done"}`}
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-md border transition-colors",
                isDone ? "border-transparent" : expectedDay ? "border-border hover:bg-accent" : "border-dashed border-border/50 hover:bg-accent/50",
                d === today && !isDone && "border-primary/50",
              )}
              style={isDone ? { background: color } : undefined}
            >
              {isDone && <Check className="size-3.5 text-background" strokeWidth={3} />}
            </button>
          </td>
        );
      })}
      <td className="px-3 text-right tabular">
        <span className="inline-flex items-center gap-1" title={`Longest: ${best}`}>
          <Flame className={cn("size-3.5", streak > 0 ? "text-warning" : "text-muted-foreground")} />
          {streak}
        </span>
      </td>
      <td className="px-3 text-right text-muted-foreground tabular">{rate}%</td>
      <td className="pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-xs" variant="ghost" aria-label={`Actions for ${habit.name}`}><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={() => setConfirm(true)}><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`Delete “${habit.name}”?`} description="Its history is deleted too." confirmLabel="Delete" destructive onConfirm={() => remove.mutate()} />
      </td>
    </tr>
  );
}

function HabitDialog({ open, onOpenChange, habit }: { open: boolean; onOpenChange: (o: boolean) => void; habit?: Habit }) {
  const { settings } = useSettings();
  const [name, setName] = React.useState("");
  const [days, setDays] = React.useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = React.useState<AreaColor>("emerald");
  React.useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reset form when dialog opens */
    setName(habit?.name ?? "");
    setDays(habit?.weekdays ?? [0, 1, 2, 3, 4, 5, 6]);
    setColor(habit?.color ?? "emerald");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, habit]);
  const save = useAction(
    () => (habit ? getServices().habits.update(habit.id, { name, weekdays: days, color }) : getServices().habits.create({ name, weekdays: days, color })),
    { invalidate: ["habits"], success: habit ? "Habit saved" : "Habit added", onSuccess: () => onOpenChange(false) },
  );
  const valid = name.trim().length > 0 && days.length > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }}>
          <DialogBody className="space-y-3">
            <Field label="Name" htmlFor="hb-name">
              <Input id="hb-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Yoga" />
            </Field>
            <Field label="On these days" error={days.length ? undefined : "Pick at least one day"}>
              <WeekdayPicker value={days} onChange={setDays} weekStartsOn={settings.weekStartsOn} />
            </Field>
            <Field label="Colour">
              <div className="flex gap-2" role="radiogroup" aria-label="Colour">
                {AREA_COLORS.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-popover", color === c && "ring-2 ring-foreground")} style={{ background: areaColorVar(c) }} />
                ))}
              </div>
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!valid || save.isPending}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
