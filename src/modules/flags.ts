import type { Settings } from "@/types/domain";
import { FEATURE_BY_ID, FEATURES, featureForRoute } from "./registry";
import type { FeatureDefinition } from "./types";

type FlagMap = Settings["features"];

/** Explicit setting → registry default → off for unknown ids. A feature whose dependency is off is off. */
export function isFeatureEnabled(flags: FlagMap, id: string, seen: Set<string> = new Set()): boolean {
  const def = FEATURE_BY_ID.get(id);
  if (!def) return false;
  if (def.core) return true;
  if (seen.has(id)) return false;
  seen.add(id);
  const on = flags[id] ?? def.defaultEnabled;
  return on && (def.dependsOn ?? []).every((d) => isFeatureEnabled(flags, d, seen));
}

export function enabledFeatures(flags: FlagMap): FeatureDefinition[] {
  return FEATURES.filter((f) => isFeatureEnabled(flags, f.id));
}

export function isRouteEnabled(flags: FlagMap, pathname: string): boolean {
  const f = featureForRoute(pathname);
  return !f || isFeatureEnabled(flags, f.id);
}

/** Features that (transitively) depend on `id`. */
export function dependentsOf(id: string): FeatureDefinition[] {
  const out = new Map<string, FeatureDefinition>();
  const visit = (target: string) => {
    for (const f of FEATURES) {
      if (f.dependsOn?.includes(target) && !out.has(f.id)) {
        out.set(f.id, f);
        visit(f.id);
      }
    }
  };
  visit(id);
  return [...out.values()];
}

/** Dependencies (transitive) that must be on for `id`. */
export function dependenciesOf(id: string): FeatureDefinition[] {
  const out = new Map<string, FeatureDefinition>();
  const visit = (fid: string) => {
    for (const d of FEATURE_BY_ID.get(fid)?.dependsOn ?? []) {
      const def = FEATURE_BY_ID.get(d);
      if (def && !out.has(d)) {
        out.set(d, def);
        visit(d);
      }
    }
  };
  visit(id);
  return [...out.values()];
}

/** The flag changes for turning a feature on (with its dependencies) or off. */
export function toggleFeature(flags: FlagMap, id: string, on: boolean): FlagMap {
  const next = { ...flags, [id]: on };
  if (on) for (const d of dependenciesOf(id)) if (!d.core) next[d.id] = true;
  return next;
}

export function presetFlags(enabled: string[]): FlagMap {
  return Object.fromEntries(FEATURES.filter((f) => !f.core).map((f) => [f.id, enabled.includes(f.id)]));
}

/** A dashboard widget is shown only when the feature that contributes it is on. */
export function isWidgetEnabled(flags: FlagMap, widget: string): boolean {
  const owner = FEATURES.find((f) => f.widgets?.includes(widget as never));
  return !owner || isFeatureEnabled(flags, owner.id);
}
