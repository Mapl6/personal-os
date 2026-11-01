import { toDateKey } from "@/lib/date";
import { createId } from "@/lib/utils/id";
import type { CheckIn, DayRating } from "@/types/domain";
import { DomainError, type ServiceContext } from "./context";

const inRange = (n: number | null | undefined) => n == null || (Number.isInteger(n) && n >= 1 && n <= 5);

/** Mood/energy check-ins (several a day) and one rating per day. */
export function createCheckInService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();
  return {
    async log(input: { mood?: number | null; energy?: number | null; note?: string; date?: string }): Promise<CheckIn> {
      if (!inRange(input.mood) || !inRange(input.energy)) throw new DomainError("Ratings go from 1 to 5");
      if (input.mood == null && input.energy == null) throw new DomainError("Pick a mood or energy level");
      const now = iso();
      const entry: CheckIn = {
        id: createId("ci"),
        date: input.date ?? toDateKey(ctx.now()),
        at: now,
        mood: input.mood ?? null,
        energy: input.energy ?? null,
        note: input.note ?? "",
        createdAt: now,
        updatedAt: now,
      };
      return store.checkIns.put(entry);
    },
    /** Adds energy (or a note) to a check-in logged a moment ago. */
    async update(id: string, patch: { mood?: number | null; energy?: number | null; note?: string }): Promise<CheckIn> {
      if (!inRange(patch.mood) || !inRange(patch.energy)) throw new DomainError("Ratings go from 1 to 5");
      const existing = await store.checkIns.get(id);
      if (!existing) throw new DomainError("Check-in not found");
      return store.checkIns.put({ ...existing, ...patch, updatedAt: iso() });
    },
    async remove(id: string) {
      await store.checkIns.delete(id);
    },
    async forDate(date: string): Promise<CheckIn[]> {
      return (await store.checkIns.listBy("date", date)).sort((a, b) => a.at.localeCompare(b.at));
    },
    /** Sets (or replaces) the rating for a day. */
    async rateDay(date: string, rating: number, note = ""): Promise<DayRating> {
      if (!inRange(rating)) throw new DomainError("Ratings go from 1 to 5");
      const existing = (await store.dayRatings.listBy("date", date))[0];
      const now = iso();
      return store.dayRatings.put({
        id: existing?.id ?? createId("dr"),
        date,
        rating,
        note: note || existing?.note || "",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
    },
    async ratingFor(date: string): Promise<DayRating | undefined> {
      return (await store.dayRatings.listBy("date", date))[0];
    },
  };
}

export type CheckInService = ReturnType<typeof createCheckInService>;
