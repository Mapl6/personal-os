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
/** Placeholder `updatedAt` for rows written before the field existed (filled by migration 2). */
export const EPOCH = "1970-01-01T00:00:00.000Z";

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
  updatedAt: isoDateTime.default(EPOCH),
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
  updatedAt: isoDateTime.default(EPOCH),
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
  updatedAt: isoDateTime.default(EPOCH),
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
  updatedAt: isoDateTime.default(EPOCH),
});
export type Habit = z.infer<typeof habitSchema>;

export const habitEntrySchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: dateKey,
  createdAt: isoDateTime,
  updatedAt: isoDateTime.default(EPOCH),
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
export const ACCENTS = ["cyan", "indigo", "emerald", "sky", "amber", "rose", "violet"] as const;
export type Accent = (typeof ACCENTS)[number];

export const CALENDAR_SYSTEMS = ["gregorian", "jalali"] as const;
export type CalendarSystem = (typeof CALENDAR_SYSTEMS)[number];

export const calendarSettingsSchema = z.object({
  /** Gregorian or Solar Hijri (Shamsi / Jalali). Affects display, month boundaries and date pickers. */
  system: z.enum(CALENDAR_SYSTEMS).default("gregorian"),
  /** Language used for month and weekday names. */
  language: z.enum(["en", "fa"]).default("en"),
  digits: z.enum(["latin", "persian"]).default("latin"),
  timeFormat: z.enum(["24h", "12h"]).default("24h"),
});
export type CalendarSettings = z.infer<typeof calendarSettingsSchema>;
export const DEFAULT_CALENDAR: CalendarSettings = calendarSettingsSchema.parse({});

export const DASHBOARD_WIDGETS = [
  "progress",
  "schedule",
  "weeklyGoals",
  "monthlyGoals",
  "stats",
  "focus",
  "next",
  "habits",
  "areas",
] as const;
export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];

export const reviewQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
});
export type ReviewQuestionSetting = z.infer<typeof reviewQuestionSchema>;

export const customizationSchema = z.object({
  /** Sidebar order (hrefs). Missing items are appended in default order. */
  navOrder: z.array(z.string()).default([]),
  hiddenNav: z.array(z.string()).default([]),
  dashboardWidgets: z
    .array(z.object({ id: z.enum(DASHBOARD_WIDGETS), visible: z.boolean() }))
    .default(DASHBOARD_WIDGETS.map((id) => ({ id, visible: id !== "monthlyGoals" }))),
  /** Custom review questions per type; null = built-in defaults. */
  reviewQuestions: z
    .object({
      daily: z.array(reviewQuestionSchema),
      weekly: z.array(reviewQuestionSchema),
      monthly: z.array(reviewQuestionSchema),
    })
    .nullable()
    .default(null),
  defaultAreaId: z.string().nullable().default(null),
  defaultPriority: z.enum(PRIORITIES).default("medium"),
  /** Timeline zoom: pixel height of one hour. */
  hourHeight: z.number().int().min(32).max(140).default(56),
  /** Show the anytime row and completed blocks in timelines. */
  showCompletedInTimeline: z.boolean().default(true),
  /** Custom display names for priorities. */
  priorityLabels: z
    .object({ low: z.string().max(20), medium: z.string().max(20), high: z.string().max(20), critical: z.string().max(20) })
    .default({ low: "Low", medium: "Medium", high: "High", critical: "Critical" }),
});
export type Customization = z.infer<typeof customizationSchema>;

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
  accent: z.enum(ACCENTS).default("cyan"),
  /** Bumped when a design-system change needs a one-time settings migration. */
  appearanceVersion: z.number().int().min(0).default(0),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  calendar: calendarSettingsSchema.default(DEFAULT_CALENDAR),
  /** Feature toggles: featureId → enabled. Missing = the registry default. */
  features: z.record(z.string(), z.boolean()).default({}),
  /** Set once the browser has been asked to keep local data (navigator.storage.persist). */
  storagePersistAsked: z.boolean().default(false),
  customization: customizationSchema.default(customizationSchema.parse({})),
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

// ================================================================ Phase 1: foundation

