import { describe, expect, it } from "vitest";
import { computeGoalProgress } from "@/lib/goals/progress";
import type { Goal, ScheduleBlock, Task } from "@/types/domain";

const baseTask: Task = {
  id: "t1",
  title: "Task",
  description: "",
  notes: "",
  status: "completed",
  priority: "medium",
  areaId: null,
  projectId: null,
  goalId: "g1",
  milestoneId: null,
  tags: [],
  estimatedMinutes: 60,
  dueDate: null,
  recurrence: null,
  dependencies: [],
  subtasks: [],
  createdAt: "2026-09-24T00:00:00",
  updatedAt: "2026-09-24T00:00:00",
  completedAt: null,
};
const task = (overrides: Partial<Task>): Task => ({ ...baseTask, ...overrides });

const baseGoal: Goal = {
  id: "g1",
  title: "Goal",
  description: "",
  period: "daily",
  metric: "hours",
  unit: "",
  target: 8,
  tracking: "auto",
  areaId: null,
  projectId: null,
  keyword: "",
  deadline: null,
  milestones: [],
  archived: false,
  createdAt: "2026-09-24T00:00:00",
  updatedAt: "2026-09-24T00:00:00",
};
const goal = (overrides: Partial<Goal>): Goal => ({ ...baseGoal, ...overrides });

const baseBlock: ScheduleBlock = {
  id: "b1",
  taskId: "t1",
  date: "2026-09-24",
  startMinutes: 540,
  durationMinutes: 60,
  status: "completed",
  actualMinutes: null,
  originalDate: "2026-09-24",
  rescheduleCount: 0,
  occurrenceDate: null,
  completedAt: null,
  createdAt: "2026-09-24T00:00:00",
  updatedAt: "2026-09-24T00:00:00",
};
const block = (overrides: Partial<ScheduleBlock>): ScheduleBlock => ({ ...baseBlock, ...overrides });

const emptyData = {
  tasks: [task({})],
  blocks: [] as ScheduleBlock[],
  entries: [],
  progress: [],
};

describe("goal progress label", () => {
  it("uses a space before every unit, matching the documented \"6 / 8 h\" format", () => {
    const data = {
      ...emptyData,
      blocks: [block({ actualMinutes: 120 })],
    };
    const label = computeGoalProgress(goal({ metric: "hours" }), "2026-09-24", 1, data).label;
    expect(label).toBe("2 / 8 h");
  });

  it("keeps the space for non-hour units", () => {
    const g = goal({ metric: "tasks", target: 3 });
    const t = task({ status: "completed", completedAt: "2026-09-24T18:00:00" });
    const data = { ...emptyData, tasks: [t] };
    expect(computeGoalProgress(g, "2026-09-24", 1, data).label).toBe("1 / 3 tasks");
  });
});
