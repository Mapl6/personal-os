import { toDateKey } from "@/lib/date";
import { createId } from "@/lib/utils/id";
import { goalSchema, type Goal, type GoalProgress, type Milestone } from "@/types/domain";
import { must, type ServiceContext } from "./context";

export type GoalInput = Pick<Goal, "title" | "period" | "metric" | "target" | "tracking"> &
  Partial<Pick<Goal, "description" | "unit" | "areaId" | "projectId" | "keyword" | "deadline" | "milestones">>;

export function createGoalService(ctx: ServiceContext) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();

  async function update(id: string, patch: Partial<GoalInput & { archived: boolean }>): Promise<Goal> {
    const goal = await must(store.goals.get(id), "Goal");
    return store.goals.put(goalSchema.parse({ ...goal, ...patch, updatedAt: iso() }));
  }

  return {
    async create(input: GoalInput): Promise<Goal> {
      const goal = goalSchema.parse({
        id: createId("goal"),
        description: "",
        unit: "",
        areaId: null,
        projectId: null,
        keyword: "",
        deadline: null,
        milestones: [],
        ...input,
        archived: false,
        createdAt: iso(),
        updatedAt: iso(),
      });
      return store.goals.put(goal);
    },
    update,
    async remove(id: string): Promise<void> {
      const progress = await store.goalProgress.listBy("goalId", id);
      await store.goalProgress.deleteMany(progress.map((p) => p.id));
      const tasks = (await store.tasks.list()).filter((t) => t.goalId === id);
      await store.tasks.putMany(tasks.map((t) => ({ ...t, goalId: null, milestoneId: null })));
      await store.goals.delete(id);
    },
    async logProgress(goalId: string, value: number, date?: string, note = ""): Promise<GoalProgress> {
      await must(store.goals.get(goalId), "Goal");
      const entry: GoalProgress = {
        id: createId("gp"),
        goalId,
        value,
        date: date ?? toDateKey(ctx.now()),
        note,
        createdAt: iso(),
      };
      return store.goalProgress.put(entry);
    },
    async removeProgress(id: string) {
      await store.goalProgress.delete(id);
    },
    async addMilestone(goalId: string, title: string): Promise<Goal> {
      const goal = await must(store.goals.get(goalId), "Goal");
      const milestone: Milestone = { id: createId("ms"), title, done: false, dueDate: null };
      return update(goalId, { milestones: [...goal.milestones, milestone] });
    },
    async toggleMilestone(goalId: string, milestoneId: string): Promise<Goal> {
      const goal = await must(store.goals.get(goalId), "Goal");
      return update(goalId, {
        milestones: goal.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m)),
      });
    },
    async removeMilestone(goalId: string, milestoneId: string): Promise<Goal> {
      const goal = await must(store.goals.get(goalId), "Goal");
      return update(goalId, { milestones: goal.milestones.filter((m) => m.id !== milestoneId) });
    },
  };
}

export type GoalService = ReturnType<typeof createGoalService>;
