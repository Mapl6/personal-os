"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { areaColorVar } from "@/components/shared/area";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { AREA_COLORS, type Area } from "@/types/domain";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  description: z.string().max(500),
  color: z.enum(AREA_COLORS),
  keywords: z.string(),
});
type Values = z.infer<typeof schema>;

export function AreaDialog({ open, onOpenChange, area }: { open: boolean; onOpenChange: (o: boolean) => void; area?: Area }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: area?.name ?? "",
      description: area?.description ?? "",
      color: area?.color ?? "sky",
      keywords: (area?.keywords ?? []).join(", "),
    },
  });
  const save = useAction(
    (v: Values) => {
      const input = { ...v, keywords: v.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean) };
      return area ? getServices().areas.update(area.id, input) : getServices().areas.create(input);
    },
    { invalidate: ["areas"], success: area ? "Area saved" : "Area created", onSuccess: () => onOpenChange(false) },
  );
  const { register, handleSubmit, control, formState } = form;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{area ? "Edit area" : "New area"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
          <DialogBody className="space-y-3">
            <Field label="Name" htmlFor="ar-name" error={formState.errors.name?.message}>
              <Input id="ar-name" autoFocus {...register("name")} aria-invalid={!!formState.errors.name} />
            </Field>
            <Field label="Colour">
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <div role="radiogroup" aria-label="Colour" className="flex gap-2">
                    {AREA_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={field.value === c}
                        aria-label={c}
                        onClick={() => field.onChange(c)}
                        className={cn("size-7 rounded-full ring-offset-2 ring-offset-popover", field.value === c && "ring-2 ring-foreground")}
                        style={{ background: areaColorVar(c) }}
                      />
                    ))}
                  </div>
                )}
              />
            </Field>
            <Field label="Quick Add keywords" htmlFor="ar-kw" hint="Comma-separated. “React 2h” → this area if “react” is listed.">
              <Input id="ar-kw" {...register("keywords")} placeholder="react, typescript, css" />
            </Field>
            <Field label="Description" htmlFor="ar-desc">
              <Textarea id="ar-desc" rows={2} {...register("description")} />
            </Field>
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
