"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { FeatureOffScreen } from "@/features/features-settings/feature-off";
import { useFeatures } from "@/hooks/queries";
import { featureForRoute } from "@/modules";

/** Renders the page, or a "turned off" screen when its feature is off. */
export function FeatureGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOn } = useFeatures();
  const feature = featureForRoute(pathname);
  if (feature && !isOn(feature.id)) return <FeatureOffScreen feature={feature} />;
  return <>{children}</>;
}
