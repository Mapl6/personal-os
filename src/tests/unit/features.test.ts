import { describe, expect, it } from "vitest";
import { NAV_ITEMS, orderNavSpaces } from "@/components/layout/nav-items";
import {
  dependentsOf,
  FEATURES,
  featureForRoute,
  isFeatureEnabled,
  isRouteEnabled,
  isWidgetEnabled,
  presetFlags,
  PRESETS,
  toggleFeature,
} from "@/modules";
import { COLLECTION_NAMES } from "@/repositories/types";

describe("feature registry", () => {
  it("has unique ids, known dependencies without cycles, and real collections", () => {
    const ids = FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FEATURES) {
      for (const d of f.dependsOn ?? []) expect(ids).toContain(d);
      expect(dependentsOf(f.id).map((x) => x.id)).not.toContain(f.id);
      for (const c of f.collections ?? []) expect(COLLECTION_NAMES).toContain(c);
    }
  });

  it("every feature route is a real nav item", () => {
    const hrefs = NAV_ITEMS.map((n) => n.href);
    for (const f of FEATURES) for (const r of f.routes ?? []) expect(hrefs).toContain(r);
  });
});

describe("flags", () => {
  it("uses defaults, keeps core on, and turns off dependents", () => {
    expect(isFeatureEnabled({}, "habits")).toBe(true);
    expect(isFeatureEnabled({ tasks: false }, "tasks")).toBe(true);
    expect(isFeatureEnabled({ pages: false }, "dailyNotes")).toBe(false);
    expect(isFeatureEnabled({}, "nope")).toBe(false);
  });

  it("turning a feature on turns its dependencies on", () => {
    const flags = toggleFeature({ pages: false, dailyNotes: false }, "dailyNotes", true);
    expect(flags).toMatchObject({ pages: true, dailyNotes: true });
  });

  it("hides routes, widgets and nav for features that are off", () => {
    const flags = { habits: false, goals: false };
    expect(featureForRoute("/habits")?.id).toBe("habits");
    expect(isRouteEnabled(flags, "/habits")).toBe(false);
    expect(isRouteEnabled(flags, "/tasks")).toBe(true);
    expect(isWidgetEnabled(flags, "habits")).toBe(false);
    expect(isWidgetEnabled(flags, "weeklyGoals")).toBe(false);
    expect(isWidgetEnabled(flags, "schedule")).toBe(true);
    const life = orderNavSpaces([], [], (h) => isRouteEnabled(flags, h)).find((s) => s.label === "Life");
    expect(life?.pages).toEqual(["/projects", "/areas"]);
  });

  it("presets switch every optional feature explicitly", () => {
    const planner = presetFlags(PRESETS.find((p) => p.id === "planner")!.enabled);
    expect(isFeatureEnabled(planner, "pages")).toBe(false);
    expect(isFeatureEnabled(planner, "habits")).toBe(true);
  });
});
