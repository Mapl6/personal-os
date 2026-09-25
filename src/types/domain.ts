import { z } from "zod";

/**
 * Domain model.
 *
 * Key distinction: a `Task` is the *work*; a `ScheduleBlock` (task instance) is
 * *when* that work is planned. A task can have zero, one or many blocks
 * (e.g. "Frontend learning 2h" split into 1h today + 1h tomorrow), so moving,
 * splitting or rescheduling never duplicates the task itself.
 */

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-MM-dd");
const isoDateTime = z.string().min(1);
const minutes = z.number().int().min(0).max(24 * 60 * 7);

export const AREA_COLORS = [
  "indigo",
  "sky",
  "emerald",
  "amber",
  "rose",
  "violet",
  "teal",
  "slate",
] as const;
export type AreaColor = (typeof AREA_COLORS)[number];

// ---------------------------------------------------------------- Area
export const areaSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  color: z.enum(AREA_COLORS),
  description: z.string().max(500).default(""),
  /** Words that map Quick Add input to this area (e.g. "react", "gym"). */
  keywords: z.array(z.string()).default([]),
  order: z.number().default(0),
  archived: z.boolean().default(false),
  createdAt: isoDateTime,
});
export type Area = z.infer<typeof areaSchema>;

// ---------------------------------------------------------------- Project
export const PROJECT_STATUSES = ["active", "paused", "completed", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  description: z.string().max(2000).default(""),
  areaId: z.string().nullable(),
  status: z.enum(PROJECT_STATUSES).default("active"),
  deadline: dateKey.nullable().default(null),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Project = z.infer<typeof projectSchema>;

// ---------------------------------------------------------------- Task
export const TASK_STATUSES = [
  "inbox",
  "planned",
  "in_progress",
  "completed",
  "skipped",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const recurrenceSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  /** Every N days/weeks/months. */
  interval: z.number().int().min(1).max(12).default(1),
  /** For weekly: which weekdays (0=Sun). Empty = same weekday as start. */
  weekdays: z.array(z.number().int().min(0).max(6)).default([]),
  /** For monthly: day of month (1-31). */
  dayOfMonth: z.number().int().min(1).max(31).nullable().default(null),
  startDate: dateKey,
  endDate: dateKey.nullable().default(null),
  /** Default time-of-day for generated blocks; null = anytime that day. */
  startMinutes: z.number().int().min(0).max(1439).nullable().default(null),
});
export type Recurrence = z.infer<typeof recurrenceSchema>;

export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  done: z.boolean().default(false),
});
export type Subtask = z.infer<typeof subtaskSchema>;

export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  notes: z.string().max(10000).default(""),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES).default("medium"),
  areaId: z.string().nullable().default(null),
  projectId: z.string().nullable().default(null),
  goalId: z.string().nullable().default(null),
  milestoneId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  estimatedMinutes: minutes.default(60),
  dueDate: dateKey.nullable().default(null),
  recurrence: recurrenceSchema.nullable().default(null),
  dependencies: z.array(z.string()).default([]),
  subtasks: z.array(subtaskSchema).default([]),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  completedAt: isoDateTime.nullable().default(null),
});
export type Task = z.infer<typeof taskSchema>;

// ---------------------------------------------------------------- ScheduleBlock (TaskInstance)
export const BLOCK_STATUSES = ["planned", "completed", "skipped"] as const;
export type BlockStatus = (typeof BLOCK_STATUSES)[number];

export const scheduleBlockSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  date: dateKey,
  /** Minutes from local midnight; null = "anytime" on that date. */
  startMinutes: z.number().int().min(0).max(1439).nullable(),
  durationMinutes: z.number().int().min(5).max(24 * 60),
  status: z.enum(BLOCK_STATUSES).default("planned"),
  /** Actual duration recorded on completion (tracked or confirmed by user). */
  actualMinutes: z.number().int().min(0).nullable().default(null),
  /** Where the block was first planned — lets us count moves without judging them. */
  originalDate: dateKey,
  rescheduleCount: z.number().int().min(0).default(0),
  /** For recurring tasks: the occurrence this block materialises (prevents duplicates). */
  occurrenceDate: dateKey.nullable().default(null),
  completedAt: isoDateTime.nullable().default(null),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type ScheduleBlock = z.infer<typeof scheduleBlockSchema>;

// ---------------------------------------------------------------- TimeEntry
export const timeEntrySchema = z.object({
  id: z.string(),
  taskId: z.string(),
  blockId: z.string().nullable().default(null),
  /** Local date the entry is attributed to (derived from start). */
  date: dateKey,
  start: isoDateTime,
  /** null while the timer is running. */
  end: isoDateTime.nullable(),
  /** Stored duration; for running timers computed on the fly. */
  durationMinutes: z.number().min(0).default(0),
  source: z.enum(["timer", "manual"]),
  /** "pause" keeps the session resumable; "stop" ends it. */
  endReason: z.enum(["pause", "stop"]).nullable().default(null),
  note: z.string().default(""),
});
export type TimeEntry = z.infer<typeof timeEntrySchema>;

