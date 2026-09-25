"use client";

import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { DurationInput } from "@/components/shared/duration-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { useAreas, useSettings, useTemplates } from "@/hooks/queries";
import { WEEKDAY_NAMES, formatTime, parseTime } from "@/lib/date";
import { createId } from "@/lib/utils/id";
import { getServices } from "@/services";
import type { TemplateItem, WeekTemplate } from "@/types/domain";

/** Reusable week templates. Applying one proposes blocks — it never locks the schedule. */
export function TemplatesSection() {
  const templates = useTemplates();
  const create = useAction(() => getServices().templates.create("New template", []), { invalidate: ["templates"], success: "Template created" });
  const list = templates.data ?? [];
  return (
    <div className="space-y-4">
      {list.length === 0 && <EmptyState compact title="No templates." description="A template is a typical week you can apply from the Week page." />}
      {list.map((t) => <TemplateCard key={`${t.id}:${t.updatedAt}`} template={t} />)}
      <Button size="sm" variant="secondary" onClick={() => create.mutate()}><Plus /> New template</Button>
    </div>
  );
}

function TemplateCard({ template }: { template: WeekTemplate }) {
  const areas = useAreas();
  const { settings } = useSettings();
  const [name, setName] = React.useState(template.name);
  const [items, setItems] = React.useState<TemplateItem[]>(template.items);
  const [confirm, setConfirm] = React.useState(false);
  const dirty = name !== template.name || JSON.stringify(items) !== JSON.stringify(template.items);
  const save = useAction(() => getServices().templates.update(template.id, { name, items }), { invalidate: ["templates"], success: "Template saved" });
  const remove = useAction(() => getServices().templates.remove(template.id), { invalidate: ["templates"], success: "Template deleted" });
  const order = Array.from({ length: 7 }, (_, i) => (i + settings.weekStartsOn) % 7);
  const patch = (id: string, p: Partial<TemplateItem>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs font-medium" aria-label="Template name" />
        <div className="ml-auto flex gap-2">
          <Button size="sm" disabled={!dirty || !name.trim() || save.isPending} onClick={() => save.mutate()}>Save</Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setConfirm(true)} aria-label="Delete template"><Trash2 /></Button>
        </div>
      </div>
      <div className="space-y-3">
        {order.map((day) => {
          const dayItems = items.filter((i) => i.weekday === day);
          return (
            <div key={day}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{WEEKDAY_NAMES[day]}</span>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setItems((xs) => [...xs, { id: createId("tpi"), weekday: day, title: "", areaId: areas.data?.[0]?.id ?? null, projectId: null, durationMinutes: 120, startMinutes: null }])}
                >
                  <Plus /> Add
                </Button>
              </div>
              {dayItems.length === 0 ? (
                <p className="text-xs text-muted-foreground/70">—</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayItems.map((it) => (
                    <li key={it.id} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_140px_100px_150px_auto] sm:items-start">
                      <Input className="h-8" value={it.title} placeholder="Title" onChange={(e) => patch(it.id, { title: e.target.value })} aria-label="Title" />
                      <Button size="icon-xs" variant="ghost" className="sm:order-last" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))} aria-label="Remove item"><Trash2 /></Button>
                      <NativeSelect className="h-8" value={it.areaId ?? ""} onChange={(e) => patch(it.id, { areaId: e.target.value || null })} aria-label="Area">
                        <option value="">No area</option>
                        {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </NativeSelect>
                      <Input className="h-8" type="time" step={900} value={it.startMinutes !== null ? formatTime(it.startMinutes) : ""} onChange={(e) => patch(it.id, { startMinutes: e.target.value ? parseTime(e.target.value) : null })} aria-label="Start time" />
                      <DurationInput value={it.durationMinutes} onChange={(m) => patch(it.id, { durationMinutes: m })} presets={[60, 120, 180]} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {items.some((i) => !i.title.trim()) && <p className="mt-2 text-xs text-warning">Items without a title are not saved correctly — give each one a name.</p>}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`Delete “${template.name}”?`} description="Blocks already created from it are not affected." destructive confirmLabel="Delete" onConfirm={() => remove.mutate()} />
    </div>
  );
}
