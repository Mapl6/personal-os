"use client";

import { DateField } from "@/components/shared/date-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import * as React from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { DurationInput } from "@/components/shared/duration-input";
import { Field, WeekdayPicker } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { useGoals, usePriorityLabel, useSettings } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { addDaysKey, parseTime, weekdayOf, timeValue } from "@/lib/date";
import { createId } from "@/lib/utils/id";
import { getServices } from "@/services";
import type { TaskInput } from "@/services/task-service";
import { ui, uiStore, type TaskEditorState } from "@/store/ui-store";
import { PRIORITIES, TASK_STATUSES, type Recurrence, type Task } from "@/types/domain";
import { workActions } from "./actions";
import { useLookups } from "./use-lookups";
import { TaskScheduleSection, TaskTimeSection } from "./task-sections";

const STATUS_LABELS: Record<Task["status"], string> = {
  inbox: "Inbox",
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  skipped: "Skipped",
  cancelled: "Cancelled",
};

const formSchema = z
  .object({
    title: z.string().trim().min(1, "Give the task a title").max(200),
    description: z.string().max(5000),
    notes: z.string().max(10000),
    areaId: z.string(),
    projectId: z.string(),
    goalId: z.string(),
    priority: z.enum(PRIORITIES),
    status: z.enum(TASK_STATUSES),
    estimatedMinutes: z.number().int().min(5, "At least 5 minutes").max(1440),
    dueDate: z.string(),
    scheduleDate: z.string(),
    scheduleTime: z.string(),
    repeat: z.enum(["none", "daily", "weekly", "monthly"]),
    repeatInterval: z.number().int().min(1).max(12),
    repeatWeekdays: z.array(z.number()),
    tags: z.string(),
    subtasks: z.array(z.object({ id: z.string(), title: z.string(), done: z.boolean() })),
    dependencies: z.array(z.string()),
  })
  .refine((v) => !v.scheduleTime || parseTime(v.scheduleTime) !== null, {
    path: ["scheduleTime"],
    message: "Use HH:mm",
  })
  .refine((v) => v.repeat !== "weekly" || v.repeatWeekdays.length > 0, {
    path: ["repeatWeekdays"],
    message: "Pick at least one day",
  });

type FormValues = z.infer<typeof formSchema>;

export function TaskEditorDialog() {
  const state = uiStore.useStore((s) => s.taskEditor);
  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && ui.closeTaskEditor()}>
      {state && <TaskEditor key={state.taskId ?? "new"} state={state} />}
    </Dialog>
  );
}

