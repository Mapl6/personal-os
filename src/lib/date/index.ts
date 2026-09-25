import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** A calendar day in local time, formatted as `yyyy-MM-dd`. */
export type DateKey = string;
/** Day-of-week index where 0 = Sunday … 6 = Saturday (matches Date#getDay). */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const MINUTES_PER_DAY = 24 * 60;
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function toDateKey(date: Date): DateKey {
  return format(date, "yyyy-MM-dd");
}

/** Parses a date key as a *local* date (midnight). */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function addDaysKey(key: DateKey, amount: number): DateKey {
  return toDateKey(addDays(fromDateKey(key), amount));
}

export function addMonthsKey(key: DateKey, amount: number): DateKey {
  return toDateKey(addMonths(fromDateKey(key), amount));
}

export function diffDays(a: DateKey, b: DateKey): number {
  return differenceInCalendarDays(fromDateKey(a), fromDateKey(b));
}

export function weekdayOf(key: DateKey): WeekdayIndex {
  return fromDateKey(key).getDay() as WeekdayIndex;
}

export interface DateRange {
  from: DateKey;
  to: DateKey; // inclusive
}

export function weekRange(key: DateKey, weekStartsOn: WeekdayIndex): DateRange {
  const d = fromDateKey(key);
  return {
    from: toDateKey(startOfWeek(d, { weekStartsOn })),
    to: toDateKey(endOfWeek(d, { weekStartsOn })),
  };
}

export function monthRange(key: DateKey): DateRange {
  const d = fromDateKey(key);
  return { from: toDateKey(startOfMonth(d)), to: toDateKey(endOfMonth(d)) };
}

/** The 6×7 (or 5×7) grid of days that covers the month, padded to full weeks. */
export function monthGridRange(key: DateKey, weekStartsOn: WeekdayIndex): DateRange {
  const { from, to } = monthRange(key);
  return {
    from: weekRange(from, weekStartsOn).from,
    to: weekRange(to, weekStartsOn).to,
  };
}

export function daysInRange({ from, to }: DateRange): DateKey[] {
  if (from > to) return [];
  return eachDayOfInterval({ start: fromDateKey(from), end: fromDateKey(to) }).map(toDateKey);
}

export function isInRange(key: DateKey, range: DateRange): boolean {
  return key >= range.from && key <= range.to;
}

export function lastNDays(n: number, endKey: DateKey): DateRange {
  return { from: addDaysKey(endKey, -(n - 1)), to: endKey };
}

// ---------- minutes / durations ----------

/** Minutes since local midnight for a Date. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** "HH:mm" → minutes. Returns null for invalid input. */
export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** minutes → "HH:mm" */
export function formatTime(minutes: number): string {
  const safe = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTimeRange(start: number, duration: number): string {
  return `${formatTime(start)}–${formatTime(start + duration)}`;
}

/** 150 → "2h 30m", 45 → "45m", 0 → "0m" */
export function formatDuration(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.round(Math.abs(minutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/** Signed variance, e.g. +25m / -1h 5m / ±0m */
export function formatVariance(minutes: number): string {
  if (minutes === 0) return "±0m";
  return minutes > 0 ? `+${formatDuration(minutes)}` : formatDuration(minutes);
}

export function formatHours(minutes: number, digits = 1): string {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(digits)}h`;
}

export function snapMinutes(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step;
}

// ---------- display ----------

export function formatDateKey(key: DateKey, pattern = "EEE, MMM d"): string {
  return format(fromDateKey(key), pattern);
}

export function relativeDayLabel(key: DateKey, today: DateKey): string {
  const diff = diffDays(key, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return formatDateKey(key, "EEEE");
  return formatDateKey(key, "MMM d");
}

/** Parses user duration input: "90", "90m", "1.5h", "1h30", "1h 30m", "1:30". */
export function parseDurationInput(value: string): number | null {
  const v = value.trim().toLowerCase().replace(/\s+/g, "");
  if (!v) return null;
  let m = /^(\d+)$/.exec(v);
  if (m) return +m[1];
  m = /^(\d+):(\d{1,2})$/.exec(v);
  if (m) return +m[1] * 60 + +m[2];
  m = /^(\d+(?:\.\d+)?)h$/.exec(v);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  m = /^(\d+)m(?:in)?$/.exec(v);
  if (m) return +m[1];
  m = /^(\d+)h(\d{1,2})m?$/.exec(v);
  if (m) return +m[1] * 60 + +m[2];
  return null;
}
