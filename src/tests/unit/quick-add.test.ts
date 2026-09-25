import { describe, expect, it } from "vitest";
import { parseQuickAdd, type QuickAddContext } from "@/lib/quick-add/parser";

// Thursday 24 Sep 2026, 10:00
const now = new Date(2026, 8, 24, 10, 0);
const ctx: QuickAddContext = {
  now,
  weekStartsOn: 1,
  areas: [
    { id: "fe", name: "Frontend", keywords: ["react", "typescript"] },
    { id: "su", name: "Startup + AI", keywords: ["startup", "ai"] },
    { id: "he", name: "Health", keywords: ["gym", "yoga"] },
    { id: "pe", name: "Personal", keywords: ["book", "review"] },
  ],
  projects: [{ id: "mvp", name: "Startup MVP", areaId: "su" }],
};

describe("parseQuickAdd", () => {
  it("parses title, duration and relative day", () => {
    const r = parseQuickAdd("React 2h tomorrow", ctx);
    expect(r).toMatchObject({ title: "React", durationMinutes: 120, date: "2026-09-25", startMinutes: null, areaId: "fe" });
  });

  it("parses weekday and clock time", () => {
    const r = parseQuickAdd("Gym Thursday 18:00", ctx);
    expect(r.title).toBe("Gym");
    expect(r.date).toBe("2026-09-24"); // Thursday is today
    expect(r.startMinutes).toBe(18 * 60);
    expect(r.areaId).toBe("he");
    expect(r.ambiguities.join(" ")).toMatch(/today/);
  });

  it("parses Saturday + hours for startup", () => {
    const r = parseQuickAdd("Startup 3h Saturday", ctx);
    expect(r).toMatchObject({ title: "Startup", durationMinutes: 180, date: "2026-09-26", areaId: "su" });
  });

  it("handles next weekday, tags, priority and projects", () => {
    const r = parseQuickAdd("Startup MVP schema 90m next monday #db !high", ctx);
    expect(r.title).toBe("Startup MVP schema");
    expect(r.durationMinutes).toBe(90);
    expect(r.date).toBe("2026-09-28");
    expect(r.tags).toEqual(["db"]);
    expect(r.priority).toBe("high");
    expect(r.projectId).toBe("mvp");
    expect(r.areaId).toBe("su");
  });

  it("parses weekly recurrence", () => {
    const r = parseQuickAdd("Weekly Review every sunday at 18:00", ctx);
    expect(r.title).toBe("Weekly Review");
    expect(r.recurrence).toMatchObject({ frequency: "weekly", weekdays: [0], startMinutes: 18 * 60 });
  });

  it("supports am/pm and 1h30m", () => {
    const r = parseQuickAdd("Yoga 1h30m 7am", ctx);
    expect(r.durationMinutes).toBe(90);
    expect(r.startMinutes).toBe(7 * 60);
    // 7am already passed today → tomorrow, flagged
    expect(r.date).toBe("2026-09-25");
    expect(r.ambiguities.length).toBeGreaterThan(0);
  });

  it("flags missing title", () => {
    expect(parseQuickAdd("2h tomorrow", ctx).ambiguities).toContain("No title detected.");
  });
});
