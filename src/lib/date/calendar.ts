import { addDays, addMonths, endOfMonth, format, getDate, getDaysInMonth, startOfMonth } from "date-fns";
import { DEFAULT_CALENDAR, type CalendarSettings } from "@/types/domain";

/**
 * Calendar-system layer. Everything month-shaped (month boundaries, adding
 * months, day-of-month) and every displayed date goes through here so the app
 * works in the Gregorian or the Solar Hijri (Shamsi / Jalali) calendar.
 *
 * Jalali conversion uses the platform's `Intl` Persian calendar — no extra
 * dependency, and it's the same data browsers use.
 *
 * Storage never changes: dates are always stored as Gregorian `yyyy-MM-dd`
 * keys, so switching calendars is purely presentational and lossless.
 */

type Key = string;

export interface CalendarConfig extends CalendarSettings {
  /** Preferred numeric date pattern for "full" dates in Gregorian mode. */
  dateFormat: string;
}

let config: CalendarConfig = { ...DEFAULT_CALENDAR, dateFormat: "EEE, MMM d" };
let version = 0;
const listeners = new Set<() => void>();

export function setCalendarConfig(next: Partial<CalendarConfig>) {
  const merged = { ...config, ...next };
  if (JSON.stringify(merged) === JSON.stringify(config)) return;
  config = merged;
  version++;
  listeners.forEach((l) => l());
}

export function getCalendarConfig(): Readonly<CalendarConfig> {
  return config;
}

/** Changes whenever the calendar config changes (use as a React key / memo dep). */
export function calendarVersion() {
  return version;
}

export function subscribeCalendar(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const isJalali = () => config.system === "jalali";
/** True when output is identical to plain date-fns English formatting. */
const isPlain = () => config.system === "gregorian" && config.language === "en" && config.digits === "latin";

// ---------------------------------------------------------------- key helpers (local, no circular import)

function fromKey(key: Key): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toKey(date: Date): Key {
  return format(date, "yyyy-MM-dd");
}
function shift(key: Key, days: number): Key {
  return toKey(addDays(fromKey(key), days));
}

// ---------------------------------------------------------------- Jalali conversion

const jalaliFmt = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});
const partsCache = new Map<Key, CalParts>();

export interface CalParts {
  year: number;
  /** 1-based month in the active calendar. */
  month: number;
  day: number;
}

export function jalaliParts(key: Key): CalParts {
  let hit = partsCache.get(key);
  if (hit) return hit;
  const parts = jalaliFmt.formatToParts(fromKey(key));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  hit = { year: get("year"), month: get("month"), day: get("day") };
  if (partsCache.size > 5000) partsCache.clear();
  partsCache.set(key, hit);
  return hit;
}

