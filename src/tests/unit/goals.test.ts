import { describe, expect, it } from "vitest";
import {
  computeGoalProgress,
  goalRange,
  matchesGoal,
  unitLabel,
} from "@/lib/goals/progress";
import type { Goal, GoalProgress, ScheduleBlock, Task, TimeEntry } from "@/types/domain";

const baseTask: Task = {
  id: "t1",
  title: "Task",
  description: "",
  notes: "",
  status: "completed",
  priority: "medium",
  areaId: null,
  projectId: null,
  goalId: null,
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
  period: "weekly",
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
  date: "2026-09-22",
  startMinutes: 540,
  durationMinutes: 60,
  status: "completed",
  actualMinutes: null,
  originalDate: "2026-09-22",
  rescheduleCount: 0,
  occurrenceDate: null,
  completedAt: null,
  createdAt: "2026-09-22T00:00:00",
  updatedAt: "2026-09-22T00:00:00",
};
const block = (overrides: Partial<ScheduleBlock>): ScheduleBlock => ({ ...baseBlock, ...overrides });

const baseEntry: TimeEntry = {
  id: "e1",
  taskId: "t1",
  blockId: null,
  date: "2026-09-22",
  start: "2026-09-22T09:00:00",
  end: "2026-09-22T10:00:00",
  durationMinutes: 60,
  source: "manual",
  endReason: "stop",
  note: "",
};
const entry = (overrides: Partial<TimeEntry>): TimeEntry => ({ ...baseEntry, ...overrides });

const progress = (overrides: Partial<GoalProgress>): GoalProgress => ({
  id: "p1",
  goalId: "g1",
  date: "2026-09-22",
  value: 1,
  note: "",
  createdAt: "2026-09-22T00:00:00",
  ...overrides,
});

const emptyData = { tasks: [] as Task[], blocks: [] as ScheduleBlock[], entries: [] as TimeEntry[], progress: [] as GoalProgress[] };

