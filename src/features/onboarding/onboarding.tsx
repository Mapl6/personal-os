"use client";

import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, X } from "lucide-react";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { Field, WeekdayPicker } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/hooks/use-action";
import { formatTime, parseTime } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { DEFAULT_AREAS, DEFAULT_WEEKLY_GOALS, setupWorkspace, type WeeklyGoalSetup } from "@/services/seed";

const STEPS = ["Welcome", "Working days", "Hours", "Areas", "Weekly goals", "Finish"] as const;

/** First-launch setup. Creates areas, weekly goals and a default week template. */
export function Onboarding() {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [days, setDays] = React.useState([1, 2, 3, 4, 5, 6]);
  const [start, setStart] = React.useState("09:00");
  const [end, setEnd] = React.useState("19:00");
  const [areas, setAreas] = React.useState(DEFAULT_AREAS.map((a) => a.name));
  const [customAreas, setCustomAreas] = React.useState<string[]>([]);
  const [newArea, setNewArea] = React.useState("");
  const [goals, setGoals] = React.useState<WeeklyGoalSetup[]>(DEFAULT_WEEKLY_GOALS);
  const [examples, setExamples] = React.useState(true);
  const [calendar, setCalendar] = React.useState<"gregorian" | "jalali">("gregorian");

  const finish = useAction(
    () =>
      setupWorkspace(getServices(), {
        name: name.trim(),
        workingDays: days,
        dayStartMinutes: parseTime(start) ?? 540,
        dayEndMinutes: parseTime(end) ?? 1140,
        areaNames: areas,
        weeklyGoals: goals.filter((g) => areas.includes(g.areaName)),
        includeExamples: examples,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        calendar,
      }),
    { invalidate: ["all"], success: "You're all set. Plans are hypotheses — adjust freely." },
  );

  const trimmedArea = newArea.trim();
  const areaExists = [...DEFAULT_AREAS.map((a) => a.name), ...customAreas].some(
    (n) => n.toLocaleLowerCase() === trimmedArea.toLocaleLowerCase(),
  );
  const addArea = () => {
    if (!trimmedArea || areaExists) return;
    setCustomAreas((prev) => [...prev, trimmedArea]);
    setAreas((prev) => [...prev, trimmedArea]);
    setNewArea("");
  };
  const removeArea = (name: string) => {
    setCustomAreas((prev) => prev.filter((x) => x !== name));
    setAreas((prev) => prev.filter((x) => x !== name));
  };

  const valid =
    step === 1 ? days.length > 0 : step === 2 ? (parseTime(start) ?? 0) < (parseTime(end) ?? 0) : step === 3 ? areas.length > 0 : true;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6">
        <ol className="mb-6 flex gap-1" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")} aria-current={i === step ? "step" : undefined}>
              <span className="sr-only">{s}</span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Your personal operating system</h1>
            <p className="text-sm text-muted-foreground">
              Plan → execute → track → review → adjust. Everything stays on this device. Changing the plan is part of the plan.
            </p>
            <Field label="What should we call you?" htmlFor="ob-name">
              <Input id="ob-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Calendar">
              <div className="flex gap-1" role="radiogroup" aria-label="Calendar">
                {([["gregorian", "Gregorian"], ["jalali", "Shamsi · شمسی"]] as const).map(([v, l]) => (
                  <Button
                    key={v}
                    type="button"
                    size="sm"
                    role="radio"
                    aria-checked={calendar === v}
                    variant={calendar === v ? "default" : "secondary"}
                    className="flex-1"
                    onClick={() => {
                      setCalendar(v);
                      // Iranian working week: Saturday–Thursday, Friday off.
                      setDays(v === "jalali" ? [6, 0, 1, 2, 3, 4] : [1, 2, 3, 4, 5, 6]);
                    }}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Which days do you work on your routine?</h2>
            <p className="text-sm text-muted-foreground">Used for consistency stats and for finding free slots. Rest days count as rest, not as misses.</p>
            <WeekdayPicker value={days} onChange={setDays} weekStartsOn={calendar === "jalali" ? 6 : 1} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Typical working hours</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" htmlFor="ob-start">
                <Input id="ob-start" type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="End" htmlFor="ob-end">
                <Input id="ob-end" type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
              </Field>
            </div>
            {!valid && <p className="text-xs text-danger">End must be after start.</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Main areas of your life</h2>
            <p className="text-sm text-muted-foreground">Permanent categories. You can add, rename or archive them later.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEFAULT_AREAS.map((a) => (
                <label key={a.name} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-accent/50">
                  <Checkbox
                    checked={areas.includes(a.name)}
                    onCheckedChange={(c) => setAreas((prev) => (c ? [...prev, a.name] : prev.filter((x) => x !== a.name)))}
                  />
                  <AreaDot color={a.color} />
                  {a.name}
                </label>
              ))}
              {customAreas.map((n) => (
                <div key={n} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                    <Checkbox
                      checked={areas.includes(n)}
                      onCheckedChange={(c) => setAreas((prev) => (c ? [...prev, n] : prev.filter((x) => x !== n)))}
                    />
                    <AreaDot color="slate" />
                    <span className="truncate">{n}</span>
                  </label>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${n}`}
                    onClick={() => removeArea(n)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addArea();
              }}
            >
              <Input
                value={newArea}
                maxLength={60}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Add your own area"
                aria-label="New area name"
              />
              <Button type="submit" variant="secondary" disabled={!trimmedArea || areaExists}>
                <Plus /> Add
              </Button>
            </form>
            {trimmedArea && areaExists && <p className="text-xs text-danger">That area is already in the list.</p>}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Weekly goals</h2>
            <p className="text-sm text-muted-foreground">Targets, not quotas. Set to 0 to skip. Progress is calculated automatically from what you complete.</p>
            <ul className="space-y-2">
              {goals
                .filter((g) => areas.includes(g.areaName))
                .map((g) => (
                  <li key={g.title ?? g.areaName} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <span className="flex-1 text-sm font-medium">{g.title ?? g.areaName}</span>
                    <Input
                      type="number"
                      min={0}
                      max={80}
                      className="h-8 w-20"
                      value={g.target}
                      aria-label={`${g.title ?? g.areaName} target`}
                      onChange={(e) =>
                        setGoals((prev) => prev.map((x) => (x === g ? { ...x, target: Math.max(0, Number(e.target.value) || 0) } : x)))
                      }
                    />
                    <span className="w-16 text-xs text-muted-foreground">{g.metric === "hours" ? "hours" : "sessions"}/wk</span>
                  </li>
                ))}
            </ul>
            <p className="text-xs text-muted-foreground">Personal time stays flexible — no target.</p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Ready</h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="size-4 text-success" /> {areas.length} areas</li>
              <li className="flex gap-2"><Check className="size-4 text-success" /> {goals.filter((g) => g.target > 0 && areas.includes(g.areaName)).length} weekly goals</li>
              <li className="flex gap-2"><Check className="size-4 text-success" /> “Normal Week” template ({formatTime(parseTime(start) ?? 540)}–{formatTime(parseTime(end) ?? 1140)})</li>
            </ul>
            <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <span>
                <span className="block text-sm font-medium">Include example data</span>
                <span className="text-xs text-muted-foreground">Projects, tasks, habits and 3 weeks of history so you can explore. Reset anytime in Settings.</span>
              </span>
              <Switch checked={examples} onCheckedChange={setExamples} aria-label="Include example data" />
            </label>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ArrowLeft /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!valid}>
              Continue <ArrowRight />
            </Button>
          ) : (
            <Button onClick={() => finish.mutate()} disabled={finish.isPending}>
              {finish.isPending ? "Setting up…" : "Start planning"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