// ---------------------------------------------------------------- Goal
export const GOAL_PERIODS = ["daily", "weekly", "monthly", "long_term"] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];
export const GOAL_METRICS = ["hours", "tasks", "sessions", "pages", "custom"] as const;
export type GoalMetric = (typeof GOAL_METRICS)[number];

export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  done: z.boolean().default(false),
  dueDate: dateKey.nullable().default(null),
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const goalSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
  period: z.enum(GOAL_PERIODS),
  metric: z.enum(GOAL_METRICS),
  /** Display unit for custom metrics (e.g. "km"). */
  unit: z.string().max(20).default(""),
  target: z.number().min(0),
  /**
   * "auto" computes progress from completed blocks / tracked time that match
   * the area/project/keyword filter. "manual" sums GoalProgress entries.
   */
  tracking: z.enum(["auto", "manual"]),
  areaId: z.string().nullable().default(null),
  projectId: z.string().nullable().default(null),
  /** Optional case-insensitive keyword matched against task titles/tags (e.g. "gym"). */
  keyword: z.string().default(""),
  deadline: dateKey.nullable().default(null),
  milestones: z.array(milestoneSchema).default([]),
  archived: z.boolean().default(false),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Goal = z.infer<typeof goalSchema>;

export const goalProgressSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  date: dateKey,
  value: z.number(),
  note: z.string().default(""),
  createdAt: isoDateTime,
});
export type GoalProgress = z.infer<typeof goalProgressSchema>;

// ---------------------------------------------------------------- Habit
export const habitSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  /** Days the habit is expected on (0=Sun). All 7 = daily. */
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  color: z.enum(AREA_COLORS).default("slate"),
  archived: z.boolean().default(false),
  order: z.number().default(0),
  createdAt: isoDateTime,
});
export type Habit = z.infer<typeof habitSchema>;

export const habitEntrySchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: dateKey,
  createdAt: isoDateTime,
});
export type HabitEntry = z.infer<typeof habitEntrySchema>;

// ---------------------------------------------------------------- Review
export const REVIEW_TYPES = ["daily", "weekly", "monthly"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const reviewSchema = z.object({
  id: z.string(),
  type: z.enum(REVIEW_TYPES),
  /** First day of the reviewed period. */
  periodStart: dateKey,
  answers: z.record(z.string(), z.string()).default({}),
  /** 1–5 energy rating (daily reviews). */
  energy: z.number().int().min(1).max(5).nullable().default(null),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Review = z.infer<typeof reviewSchema>;

// ---------------------------------------------------------------- Weekly template
export const templateItemSchema = z.object({
  id: z.string(),
  weekday: z.number().int().min(0).max(6),
  title: z.string().min(1),
  areaId: z.string().nullable(),
  projectId: z.string().nullable().default(null),
  durationMinutes: z.number().int().min(5),
  startMinutes: z.number().int().min(0).max(1439).nullable().default(null),
});
export type TemplateItem = z.infer<typeof templateItemSchema>;

export const weekTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(60),
  items: z.array(templateItemSchema),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type WeekTemplate = z.infer<typeof weekTemplateSchema>;

// ---------------------------------------------------------------- Settings
export const ACCENTS = ["indigo", "emerald", "sky", "amber", "rose", "violet"] as const;
export type Accent = (typeof ACCENTS)[number];

export const settingsSchema = z.object({
  id: z.literal("settings"),
  name: z.string().max(60).default(""),
  onboarded: z.boolean().default(false),
  weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]).default(1),
  workingDays: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5, 6]),
  dayStartMinutes: z.number().int().min(0).max(1439).default(9 * 60),
  dayEndMinutes: z.number().int().min(0).max(1439).default(19 * 60),
  timeZone: z.string().default("UTC"),
  dateFormat: z.enum(["EEE, MMM d", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"]).default("EEE, MMM d"),
  defaultDurationMinutes: z.number().int().min(5).max(480).default(60),
  defaultBreakMinutes: z.number().int().min(0).max(120).default(15),
  dailyTargetMinutes: z.number().int().min(0).max(1440).default(8 * 60),
  theme: z.enum(["dark", "light", "system"]).default("dark"),
  accent: z.enum(ACCENTS).default("indigo"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  notifications: z
    .object({
      enabled: z.boolean().default(false),
      upcoming: z.boolean().default(true),
      leadMinutes: z.number().int().min(0).max(120).default(10),
      taskStart: z.boolean().default(true),
      overdue: z.boolean().default(true),
      dailyPlanning: z.boolean().default(true),
      dailyPlanningMinutes: z.number().int().min(0).max(1439).default(8 * 60 + 30),
      dailyReview: z.boolean().default(true),
      dailyReviewMinutes: z.number().int().min(0).max(1439).default(21 * 60),
      weeklyReview: z.boolean().default(true),
    })
    .default({
      enabled: false,
      upcoming: true,
      leadMinutes: 10,
      taskStart: true,
      overdue: true,
      dailyPlanning: true,
      dailyPlanningMinutes: 510,
      dailyReview: true,
      dailyReviewMinutes: 1260,
      weeklyReview: true,
    }),
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({ id: "settings" });