function TaskEditor({ state }: { state: TaskEditorState }) {
  const lookups = useLookups();
  const { settings } = useSettings();
  const goals = useGoals();
  const priorityLabel = usePriorityLabel();
  const today = useToday() ?? "";
  const task = state.taskId ? lookups.taskById.get(state.taskId) : undefined;
  const isEdit = !!state.taskId;

  const defaults = React.useMemo<FormValues>(() => {
    const p = state.prefill ?? {};
    const r = task?.recurrence ?? p.recurrence ?? null;
    return {
      title: task?.title ?? p.title ?? "",
      description: task?.description ?? p.description ?? "",
      notes: task?.notes ?? "",
      areaId: task?.areaId ?? p.areaId ?? (isEdit ? "" : (settings.customization.defaultAreaId ?? "")),
      projectId: task?.projectId ?? p.projectId ?? "",
      goalId: task?.goalId ?? p.goalId ?? "",
      priority: task?.priority ?? p.priority ?? settings.customization.defaultPriority,
      status: task?.status ?? "inbox",
      estimatedMinutes: task?.estimatedMinutes ?? p.estimatedMinutes ?? settings.defaultDurationMinutes,
      dueDate: task?.dueDate ?? p.dueDate ?? "",
      scheduleDate: isEdit ? "" : (p.date ?? ""),
      scheduleTime: isEdit ? "" : p.startMinutes != null ? timeValue(p.startMinutes) : "",
      repeat: r ? r.frequency : "none",
      repeatInterval: r?.interval ?? 1,
      repeatWeekdays: r?.weekdays ?? [],
      tags: (task?.tags ?? p.tags ?? []).join(", "),
      subtasks: task?.subtasks ?? [],
      dependencies: task?.dependencies ?? [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: defaults });
  const { register, control, handleSubmit, setValue, formState } = form;
  const subtasks = useFieldArray({ control, name: "subtasks" });
  const [newSubtask, setNewSubtask] = React.useState("");
  const areaId = useWatch({ control, name: "areaId" });
  const repeat = useWatch({ control, name: "repeat" });
  const scheduleDate = useWatch({ control, name: "scheduleDate" });

  const projects = lookups.projects.filter((p) => p.status !== "archived" && (!areaId || !p.areaId || p.areaId === areaId));

  const save = useAction(
    async (v: FormValues) => {
      const s = getServices();
      const recurrence: Recurrence | null =
        v.repeat === "none"
          ? null
          : {
              frequency: v.repeat,
              interval: v.repeatInterval,
              weekdays: v.repeat === "weekly" ? v.repeatWeekdays : [],
              dayOfMonth: null,
              startDate: task?.recurrence?.startDate ?? (v.scheduleDate || today),
              endDate: task?.recurrence?.endDate ?? null,
              startMinutes: v.scheduleTime ? parseTime(v.scheduleTime) : (task?.recurrence?.startMinutes ?? null),
            };
      const input: TaskInput = {
        title: v.title,
        description: v.description,
        notes: v.notes,
        areaId: v.areaId || null,
        projectId: v.projectId || null,
        goalId: v.goalId || null,
        milestoneId: v.goalId ? (task?.milestoneId ?? state.prefill?.milestoneId ?? null) : null,
        priority: v.priority,
        estimatedMinutes: v.estimatedMinutes,
        dueDate: v.dueDate || null,
        tags: v.tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
        subtasks: v.subtasks.filter((st) => st.title.trim()),
        dependencies: v.dependencies,
        recurrence,
      };
      if (task) {
        const statusChanged = v.status !== task.status;
        const updated = await s.tasks.update(
          task.id,
          statusChanged && v.status !== "completed" ? { ...input, status: v.status } : input,
        );
        if (statusChanged && v.status === "completed") return s.tasks.complete(task.id);
        return updated;
      }
      const schedule = v.scheduleDate
        ? { date: v.scheduleDate, startMinutes: v.scheduleTime ? parseTime(v.scheduleTime) : null }
        : undefined;
      return s.tasks.create(input, schedule);
    },
    {
      invalidate: ["work", "goals"],
      success: (t) => (isEdit ? "Task saved" : `Created “${t?.title ?? "task"}”`),
      onSuccess: () => ui.closeTaskEditor(),
    },
  );

  const addSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    subtasks.append({ id: createId("st"), title, done: false });
    setNewSubtask("");
  };

  if (isEdit && !task) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task not found</DialogTitle>
          <DialogDescription>It may have been deleted.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    );
  }

  const otherTasks = lookups.tasks.filter((t) => t.id !== task?.id && t.status !== "completed" && t.status !== "cancelled");

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "The task is the work; its blocks are when you plan to do it." : "Plan it now or leave it unscheduled — both are fine."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="flex min-h-0 flex-1 flex-col" noValidate>
        <DialogBody className="space-y-4">
          <Field label="Title" htmlFor="task-title" error={formState.errors.title?.message}>
            <Input id="task-title" autoFocus={!isEdit} placeholder="e.g. Learn React rendering" aria-invalid={!!formState.errors.title} {...register("title")} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Area" htmlFor="task-area">
              <NativeSelect
                id="task-area"
                {...register("areaId", {
                  onChange: (e) => {
                    const proj = lookups.projectById.get(form.getValues("projectId"));
                    if (proj?.areaId && proj.areaId !== e.target.value) setValue("projectId", "");
                  },
                })}
              >
                <option value="">No area</option>
                {lookups.areas.filter((a) => !a.archived).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Project" htmlFor="task-project">
              <NativeSelect
                id="task-project"
                {...register("projectId", {
                  onChange: (e) => {
                    const proj = lookups.projectById.get(e.target.value);
                    if (proj?.areaId) setValue("areaId", proj.areaId);
                  },
                })}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Priority" htmlFor="task-priority">
              <NativeSelect id="task-priority" {...register("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel(p)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Estimated duration" htmlFor="task-estimate" error={formState.errors.estimatedMinutes?.message}>
              <Controller
                control={control}
                name="estimatedMinutes"
                render={({ field }) => <DurationInput id="task-estimate" value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3 self-start">
              <Field label="Due date" htmlFor="task-due">
                <Controller control={control} name="dueDate" render={({ field }) => <DateField id="task-due" value={field.value} onChange={field.onChange} />} />
              </Field>
              {isEdit ? (
                <Field label="Status" htmlFor="task-status">
                  <NativeSelect id="task-status" {...register("status")}>
                    {TASK_STATUSES.filter((s) => !(task?.recurrence && s === "completed")).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              ) : (
                <Field label="Tags" htmlFor="task-tags">
                  <Input id="task-tags" placeholder="react, deep-work" {...register("tags")} />
                </Field>
              )}
            </div>
          </div>

          {!isEdit && (
            <fieldset className="rounded-lg border border-border p-3">
              <legend className="px-1 text-[13px] font-medium text-muted-foreground">Schedule (optional)</legend>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" htmlFor="task-date">
                  <Controller control={control} name="scheduleDate" render={({ field }) => <DateField id="task-date" value={field.value} onChange={field.onChange} />} />
                </Field>
                <Field label="Start time" htmlFor="task-time" error={formState.errors.scheduleTime?.message} hint={scheduleDate ? "Empty = anytime that day" : undefined}>
                  <Input id="task-time" type="time" step={900} {...register("scheduleTime")} />
                </Field>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  ["Today", today],
                  ["Tomorrow", today ? addDaysKey(today, 1) : ""],
                ].map(([label, d]) => (
                  <Button key={label} type="button" size="xs" variant="secondary" onClick={() => setValue("scheduleDate", d)}>
                    {label}
                  </Button>
                ))}
                {scheduleDate && (
                  <Button type="button" size="xs" variant="ghost" onClick={() => { setValue("scheduleDate", ""); setValue("scheduleTime", ""); }}>
                    Clear
                  </Button>
                )}
              </div>
            </fieldset>
          )}

          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-[13px] font-medium text-muted-foreground">Repeat</legend>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Frequency" htmlFor="task-repeat" className="w-36">
                <NativeSelect
                  id="task-repeat"
                  {...register("repeat", {
                    onChange: (e) => {
                      if (e.target.value === "weekly" && form.getValues("repeatWeekdays").length === 0) {
                        setValue("repeatWeekdays", [weekdayOf(form.getValues("scheduleDate") || today || "2026-01-05")]);
                      }
                    },
                  })}
                >
                  <option value="none">Doesn’t repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </NativeSelect>
              </Field>
              {repeat !== "none" && (
                <Field label="Every" htmlFor="task-interval" className="w-20">
                  <Input id="task-interval" type="number" min={1} max={12} {...register("repeatInterval", { valueAsNumber: true })} />
                </Field>
              )}
              {repeat === "weekly" && (
                <Field label="On" error={formState.errors.repeatWeekdays?.message}>
                  <Controller
                    control={control}
                    name="repeatWeekdays"
                    render={({ field }) => <WeekdayPicker value={field.value} onChange={field.onChange} weekStartsOn={settings.weekStartsOn} />}
                  />
                </Field>
              )}
              {repeat !== "none" && isEdit && (
                <Field label="Time" htmlFor="task-rtime" className="w-28">
                  <Input id="task-rtime" type="time" step={900} {...register("scheduleTime")} placeholder={task?.recurrence?.startMinutes != null ? timeValue(task.recurrence.startMinutes) : ""} />
                </Field>
              )}
            </div>
            {repeat !== "none" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Occurrences are generated a few weeks ahead as separate blocks — move or skip any one without affecting the rest.
              </p>
            )}
          </fieldset>

          <Field label="Description" htmlFor="task-desc">
            <Textarea id="task-desc" rows={2} placeholder="What does done look like?" {...register("description")} />
          </Field>

          <div className="space-y-1.5">
            <p className="text-[13px] font-medium text-muted-foreground">Subtasks</p>
            <ul className="space-y-1">
              {subtasks.fields.map((st, i) => (
                <li key={st.id} className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`subtasks.${i}.done`}
                    render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(!!c)} aria-label="Done" />}
                  />
                  <Input className="h-8" {...register(`subtasks.${i}.title`)} aria-label={`Subtask ${i + 1}`} />
                  <Button type="button" size="icon-xs" variant="ghost" onClick={() => subtasks.remove(i)} aria-label="Remove subtask">
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                className="h-8"
                placeholder="Add a subtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
              />
              <Button type="button" size="sm" variant="secondary" onClick={addSubtask}>
                <Plus /> Add
              </Button>
            </div>
          </div>

          {isEdit && (
            <Field label="Tags" htmlFor="task-tags-edit">
              <Input id="task-tags-edit" placeholder="react, deep-work" {...register("tags")} />
            </Field>
          )}

          <details className="group rounded-lg border border-border">
            <summary className="cursor-pointer select-none px-3 py-2 text-[13px] font-medium text-muted-foreground">More: goal, dependencies, notes</summary>
            <div className="space-y-3 px-3 pb-3">
              <Field label="Contributes to goal" htmlFor="task-goal">
                <NativeSelect id="task-goal" {...register("goalId")}>
                  <option value="">None</option>
                  {(goals.data ?? []).filter((g) => !g.archived).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.period.replace("_", "-")})
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Depends on" hint="Tasks that should be done first.">
                <Controller
                  control={control}
                  name="dependencies"
                  render={({ field }) => (
                    <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border p-2 scrollbar-thin">
                      {otherTasks.length === 0 && <p className="text-xs text-muted-foreground">No other open tasks.</p>}
                      {otherTasks.slice(0, 100).map((t) => (
                        <label key={t.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={field.value.includes(t.id)}
                            onCheckedChange={(c) => field.onChange(c ? [...field.value, t.id] : field.value.filter((x) => x !== t.id))}
                          />
                          <span className="truncate">{t.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </Field>
              <Field label="Notes" htmlFor="task-notes">
                <Textarea id="task-notes" rows={3} {...register("notes")} />
              </Field>
            </div>
          </details>

          {task && (
            <>
              <TaskScheduleSection task={task} />
              <TaskTimeSection task={task} />
            </>
          )}
        </DialogBody>
        <DialogFooter>
          {task && (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-danger hover:text-danger"
              onClick={() => {
                ui.closeTaskEditor();
                workActions.deleteTask(task);
              }}
            >
              <Trash2 /> Delete
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => ui.closeTaskEditor()}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
