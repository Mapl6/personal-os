import { isInRange, monthRange, weekRange, type DateKey, type DateRange, type WeekdayIndex } from "@/lib/date";
import { collectWork } from "@/lib/analytics/work";
import type { Goal, GoalProgress, ScheduleBlock, Task, TimeEntry } from "@/types/domain";

export interface GoalProgressResult {
  goal: Goal;
  range: DateRange;
  current: number;
  target: number;
  percent: number;
  unitLabel: string;
  /** Formatted "6 / 8 h" style label. */
  label: string;
}

export function goalRange(goal: Goal, reference: DateKey, weekStartsOn: WeekdayIndex): DateRange {
  switch (goal.period) {
    case "daily":
      return { from: reference, to: reference };
    case "weekly":
      return weekRange(reference, weekStartsOn);
    case "monthly":
      return monthRange(reference);
    case "long_term":
      // Long-term goals accumulate over all history.
      return { from: "0000-01-01", to: "9999-12-31" };
  }
}

export function matchesGoal(goal: Pick<Goal, "id" | "areaId" | "projectId" | "keyword">, task: Task): boolean {
  if (task.goalId === goal.id) return true;
  const hasFilter = goal.areaId || goal.projectId || goal.keyword.trim();
  if (!hasFilter) return false;
  if (goal.areaId && task.areaId !== goal.areaId) return false;
  if (goal.projectId && task.projectId !== goal.projectId) return false;
  const kw = goal.keyword.trim().toLowerCase();
  if (kw) {
    const haystack = [task.title, ...task.tags].join(" ").toLowerCase();
    if (!haystack.includes(kw)) return false;
  }
  return true;
}

export function unitLabel(goal: Pick<Goal, "metric" | "unit">): string {
  switch (goal.metric) {
    case "hours":
      return "h";
    case "tasks":
      return "tasks";
    case "sessions":
      return "sessions";
    case "pages":
      return "pages";
    case "custom":
      return goal.unit || "units";
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function computeGoalProgress(
  goal: Goal,
  reference: DateKey,
  weekStartsOn: WeekdayIndex,
  data: {
    tasks: readonly Task[];
    blocks: readonly ScheduleBlock[];
    entries: readonly TimeEntry[];
    progress: readonly GoalProgress[];
  },
  now: Date = new Date(),
): GoalProgressResult {
  const range = goalRange(goal, reference, weekStartsOn);
  let current = 0;

  if (goal.tracking === "auto") {
    const matching = new Set(data.tasks.filter((t) => matchesGoal(goal, t)).map((t) => t.id));
    switch (goal.metric) {
      case "hours": {
        const minutes = collectWork(data.blocks, data.entries, range, now)
          .filter((r) => matching.has(r.taskId))
          .reduce((s, r) => s + r.minutes, 0);
        current = minutes / 60;
        break;
      }
      case "sessions":
        current = data.blocks.filter(
          (b) => b.status === "completed" && matching.has(b.taskId) && isInRange(b.date, range),
        ).length;
        break;
      case "tasks": {
        const recurring = new Set(data.tasks.filter((t) => t.recurrence).map((t) => t.id));
        current =
          data.tasks.filter(
            (t) =>
              matching.has(t.id) &&
              !t.recurrence &&
              t.status === "completed" &&
              t.completedAt &&
              isInRange(t.completedAt.slice(0, 10), range),
          ).length +
          data.blocks.filter(
            (b) => b.status === "completed" && recurring.has(b.taskId) && matching.has(b.taskId) && isInRange(b.date, range),
          ).length;
        break;
      }
      default:
        break; // pages/custom are always logged manually
    }
  }
  // Manual log entries always add (also usable as adjustments for auto goals).
  current += data.progress
    .filter((p) => p.goalId === goal.id && isInRange(p.date, range))
    .reduce((s, p) => s + p.value, 0);

  current = round1(current);
  const target = goal.target;
  const unit = unitLabel(goal);
  return {
    goal,
    range,
    current,
    target,
    percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
    unitLabel: unit,
    label: `${current} / ${target}${unit === "h" ? "h" : ` ${unit}`}`,
  };
}
