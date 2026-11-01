import { createId } from "@/lib/utils/id";
import { createTrashService } from "./trash-service";
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
        habitSchema.parse({ id: createId("habit"), color: "slate", ...input, archived: false, order: count, createdAt: iso(), updatedAt: iso() }),
      );
    },
    async update(id: string, patch: Partial<HabitInput & { archived: boolean; order: number }>): Promise<Habit> {
      const habit = await must(store.habits.get(id), "Habit");
      return store.habits.put(habitSchema.parse({ ...habit, ...patch, updatedAt: iso() }));
    },
    /** Moves the habit and its history to the trash. */
    async remove(id: string) {
      const habit = await must(store.habits.get(id), "Habit");
      const entries = await store.habitEntries.listBy("habitId", id);
      return createTrashService(ctx).moveToTrash({
        type: "habit",
        entityId: id,
        title: habit.name,
        rows: [{ collection: "habits", row: habit }, ...entries.map((r) => ({ collection: "habitEntries" as const, row: r }))],
      });
    },
    /** Toggles completion for a date. Returns the new done state. */
    async toggle(habitId: string, date: string): Promise<boolean> {
      const entries = await store.habitEntries.listBy("habitId", habitId);
      const existing = entries.find((e) => e.date === date);
      if (existing) {
        await store.habitEntries.delete(existing.id);
        return false;
      }
      await store.habitEntries.put({ id: createId("he"), habitId, date, createdAt: iso(), updatedAt: iso() });
      return true;
    },
  };
}

export type HabitService = ReturnType<typeof createHabitService>;