/** Year/month/day of a date key in the active calendar system. */
export function calParts(key: Key): CalParts {
  if (isJalali()) return jalaliParts(key);
  const d = fromKey(key);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** Jalali month lengths: 31×6, 30×5, then 29 or 30 (leap). Computed, not tabulated. */
function jalaliMonthLength(startKey: Key): number {
  const { month } = jalaliParts(startKey);
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return jalaliParts(shift(startKey, 29)).month === 12 ? 30 : 29;
}

export function monthStartKey(key: Key): Key {
  if (!isJalali()) return toKey(startOfMonth(fromKey(key)));
  return shift(key, -(jalaliParts(key).day - 1));
}

export function monthEndKey(key: Key): Key {
  if (!isJalali()) return toKey(endOfMonth(fromKey(key)));
  const start = monthStartKey(key);
  return shift(start, jalaliMonthLength(start) - 1);
}

export function daysInMonth(key: Key): number {
  if (!isJalali()) return getDaysInMonth(fromKey(key));
  return jalaliMonthLength(monthStartKey(key));
}

/** Adds calendar months, clamping the day to the target month's length. */
export function addCalendarMonths(key: Key, amount: number): Key {
  if (!isJalali()) return toKey(addMonths(fromKey(key), amount));
  if (amount === 0) return key;
  const { year, month, day } = jalaliParts(key);
  const target = year * 12 + (month - 1) + amount;
  // Jump roughly, then walk month-by-month to the exact target month start.
  let start = monthStartKey(shift(monthStartKey(key), Math.round(amount * 30.44) + 10));
  for (let i = 0; i < 4; i++) {
    const p = jalaliParts(start);
    const idx = p.year * 12 + (p.month - 1);
    if (idx === target) break;
    start = idx < target ? shift(monthEndKey(start), 1) : monthStartKey(shift(start, -1));
  }
  return shift(start, Math.min(day, jalaliMonthLength(start)) - 1);
}

export function sameMonth(a: Key, b: Key): boolean {
  const pa = calParts(a);
  const pb = calParts(b);
  return pa.year === pb.year && pa.month === pb.month;
}

/** Month index difference b - a in the active calendar. */
export function monthsBetween(a: Key, b: Key): number {
  const pa = calParts(a);
  const pb = calParts(b);
  return pb.year * 12 + pb.month - (pa.year * 12 + pa.month);
}

export function dayOfMonth(key: Key): number {
  return isJalali() ? jalaliParts(key).day : getDate(fromKey(key));
}

// ---------------------------------------------------------------- formatting

function localeTag() {
  const lang = config.language === "fa" ? "fa-IR" : "en-US";
  const ca = isJalali() ? "persian" : "gregory";
  const nu = config.digits === "persian" ? "arabext" : "latn";
  return `${lang}-u-ca-${ca}-nu-${nu}`;
}

const intlCache = new Map<string, Intl.DateTimeFormat>();
function intl(options: Intl.DateTimeFormatOptions) {
  const cacheKey = `${localeTag()}|${JSON.stringify(options)}`;
  let f = intlCache.get(cacheKey);
  if (!f) {
    f = new Intl.DateTimeFormat(localeTag(), options);
    intlCache.set(cacheKey, f);
  }
  return f;
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function localizeDigits(value: string): string {
  if (config.digits !== "persian") return value;
  return value.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/**
 * Formats a date key. Accepts date-fns style patterns used across the app
 * ("EEE, MMM d", "MMMM yyyy", "d", …). In plain Gregorian/English mode the
 * output is exactly date-fns'; otherwise the pattern's *fields* are rendered
 * with Intl in the chosen calendar, language and digits.
 */
export function formatDate(key: Key, pattern = "EEE, MMM d"): string {
  const date = fromKey(key);
  if (isPlain()) return format(date, pattern);

  // Purely numeric patterns (user date format / ISO) → numeric in the active calendar.
  if (/^[dMy/.\-\s]+$/.test(pattern) && !pattern.includes("MMM") && /[/.\-]/.test(pattern)) {
    const { year, month, day } = calParts(key);
    const out = pattern
      .replace("yyyy", String(year))
      .replace("MM", String(month).padStart(2, "0"))
      .replace("dd", String(day).padStart(2, "0"));
    return isolate(localizeDigits(out));
  }

  const opts: Intl.DateTimeFormatOptions = {};
  if (pattern.includes("EEEEE")) opts.weekday = "narrow";
  else if (pattern.includes("EEEE")) opts.weekday = "long";
  else if (pattern.includes("EEE")) opts.weekday = "short";
  if (pattern.includes("MMMM")) opts.month = "long";
  else if (pattern.includes("MMM")) opts.month = config.language === "fa" ? "long" : "short";
  if (/(^|[^d])d{1,2}([^d]|$)/.test(pattern)) opts.day = "numeric";
  if (pattern.includes("yyyy")) opts.year = "numeric";

  const parts = intl(opts).formatToParts(date);
  const text = parts
    .filter((p) => p.type !== "era")
    .map((p) => p.value)
    .join("")
    .replace(/\s+/g, " ")
    .replace(/[\s,،]+$/, "")
    .trim();
  return isolate(text);
}

/**
 * Persian text inside the (left-to-right) UI is wrapped in Unicode first-strong
 * isolates so each date keeps its own right-to-left order and doesn't scramble
 * neighbouring text like "28 Shahrivar – 3 Mehr".
 */
function isolate(text: string): string {
  return config.language === "fa" ? `\u2068${text}\u2069` : text;
}

/** Localised weekday name for index 0=Sunday … 6=Saturday. */
export function weekdayName(index: number, style: "long" | "short" | "narrow" = "long"): string {
  // 2024-01-07 is a Sunday.
  const key = `2024-01-${String(7 + index).padStart(2, "0")}`;
  if (isPlain()) return format(fromKey(key), style === "long" ? "EEEE" : style === "short" ? "EEE" : "EEEEE");
  return isolate(intl({ weekday: style }).format(fromKey(key)));
}

/** Time of day for display, honouring 12/24h and digits. */
export function formatClock(minutes: number): string {
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(safe / 60);
  const m = String(safe % 60).padStart(2, "0");
  let out: string;
  if (config.timeFormat === "12h") {
    const suffix = config.language === "fa" ? (h < 12 ? " ق.ظ" : " ب.ظ") : h < 12 ? "am" : "pm";
    out = `${h % 12 === 0 ? 12 : h % 12}:${m}${suffix}`;
  } else {
    out = `${String(h).padStart(2, "0")}:${m}`;
  }
  return localizeDigits(out);
}