describe("goalRange", () => {
  it("covers a single day for daily goals", () => {
    expect(goalRange(goal({ period: "daily" }), "2026-09-24", 1)).toEqual({ from: "2026-09-24", to: "2026-09-24" });
  });

  it("covers the Monday-start week containing the reference", () => {
    // 2026-09-24 is a Thursday; with weekStartsOn=1 the week is Mon 21 – Sun 27.
    expect(goalRange(goal({ period: "weekly" }), "2026-09-24", 1)).toEqual({ from: "2026-09-21", to: "2026-09-27" });
  });

  it("covers the calendar month for monthly goals", () => {
    expect(goalRange(goal({ period: "monthly" }), "2026-09-24", 1)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("covers all history for long-term goals", () => {
    expect(goalRange(goal({ period: "long_term" }), "2026-09-24", 1)).toEqual({ from: "0000-01-01", to: "9999-12-31" });
  });
});

describe("matchesGoal", () => {
  it("matches by direct goalId", () => {
    expect(matchesGoal(goal({ id: "g1" }), task({ goalId: "g1" }))).toBe(true);
  });

  it("rejects tasks with no filter to match against", () => {
    expect(matchesGoal(goal({ id: "g1", areaId: null, projectId: null, keyword: "" }), task({}))).toBe(false);
  });

  it("matches and rejects on areaId", () => {
    const g = goal({ areaId: "a1" });
    expect(matchesGoal(g, task({ areaId: "a1" }))).toBe(true);
    expect(matchesGoal(g, task({ areaId: "a2" }))).toBe(false);
  });

  it("matches and rejects on projectId", () => {
    const g = goal({ projectId: "p9" });
    expect(matchesGoal(g, task({ projectId: "p9" }))).toBe(true);
    expect(matchesGoal(g, task({ projectId: "p8" }))).toBe(false);
  });

  it("matches the keyword case-insensitively in title and tags", () => {
    const g = goal({ keyword: "GYM" });
    expect(matchesGoal(g, task({ title: "gym session" }))).toBe(true);
    expect(matchesGoal(g, task({ title: "Run", tags: ["Gym"] }))).toBe(true);
    expect(matchesGoal(g, task({ title: "Read a book", tags: ["reading"] }))).toBe(false);
  });

  it("requires every set filter to match", () => {
    const g = goal({ areaId: "a1", keyword: "gym" });
    expect(matchesGoal(g, task({ areaId: "a1", title: "gym" }))).toBe(true);
    expect(matchesGoal(g, task({ areaId: "a1", title: "read" }))).toBe(false);
    expect(matchesGoal(g, task({ areaId: "a2", title: "gym" }))).toBe(false);
  });
});

describe("unitLabel", () => {
  it("labels each metric", () => {
    expect(unitLabel(goal({ metric: "hours" }))).toBe("h");
    expect(unitLabel(goal({ metric: "tasks" }))).toBe("tasks");
    expect(unitLabel(goal({ metric: "sessions" }))).toBe("sessions");
    expect(unitLabel(goal({ metric: "pages" }))).toBe("pages");
  });

  it("uses the custom unit, falling back to units", () => {
    expect(unitLabel(goal({ metric: "custom", unit: "km" }))).toBe("km");
    expect(unitLabel(goal({ metric: "custom", unit: "" }))).toBe("units");
  });
});

describe("computeGoalProgress", () => {
  it("sums completed block time for auto hours goals", () => {
    // Weekly goal, reference Thursday 2026-09-24 → range Mon 21 – Sun 27.
    const g = goal({ id: "g1", period: "weekly", metric: "hours", tracking: "auto", target: 8 });
    const t = task({ id: "t1", goalId: "g1" });
    const data = {
      ...emptyData,
      tasks: [t],
      blocks: [block({ id: "b1", taskId: "t1", date: "2026-09-22", actualMinutes: 120 })],
    };
    const r = computeGoalProgress(g, "2026-09-24", 1, data);
    expect(r.current).toBe(2);
    expect(r.target).toBe(8);
    expect(r.percent).toBe(25);
    expect(r.unitLabel).toBe("h");
  });

  it("rounds fractional hours to one decimal", () => {
    const g = goal({ id: "g1", period: "daily", metric: "hours", tracking: "auto", target: 8 });
    const data = {
      ...emptyData,
      tasks: [task({ id: "t1", goalId: "g1" })],
      blocks: [block({ id: "b1", taskId: "t1", date: "2026-09-24", actualMinutes: 20 })],
    };
    expect(computeGoalProgress(g, "2026-09-24", 1, data).current).toBe(0.3);
  });

  it("caps the percent at 100 and handles a zero target", () => {
    const g = goal({ id: "g1", period: "daily", metric: "hours", tracking: "auto", target: 2 });
    const data = {
      ...emptyData,
      tasks: [task({ id: "t1", goalId: "g1" })],
      blocks: [block({ id: "b1", taskId: "t1", date: "2026-09-24", actualMinutes: 180 })],
    };
    expect(computeGoalProgress(g, "2026-09-24", 1, data).percent).toBe(100);
    expect(computeGoalProgress(goal({ ...g, target: 0 }), "2026-09-24", 1, data).percent).toBe(0);
  });

  it("counts completed sessions from blocks in range", () => {
    const g = goal({ id: "g1", period: "daily", metric: "sessions", tracking: "auto", target: 4 });
    const data = {
      ...emptyData,
      tasks: [task({ id: "t1", goalId: "g1" })],
      blocks: [
        block({ id: "b1", taskId: "t1", date: "2026-09-24", status: "completed" }),
        block({ id: "b2", taskId: "t1", date: "2026-09-24", status: "completed" }),
        block({ id: "b3", taskId: "t1", date: "2026-09-24", status: "planned" }),
        block({ id: "b4", taskId: "t1", date: "2026-09-20", status: "completed" }),
      ],
    };
    const r = computeGoalProgress(g, "2026-09-24", 1, data);
    expect(r.current).toBe(2);
    expect(r.percent).toBe(50);
  });

  it("counts tasks from completed tasks and completed recurring blocks", () => {
    const g = goal({ id: "g1", period: "daily", metric: "tasks", tracking: "auto", target: 3 });
    const t2 = task({
      id: "t2",
      goalId: "g1",
      status: "completed",
      completedAt: "2026-09-24T18:00:00",
    });
    const t3 = task({
      id: "t3",
      goalId: "g1",
      status: "completed",
      completedAt: "2026-09-24T09:00:00",
      recurrence: { frequency: "daily", interval: 1, weekdays: [], dayOfMonth: null, startDate: "2026-09-24", endDate: null, startMinutes: null },
    });
    const data = {
      ...emptyData,
      tasks: [t2, t3],
      // Recurring completions are counted once, from their blocks — not from the task.
      blocks: [block({ id: "b9", taskId: "t3", date: "2026-09-24", status: "completed" })],
    };
    const r = computeGoalProgress(g, "2026-09-24", 1, data);
    expect(r.current).toBe(2);
    expect(r.percent).toBe(67);
    expect(r.label).toBe("2 / 3 tasks");
  });

  it("ignores completed tasks outside the range", () => {
    const g = goal({ id: "g1", period: "daily", metric: "tasks", tracking: "auto", target: 3 });
    const data = {
      ...emptyData,
      tasks: [task({ id: "t1", goalId: "g1", status: "completed", completedAt: "2026-09-23T18:00:00" })],
    };
    expect(computeGoalProgress(g, "2026-09-24", 1, data).current).toBe(0);
  });

  it("sums manual entries in range for manual goals; pages get no auto contribution", () => {
    const g = goal({ id: "g1", period: "weekly", metric: "pages", tracking: "manual", target: 20 });
    const data = {
      ...emptyData,
      tasks: [task({ id: "t1", goalId: "g1" })],
      blocks: [block({ id: "b1", taskId: "t1", date: "2026-09-22", actualMinutes: 120 })],
      progress: [
        progress({ id: "p1", date: "2026-09-21", value: 5 }),
        progress({ id: "p2", date: "2026-09-22", value: 7 }),
        progress({ id: "p3", date: "2026-09-10", value: 100 }),
        progress({ id: "p4", goalId: "g2", date: "2026-09-22", value: 9 }),
      ],
    };
    const r = computeGoalProgress(g, "2026-09-24", 1, data);
    expect(r.current).toBe(12);
    expect(r.percent).toBe(60);
    expect(r.label).toBe("12 / 20 pages");
  });

  it("adds manual entries as adjustments on top of auto progress", () => {
    const g = goal({ id: "g1", period: "daily", metric: "hours", tracking: "auto", target: 8 });
    const data = {
      ...emptyData,
      tasks: [task({ id: "t1", goalId: "g1" })],
      blocks: [block({ id: "b1", taskId: "t1", date: "2026-09-24", actualMinutes: 120 })],
      progress: [progress({ id: "p1", date: "2026-09-24", value: 1.5 })],
    };
    expect(computeGoalProgress(g, "2026-09-24", 1, data).current).toBe(3.5);
  });

  it("counts timer entries not attached to a completed block once", () => {
    const g = goal({ id: "g1", period: "daily", metric: "hours", tracking: "auto", target: 8 });
    const data = {
      ...emptyData,
      tasks: [task({ id: "t1", goalId: "g1" })],
      blocks: [block({ id: "b1", taskId: "t1", date: "2026-09-24", actualMinutes: 60 })],
      entries: [
        entry({ id: "e1", blockId: "b1", durationMinutes: 60 }), // attached → already in the block
        entry({ id: "e2", blockId: null, date: "2026-09-24", durationMinutes: 30 }),
      ],
    };
    expect(computeGoalProgress(g, "2026-09-24", 1, data).current).toBe(1.5);
  });
});
