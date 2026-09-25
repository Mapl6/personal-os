"use client";

import { LayoutTemplate } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/input";
import { perform } from "@/hooks/perform";
import { useAreas, useTemplates } from "@/hooks/queries";
import { formatDateKey, formatDuration, formatTime, type DateKey } from "@/lib/date";
import type { PlanChange } from "@/lib/planning/changes";
import { getServices } from "@/services";

type CreateChange = Extract<PlanChange, { kind: "create_task" }>;

/** Apply a weekly template: propose → review/uncheck → apply. Never locks the schedule. */
export function ApplyTemplateDialog({ weekStart, today }: { weekStart: DateKey; today: DateKey }) {
  const [open, setOpen] = React.useState(false);
  const templates = useTemplates();
  const areas = useAreas();
  const [templateId, setTemplateId] = React.useState<string>("");
  const [changes, setChanges] = React.useState<CreateChange[] | null>(null);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [applying, setApplying] = React.useState(false);
  const areaById = new Map((areas.data ?? []).map((a) => [a.id, a]));
  const effectiveId = templateId || templates.data?.[0]?.id || "";

  React.useEffect(() => {
    if (!open || !effectiveId) return;
    let alive = true;
    getServices()
      .templates.proposeApply(effectiveId, weekStart, today)
      .then((c) => {
        if (!alive) return;
        const creates = c.filter((x): x is CreateChange => x.kind === "create_task");
        setChanges(creates);
        setSelected(new Set(creates.map((_, i) => i)));
      });
    return () => {
      alive = false;
    };
  }, [open, effectiveId, weekStart, today]);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setChanges(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <LayoutTemplate /> Apply template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Apply a week template</DialogTitle>
          <DialogDescription>
            Adds the template’s blocks to the week of {formatDateKey(weekStart, "MMM d")}. Past days and blocks that already exist are skipped. Everything stays editable.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {templates.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet. <Link className="text-primary underline" href="/settings#templates">Create one in Settings</Link>.
            </p>
          ) : (
            <>
              <NativeSelect value={effectiveId} onChange={(e) => setTemplateId(e.target.value)} aria-label="Template">
                {(templates.data ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </NativeSelect>
              {changes === null ? (
                <p className="text-sm text-muted-foreground">Preparing proposal…</p>
              ) : changes.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nothing to add — this week already contains the template (or its days have passed).
                </p>
              ) : (
                <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border scrollbar-thin">
                  {changes.map((c, i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <Checkbox
                        checked={selected.has(i)}
                        onCheckedChange={(v) =>
                          setSelected((s) => {
                            const n = new Set(s);
                            if (v) n.add(i);
                            else n.delete(i);
                            return n;
                          })
                        }
                        aria-label={`Include ${c.title}`}
                      />
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">{formatDateKey(c.date, "EEE d")}</span>
                      <AreaDot color={c.areaId ? areaById.get(c.areaId)?.color : null} />
                      <span className="min-w-0 flex-1 truncate">{c.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular">
                        {c.startMinutes !== null ? `${formatTime(c.startMinutes)} · ` : ""}
                        {formatDuration(c.durationMinutes)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={applying || !changes || selected.size === 0}
            onClick={async () => {
              setApplying(true);
              const chosen = (changes ?? []).filter((_, i) => selected.has(i));
              await perform(() => getServices().schedule.applyChanges(chosen), {
                success: (n) => `Added ${n} block${n === 1 ? "" : "s"} to the week`,
              });
              setApplying(false);
              setOpen(false);
            }}
          >
            {applying ? "Applying…" : `Add ${selected.size} block${selected.size === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
