import { addDaysKey, weekdayOf, type DateKey } from "@/lib/date";
import type { Habit } from "@/types/domain";

/**
 * Current streak = consecutive *expected* days (per habit weekdays) completed,
 * counting back from today. Today not being done yet does not break the streak.
 */
export function currentStreak(habit: Pick<Habit, "weekdays">, doneDates: ReadonlySet<DateKey>, today: DateKey): number {
  let streak = 0;
  let day = today;
  for (let i = 0; i < 400; i++) {
    const expected = habit.weekdays.includes(weekdayOf(day));
    if (expected) {
      if (doneDates.has(day)) streak++;
      else if (day !== today) break;
    } else if (doneDates.has(day)) {
      streak++; // bonus completion on an off-day still counts
    }
    day = addDaysKey(day, -1);
  }
  return streak;
}

export function longestStreak(habit: Pick<Habit, "weekdays">, doneDates: ReadonlySet<DateKey>): number {
  const sorted = [...doneDates].sort();
  if (sorted.length === 0) return 0;
  let best = 0;
  let run = 0;
  let day = sorted[0];
  const last = sorted[sorted.length - 1];
  while (day <= last) {
    const expected = habit.weekdays.includes(weekdayOf(day));
    if (doneDates.has(day)) run++;
    else if (expected) run = 0;
    best = Math.max(best, run);
    day = addDaysKey(day, 1);
  }
  return best;
}
