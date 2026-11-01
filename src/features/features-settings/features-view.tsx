"use client";

import { Lock, ShieldAlert } from "lucide-react";
import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAction } from "@/hooks/use-action";
import { useSettings } from "@/hooks/queries";
import {
  dependenciesOf,
  dependentsOf,
  FEATURES,
  isFeatureEnabled,
  presetFlags,
  PRESETS,
  toggleFeature,
  type FeatureDefinition,
  type FeatureGroup,
  type FeaturePreset,
} from "@/modules";
import { getServices } from "@/services";

const GROUPS: { id: FeatureGroup; label: string }[] = [
  { id: "planning", label: "Planning" },
  { id: "capture", label: "Capture" },
  { id: "knowledge", label: "Notes and knowledge" },
  { id: "reflection", label: "Reflection" },
  { id: "modules", label: "Life modules" },
];

interface Pending {
  title: string;
  description: string;
  apply: () => void;
}

/** Settings → Features: turn whole parts of the app on or off. Off hides; it never deletes. */
export function FeaturesView() {
  const { settings } = useSettings();
  const flags = settings.features;
  const [pending, setPending] = React.useState<Pending | null>(null);
  const save = useAction((features: Record<string, boolean>) => getServices().data.saveSettings({ features }), { invalidate: ["settings"] });

  const request = (f: FeatureDefinition, on: boolean) => {
    const next = toggleFeature(flags, f.id, on);
    if (on) {
      const deps = dependenciesOf(f.id).filter((d) => !isFeatureEnabled(flags, d.id));
      if (deps.length) {
        setPending({
          title: `Turn on ${f.label}?`,
          description: `This also turns on: ${deps.map((d) => d.label).join(", ")}.`,
          apply: () => save.mutate(next),
        });
        return;
      }
    } else {
      const affected = dependentsOf(f.id).filter((d) => isFeatureEnabled(flags, d.id));
      if (affected.length) {
        setPending({
          title: `Turn off ${f.label}?`,
          description: `${affected.map((d) => d.label).join(", ")} ${affected.length === 1 ? "needs" : "need"} it and will be hidden too. No data is deleted.`,
          apply: () => save.mutate(next),
        });
        return;
      }
    }
    save.mutate(next);
  };

  const applyPreset = (p: FeaturePreset) =>
    setPending({
      title: `Use the “${p.label}” preset?`,
      description: `${p.description} Features outside the preset are hidden, not deleted — you can turn any of them back on.`,
      apply: () => save.mutate(presetFlags(p.enabled)),
    });

  return (
    <>
      <PageHeader title="Features" description="Turn parts of the app on or off. Turning something off hides it everywhere and keeps its data." />
      <section aria-labelledby="presets-h" className="mb-6">
        <h2 id="presets-h" className="mb-2 text-sm font-semibold">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p.id} size="sm" variant="secondary" onClick={() => applyPreset(p)} title={p.description}>
              {p.label}
            </Button>
          ))}
        </div>
      </section>
      <div className="space-y-6">
        {GROUPS.map((g) => {
          const list = FEATURES.filter((f) => f.group === g.id);
          if (list.length === 0) return null;
          return (
            <section key={g.id} aria-labelledby={`fg-${g.id}`}>
              <h2 id={`fg-${g.id}`} className="mb-2 text-sm font-semibold">{g.label}</h2>
              <Card className="divide-y divide-border">
                {list.map((f) => {
                  const on = isFeatureEnabled(flags, f.id);
                  const blockedBy = !on && f.dependsOn?.some((d) => !isFeatureEnabled(flags, d));
                  return (
                    <div key={f.id} className="flex items-start gap-4 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{f.label}</span>
                          {f.core && (
                            <Badge variant="outline">
                              <Lock /> Always on
                            </Badge>
                          )}
                          {f.privacy !== "normal" && (
                            <Badge variant="outline">
                              <ShieldAlert /> {f.privacy === "sensitive" ? "Sensitive" : "Private"}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">{f.description}</p>
                        {f.dependsOn?.length ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Needs {f.dependsOn.map((d) => FEATURES.find((x) => x.id === d)?.label ?? d).join(", ")}
                            {blockedBy ? " (off)" : ""}
                          </p>
                        ) : null}
                      </div>
                      <Switch
                        checked={on}
                        disabled={f.core || save.isPending}
                        onCheckedChange={(v) => request(f, v)}
                        aria-label={`${f.label} ${on ? "on" : "off"}`}
                      />
                    </div>
                  );
                })}
              </Card>
            </section>
          );
        })}
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title={pending?.title ?? ""}
        description={pending?.description}
        confirmLabel="Continue"
        onConfirm={() => {
          pending?.apply();
          setPending(null);
        }}
      />
    </>
  );
}
