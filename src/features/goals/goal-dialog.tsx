"use client";

import { DateField } from "@/components/shared/date-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { useAreas, useProjects } from "@/hooks/queries";
import { getServices } from "@/services";
import { GOAL_METRICS, GOAL_PERIODS, type Goal } from "@/types/domain";

const schema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z.string().max(2000),
    period: z.enum(GOAL_PERIODS),
    metric: z.enum(GOAL_METRICS),
    unit: z.string().max(20),
    target: z.number({ error: "Enter a number" }).positive("Target must be above 0").max(100000),
    tracking: z.enum(["auto", "manual"]),
    areaId: z.string(),
    projectId: z.string(),
    keyword: z.string().max(40),
    deadline: z.string(),
  })
  .refine((v) => v.tracking === "manual" || v.metric === "hours" || v.metric === "sessions" || v.metric === "tasks", {
    path: ["tracking"],
    message: "Pages and custom metrics are logged manually",
  })
  .refine((v) => v.tracking === "manual" || v.areaId || v.projectId || v.keyword.trim(), {
    path: ["areaId"],
    message: "Automatic tracking needs an area, project or keyword to match tasks",
  });
type Values = z.infer<typeof schema>;

const PERIOD_LABEL = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", long_term: "Long-term" } as const;

export function GoalDialog({ open, onOpenChange, goal }: { open: boolean; onOpenChange: (o: boolean) => void; goal?: Goal }) {
  const areas = useAreas();
  const projects = useProjects();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      title: goal?.title ?? "",
      description: goal?.description ?? "",
      period: goal?.period ?? "weekly",
      metric: goal?.metric ?? "hours",
      unit: goal?.unit ?? "",
      target: goal?.target ?? 8,
      tracking: goal?.tracking ?? "auto",
      areaId: goal?.areaId ?? "",
      projectId: goal?.projectId ?? "",
      keyword: goal?.keyword ?? "",
      deadline: goal?.deadline ?? "",
    },
  });
  const { register, handleSubmit, control, formState } = form;
  const metric = useWatch({ control, name: "metric" });
  const tracking = useWatch({ control, name: "tracking" });
  const save = useAction(
    (v: Values) => {
      const input = { ...v, areaId: v.areaId || null, projectId: v.projectId || null, deadline: v.deadline || null };
      return goal ? getServices().goals.update(goal.id, input) : getServices().goals.create(input);
    },
    { invalidate: ["goals"], success: goal ? "Goal saved" : "Goal created", onSuccess: () => onOpenChange(false) },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>Targets guide the week; they don’t grade it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
          <DialogBody className="space-y-3">
            <Field label="Title" htmlFor="gl-title" error={formState.errors.title?.message}>
              <Input id="gl-title" autoFocus {...register("title")} placeholder="e.g. Frontend" aria-invalid={!!formState.errors.title} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Period" htmlFor="gl-period">
                <NativeSelect id="gl-period" {...register("period")}>
                  {GOAL_PERIODS.map((p) => <option key={p} value={p}>{PERIOD_LABEL[p]}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Target" htmlFor="gl-target" error={formState.errors.target?.message}>
                <Input id="gl-target" type="number" step="any" {...register("target", { valueAsNumber: true })} />
              </Field>
              <Field label="Unit" htmlFor="gl-metric">
                <NativeSelect id="gl-metric" {...register("metric")}>
                  <option value="hours">Hours</option>
                  <option value="sessions">Sessions</option>
                  <option value="tasks">Tasks</option>
                  <option value="pages">Pages</option>
                  <option value="custom">Custom…</option>
                </NativeSelect>
              </Field>
            </div>
            {metric === "custom" && (
              <Field label="Custom unit label" htmlFor="gl-unit">
                <Input id="gl-unit" {...register("unit")} placeholder="km, commits, chapters…" />
              </Field>
            )}
            <Field label="Progress tracking" htmlFor="gl-tracking" error={formState.errors.tracking?.message}>
              <NativeSelect id="gl-tracking" {...register("tracking")}>
                <option value="auto">Automatic — from completed work</option>
                <option value="manual">Manual — I log progress</option>
              </NativeSelect>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Area" htmlFor="gl-area" error={formState.errors.areaId?.message}>
                <NativeSelect id="gl-area" {...register("areaId")}>
                  <option value="">Any</option>
                  {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Project" htmlFor="gl-project">
                <NativeSelect id="gl-project" {...register("projectId")}>
                  <option value="">Any</option>
                  {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </NativeSelect>
              </Field>
            </div>
            {tracking === "auto" && (
              <Field label="Keyword filter (optional)" htmlFor="gl-kw" hint="Only count tasks whose title or tags contain this, e.g. “gym”.">
                <Input id="gl-kw" {...register("keyword")} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Deadline" htmlFor="gl-deadline">
                <Controller control={control} name="deadline" render={({ field }) => <DateField id="gl-deadline" value={field.value} onChange={field.onChange} />} />
              </Field>
            </div>
            <Field label="Why it matters" htmlFor="gl-desc">
              <Textarea id="gl-desc" rows={2} {...register("description")} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save goal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
