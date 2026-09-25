import { afterEach, describe, expect, it } from "vitest";

/** Persian output is wrapped in Unicode isolates for bidi safety. */
const plain = (s: string) => s.replace(/[\u2068\u2069]/g, "");
import {
  addMonthsKey,
  calParts,
  daysInMonth,
  formatDateKey,
  formatTime,
  monthGridRange,
  monthRange,
  sameMonth,
  setCalendarConfig,
  weekdayName,
} from "@/lib/date";
import { occurrencesInRange } from "@/lib/recurrence";
import { parseQuickAdd } from "@/lib/quick-add/parser";

afterEach(() => setCalendarConfig({ system: "gregorian", language: "en", digits: "latin", timeFormat: "24h" }));

describe("Gregorian (default)", () => {
  it("keeps date-fns output", () => {
    expect(formatDateKey("2026-09-25", "EEE, MMM d")).toBe("Fri, Sep 25");
    expect(monthRange("2026-09-25")).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(formatTime(18 * 60 + 5)).toBe("18:05");
  });
});

describe("Shamsi / Jalali calendar", () => {
  it("converts dates and month boundaries", () => {
    setCalendarConfig({ system: "jalali" });
    // 25 Sep 2026 = 3 Mehr 1405; Mehr has 31? no — months 7-11 have 30 days.
    expect(calParts("2026-09-25")).toEqual({ year: 1405, month: 7, day: 3 });
    expect(monthRange("2026-09-25")).toEqual({ from: "2026-09-23", to: "2026-10-22" });
    // Farvardin 1405 starts on Nowruz, 21 March 2026, and has 31 days.
    expect(monthRange("2026-04-01")).toEqual({ from: "2026-03-21", to: "2026-04-20" });
    // Esfand 1404 is 29 days.
    expect(daysInMonth("2026-03-01")).toBe(29);
    expect(sameMonth("2026-09-23", "2026-10-22")).toBe(true);
    expect(sameMonth("2026-09-22", "2026-09-23")).toBe(false);
  });

  it("adds months in the Jalali calendar and clamps the day", () => {
    setCalendarConfig({ system: "jalali" });
    expect(addMonthsKey("2026-09-25", 1)).toBe("2026-10-25"); // 3 Mehr → 3 Aban
    // 31 Shahrivar 1405 (2026-09-22) + 1 month → 30 Mehr (clamped)
    expect(addMonthsKey("2026-09-22", 1)).toBe("2026-10-22");
    expect(calParts(addMonthsKey("2026-09-25", -7))).toEqual({ year: 1404, month: 12, day: 3 });
    expect(calParts(addMonthsKey("2026-09-25", 12))).toEqual({ year: 1406, month: 7, day: 3 });
  });

  it("month grid covers the Jalali month in full weeks starting Saturday", () => {
    setCalendarConfig({ system: "jalali" });
    const grid = monthGridRange("2026-09-25", 6);
    expect(grid.from <= "2026-09-23" && grid.to >= "2026-10-22").toBe(true);
    expect(new Date(`${grid.from}T00:00`).getDay()).toBe(6);
  });

  it("formats in Persian with Persian digits", () => {
    setCalendarConfig({ system: "jalali", language: "fa", digits: "persian" });
    expect(plain(formatDateKey("2026-09-25", "MMMM yyyy"))).toBe("۱۴۰۵ مهر") // CLDR order; renders as "مهر ۱۴۰۵" right-to-left;
    expect(plain(formatDateKey("2026-09-25", "d"))).toBe("۳");
    expect(plain(weekdayName(5))).toBe("جمعه");
    expect(formatTime(9 * 60)).toBe("۰۹:۰۰");
  });

  it("formats Jalali in English", () => {
    setCalendarConfig({ system: "jalali", language: "en" });
    expect(formatDateKey("2026-09-25", "MMMM yyyy")).toBe("Mehr 1405");
    expect(formatDateKey("2026-09-25", "yyyy-MM-dd")).toBe("1405-07-03");
  });

  it("monthly recurrence follows Jalali months", () => {
    setCalendarConfig({ system: "jalali" });
    // Every 1st of the Jalali month.
    const days = occurrencesInRange(
      { frequency: "monthly", interval: 1, weekdays: [], dayOfMonth: 1, startDate: "2026-03-21", endDate: null, startMinutes: null },
      { from: "2026-08-01", to: "2026-11-30" },
    );
    expect(days).toEqual(["2026-08-23", "2026-09-23", "2026-10-23", "2026-11-22"]);
  });

  it("12h time format", () => {
    setCalendarConfig({ timeFormat: "12h" });
    expect(formatTime(18 * 60 + 30)).toBe("6:30pm");
    expect(formatTime(0)).toBe("12:00am");
  });
});

describe("Quick add in Persian", () => {
  it("understands Persian day words", () => {
    const now = new Date(2026, 8, 24, 10); // Thursday
    const r = parseQuickAdd("ورزش ۲h فردا ۱۸:۰۰", { now, weekStartsOn: 6, areas: [], projects: [] });
    expect(r).toMatchObject({ title: "ورزش", durationMinutes: 120, date: "2026-09-25", startMinutes: 18 * 60 });
    const s = parseQuickAdd("کتاب شنبه", { now, weekStartsOn: 6, areas: [], projects: [] });
    expect(s).toMatchObject({ title: "کتاب", date: "2026-09-26" });
  });
});
