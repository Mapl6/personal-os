import { createId } from "@/lib/utils/id";
import { habitSchema, type Habit } from "@/types/domain";
import { must, type ServiceContext } from "./context";

export type HabitInput = Pick<Habit, "name" | "weekdays"> & Partial<Pick<Habit, "color">>;

export function createHabitService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();
  return {
    async create(input: HabitInput): Promise<Habit> {
      const count = (await store.habits.list()).length;
      return store.habits.put(
        habitSchema.parse({ id: createId("habit"), color: "slate", ...input, archived: false, order: count, createdAt: iso() }),
      );
    },
    async update(id: string, patch: Partial<HabitInput & { archived: boolean }>): Promise<Habit> {
      const habit = await must(store.habits.get(id), "Habit");
      return store.habits.put(habitSchema.parse({ ...habit, ...patch }));
    },
    async remove(id: string) {
      const entries = await store.habitEntries.listBy("habitId", id);
      await store.habitEntries.deleteMany(entries.map((e) => e.id));
      await store.habits.delete(id);
    },
    /** Toggles completion for a date. Returns the new done state. */
    async toggle(habitId: string, date: string): Promise<boolean> {
      const entries = await store.habitEntries.listBy("habitId", habitId);
      const existing = entries.find((e) => e.date === date);
      if (existing) {
        await store.habitEntries.delete(existing.id);
        return false;
      }
      await store.habitEntries.put({ id: createId("he"), habitId, date, createdAt: iso() });
      return true;
    },
  };
}

export type HabitService = ReturnType<typeof createHabitService>;
