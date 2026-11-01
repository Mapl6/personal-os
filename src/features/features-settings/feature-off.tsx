"use client";

import { ToggleRight } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { useSettings } from "@/hooks/queries";
import { toggleFeature, type FeatureDefinition } from "@/modules";
import { getServices } from "@/services";

/** Shown instead of a page whose feature is off — bookmarks keep working, nothing 404s. */
export function FeatureOffScreen({ feature }: { feature: FeatureDefinition }) {
  const { settings } = useSettings();
  const turnOn = useAction(
    () => getServices().data.saveSettings({ features: toggleFeature(settings.features, feature.id, true) }),
    { invalidate: ["settings"], success: `${feature.label} is on` },
  );
  return (
    <EmptyState
      icon={ToggleRight}
      title={`${feature.label} is turned off.`}
      description={`${feature.description} Your data is kept; turning it on brings everything back.`}
      action={
        <Button size="sm" onClick={() => turnOn.mutate()} disabled={turnOn.isPending}>
          Turn on {feature.label}
        </Button>
      }
    />
  );
}
