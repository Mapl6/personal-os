"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { useAreas } from "@/hooks/queries";
import { getServices } from "@/services";
import { PROJECT_STATUSES, type Project } from "@/types/domain";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().max(2000),
  areaId: z.string(),
  status: z.enum(PROJECT_STATUSES),
  deadline: z.string(),
});
type Values = z.infer<typeof schema>;

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  defaultAreaId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project?: Project;
  defaultAreaId?: string;
}) {
  const areas = useAreas();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      areaId: project?.areaId ?? defaultAreaId ?? "",
      status: project?.status ?? "active",
      deadline: project?.deadline ?? "",
    },
  });
  const save = useAction(
    (v: Values) => {
      const input = { ...v, areaId: v.areaId || null, deadline: v.deadline || null };
      return project ? getServices().projects.update(project.id, input) : getServices().projects.create(input);
    },
    { invalidate: ["projects"], success: project ? "Project saved" : "Project created", onSuccess: () => onOpenChange(false) },
  );
  const { register, handleSubmit, formState } = form;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
          <DialogBody className="space-y-3">
            <Field label="Name" htmlFor="pj-name" error={formState.errors.name?.message}>
              <Input id="pj-name" autoFocus {...register("name")} aria-invalid={!!formState.errors.name} placeholder="e.g. Frontend Mastery" />
            </Field>
            <Field label="Description" htmlFor="pj-desc">
              <Textarea id="pj-desc" rows={3} {...register("description")} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Area" htmlFor="pj-area">
                <NativeSelect id="pj-area" {...register("areaId")}>
                  <option value="">No area</option>
                  {(areas.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Status" htmlFor="pj-status">
                <NativeSelect id="pj-status" {...register("status")}>
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Deadline" htmlFor="pj-deadline">
                <Input id="pj-deadline" type="date" {...register("deadline")} />
              </Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
