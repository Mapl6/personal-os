import { diffDays, fromDateKey, daysInRange, weekdayOf, type DateRange, type DateKey } from "@/lib/date";
import type { Recurrence } from "@/types/domain";
import { differenceInCalendarMonths, getDate, lastDayOfMonth } from "date-fns";

/** Dates within `range` on which the recurrence produces an occurrence. */
export function occurrencesInRange(recurrence: Recurrence, range: DateRange): DateKey[] {
  const from = range.from > recurrence.startDate ? range.from : recurrence.startDate;
  const to = recurrence.endDate && recurrence.endDate < range.to ? recurrence.endDate : range.to;
  if (from > to) return [];
  return daysInRange({ from, to }).filter((day) => occursOn(recurrence, day));
}

export function occursOn(recurrence: Recurrence, day: DateKey): boolean {
  if (day < recurrence.startDate) return false;
  if (recurrence.endDate && day > recurrence.endDate) return false;
  const interval = Math.max(1, recurrence.interval);
  switch (recurrence.frequency) {
    case "daily":
      return diffDays(day, recurrence.startDate) % interval === 0;
    case "weekly": {
      const weekdays = recurrence.weekdays.length ? recurrence.weekdays : [weekdayOf(recurrence.startDate)];
      if (!weekdays.includes(weekdayOf(day))) return false;
      const weeks = Math.floor(diffDays(day, recurrence.startDate) / 7);
      return weeks % interval === 0;
    }
    case "monthly": {
      const date = fromDateKey(day);
      const months = differenceInCalendarMonths(date, fromDateKey(recurrence.startDate));
      if (months % interval !== 0) return false;
      const wanted = recurrence.dayOfMonth ?? getDate(fromDateKey(recurrence.startDate));
      // Clamp to month length so "31st" still happens in short months.
      const effective = Math.min(wanted, getDate(lastDayOfMonth(date)));
      return getDate(date) === effective;
    }
  }
}

export function describeRecurrence(recurrence: Recurrence): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const every = recurrence.interval > 1 ? `Every ${recurrence.interval} ` : "Every ";
  switch (recurrence.frequency) {
    case "daily":
      return recurrence.interval > 1 ? `${every}days` : "Daily";
    case "weekly": {
      const days = recurrence.weekdays.length
        ? [...recurrence.weekdays].sort().map((d) => names[d]).join(", ")
        : names[weekdayOf(recurrence.startDate)];
      return `${recurrence.interval > 1 ? `${every}weeks` : "Weekly"} · ${days}`;
    }
    case "monthly":
      return `${recurrence.interval > 1 ? `${every}months` : "Monthly"} · day ${recurrence.dayOfMonth ?? getDate(fromDateKey(recurrence.startDate))}`;
  }
}
