import type { CollectionName } from "@/repositories/types";
import type { DashboardWidget } from "@/types/domain";

export type FeatureGroup = "planning" | "knowledge" | "capture" | "reflection" | "modules";

/**
 * One switchable feature. Everything the app shows for it is listed here, so
 * turning it off hides it everywhere (nav, tabs, dashboard, ⌘K) and keeps its data.
 */
export interface FeatureDefinition {
  id: string;
  label: string;
  description: string;
  group: FeatureGroup;
  /** Can't be turned off. */
  core?: boolean;
  defaultEnabled: boolean;
  /** Turning this on turns these on; turning one of these off turns this off. */
  dependsOn?: string[];
  privacy: "normal" | "private" | "sensitive";
  /** Routes the feature owns (hidden from nav and guarded when off). */
  routes?: string[];
  /** Dashboard widgets it contributes. */
  widgets?: DashboardWidget[];
  /** Data it stores — for export and storage stats. */
  collections?: CollectionName[];
}

export interface FeaturePreset {
  id: string;
  label: string;
  description: string;
  /** Features turned on; every other non-core feature is turned off. */
  enabled: string[];
}