// ---------------------------------------------------------------- References
/** Anything that can be linked to, mentioned or trashed. For "day" the id is a date key. */
export const ENTITY_TYPES = [
  "page",
  "task",
  "project",
  "area",
  "goal",
  "habit",
  "inbox",
  "day",
  "review",
  "template",
  "attachment",
  "tag",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const entityRefSchema = z.object({ type: z.enum(ENTITY_TYPES), id: z.string() });
export type EntityRef = z.infer<typeof entityRefSchema>;

export const refKey = (ref: EntityRef) => `${ref.type}:${ref.id}`;

// ---------------------------------------------------------------- Trash
/**
 * A deleted entity together with everything that was removed or detached with
 * it (a task's blocks and time entries, a project's task links…). Restoring a
 * bundle puts all of it back in one step. Bundles are purged after 30 days.
 */
export const trashItemSchema = z.object({
  id: z.string(),
  type: z.enum(ENTITY_TYPES),
  entityId: z.string(),
  title: z.string(),
  deletedAt: isoDateTime,
  /** Rows removed from their collections, re-inserted on restore. */
  rows: z.array(z.object({ collection: z.string(), row: z.record(z.string(), z.unknown()) })),
  /** Foreign keys cleared on other rows (e.g. tasks detached from a deleted project), re-set on restore if still empty. */
  relinks: z
    .array(z.object({ collection: z.string(), id: z.string(), field: z.string(), value: z.unknown() }))
    .default([]),
});
export type TrashItem = z.infer<typeof trashItemSchema>;
export const TRASH_RETENTION_DAYS = 30;

// ---------------------------------------------------------------- Inbox & attachments
export const INBOX_KINDS = ["text", "link", "image", "file"] as const;
export const INBOX_SOURCES = ["app", "share", "paste", "brain_dump", "import"] as const;

export const inboxItemSchema = z.object({
  id: z.string(),
  kind: z.enum(INBOX_KINDS),
  text: z.string().max(20000).default(""),
  url: z.string().nullable().default(null),
  attachmentIds: z.array(z.string()).default([]),
  source: z.enum(INBOX_SOURCES).default("app"),
  status: z.enum(["new", "processed", "archived"]).default("new"),
  /** Where it went when processed. */
  processedTo: entityRefSchema.nullable().default(null),
  /** Set when processing failed, so nothing is silently lost. */
  error: z.string().nullable().default(null),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type InboxItem = z.infer<typeof inboxItemSchema>;

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mime: z.string(),
  size: z.number().int().min(0),
  /** SHA-256 of the bytes: dedupes identical files. */
  sha256: z.string(),
  /** The bytes. Stored as a Blob in IndexedDB; exported as a data URL. */
  blob: z.custom<Blob>((v) => typeof Blob !== "undefined" && v instanceof Blob),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Attachment = z.infer<typeof attachmentSchema>;
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

// ---------------------------------------------------------------- Check-ins
export const MOODS = [1, 2, 3, 4, 5] as const;

/** A quick mood (and optional energy) log; several per day are fine. */
export const checkInSchema = z.object({
  id: z.string(),
  date: dateKey,
  at: isoDateTime,
  mood: z.number().int().min(1).max(5).nullable().default(null),
  energy: z.number().int().min(1).max(5).nullable().default(null),
  note: z.string().max(2000).default(""),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type CheckIn = z.infer<typeof checkInSchema>;

/** One overall rating per day. */
export const dayRatingSchema = z.object({
  id: z.string(),
  date: dateKey,
  rating: z.number().int().min(1).max(5),
  note: z.string().max(2000).default(""),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type DayRating = z.infer<typeof dayRatingSchema>;

// ---------------------------------------------------------------- Pages
export const PAGE_KINDS = ["page", "daily", "weekly", "monthly", "template"] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export const pageSchema = z.object({
  id: z.string(),
  title: z.string().max(300).default(""),
  /** Emoji. */
  icon: z.string().nullable().default(null),
  kind: z.enum(PAGE_KINDS).default("page"),
  /** For period notes: the period start (Gregorian key). Unique per (kind, periodStart). */
  periodStart: dateKey.nullable().default(null),
  parentId: z.string().nullable().default(null),
  /** Fractional order key among siblings. */
  order: z.string().default("a0"),
  areaId: z.string().nullable().default(null),
  projectId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  favourite: z.boolean().default(false),
  lastOpenedAt: isoDateTime.nullable().default(null),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Page = z.infer<typeof pageSchema>;

/**
 * Page body, stored apart from metadata because it is large and changes often.
 * `doc` is the editor's block JSON; `text` and `outline` are derived on save
 * for search, links and snippets.
 */
export const pageContentSchema = z.object({
  /** Same as the page id. */
  id: z.string(),
  doc: z.array(z.unknown()).default([]),
  text: z.string().default(""),
  outline: z.array(z.object({ id: z.string(), type: z.string(), text: z.string() })).default([]),
  updatedAt: isoDateTime,
});
export type PageContent = z.infer<typeof pageContentSchema>;

// ---------------------------------------------------------------- Links
export const LINK_KINDS = ["wikilink", "mention", "tag", "task"] as const;

/** Derived from content by the link indexer — never edited directly. */
export const linkSchema = z.object({
  id: z.string(),
  /** `type:id` of the source, indexed. */
  fromKey: z.string(),
  from: entityRefSchema,
  fromBlockId: z.string().nullable().default(null),
  /** `type:id` of the target, indexed (backlinks query this). */
  toKey: z.string(),
  to: entityRefSchema,
  kind: z.enum(LINK_KINDS),
  /** Text around the link, for backlink snippets. */
  context: z.string().default(""),
});
export type Link = z.infer<typeof linkSchema>;
