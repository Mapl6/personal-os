import { describe, expect, it } from "vitest";
import { formatDuration, formatVariance, parseDurationInput } from "@/lib/date";
import { currentStreak, longestStreak } from "@/lib/habits/streak";
import { layoutDayBlocks } from "@/lib/scheduling/layout";
import type { ScheduleBlock } from "@/types/domain";

const b = (id: string, start: number, dur: number): ScheduleBlock => ({
  id, taskId: id, date: "2026-09-24", startMinutes: start, durationMinutes: dur, status: "planned", actualMinutes: null,
  originalDate: "2026-09-24", rescheduleCount: 0, occurrenceDate: null, completedAt: null, createdAt: "", updatedAt: "",
});

describe("duration helpers", () => {
  it("parses and formats durations", () => {
    expect(parseDurationInput("1h30")).toBe(90);
    expect(parseDurationInput("1.5h")).toBe(90);
    expect(parseDurationInput("45m")).toBe(45);
    expect(parseDurationInput("2:15")).toBe(135);
    expect(parseDurationInput("x")).toBeNull();
    expect(formatDuration(160)).toBe("2h 40m");
    expect(formatVariance(25)).toBe("+25m");
    expect(formatVariance(-65)).toBe("-1h 5m");
  });
});

describe("layoutDayBlocks", () => {
  it("places overlapping blocks in lanes", () => {
    const out = layoutDayBlocks([b("a", 540, 120), b("b", 600, 60), b("c", 720, 60)]);
    const byId = Object.fromEntries(out.map((p) => [p.block.id, p]));
    expect(byId.a).toMatchObject({ lane: 0, lanes: 2 });
    expect(byId.b).toMatchObject({ lane: 1, lanes: 2 });
    expect(byId.c).toMatchObject({ lane: 0, lanes: 1 });
  });
});

describe("habit streaks", () => {
  it("counts expected days and tolerates today not done yet", () => {
    const monThu = { weekdays: [1, 4] };
    // Thu 24, Mon 21, Thu 17 done; today Fri 25
    const done = new Set(["2026-09-24", "2026-09-21", "2026-09-17"]);
    expect(currentStreak(monThu, done, "2026-09-25")).toBe(3);
    expect(currentStreak(monThu, new Set(["2026-09-21"]), "2026-09-25")).toBe(0);
    expect(longestStreak(monThu, done)).toBe(3);
  });
});
