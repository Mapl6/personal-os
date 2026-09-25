import type {
  Area,
  Goal,
  GoalProgress,
  Habit,
  HabitEntry,
  Project,
  Review,
  ScheduleBlock,
  Settings,
  Task,
  TimeEntry,
  WeekTemplate,
} from "@/types/domain";

export interface Entity {
  id: string;
}

/**
 * Storage-agnostic collection repository. The UI never talks to storage
 * directly — services depend on this interface, so IndexedDB can later be
 * swapped for an HTTP/PostgreSQL implementation without touching components.
 */
export interface CollectionRepository<T extends Entity> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  /** Items whose `field` is within [from, to] (inclusive, string compare). */
  listByRange(field: IndexedField<T>, from: string, to: string): Promise<T[]>;
  listBy(field: IndexedField<T>, value: string): Promise<T[]>;
  put(item: T): Promise<T>;
  putMany(items: T[]): Promise<void>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
  clear(): Promise<void>;
}

export type IndexedField<T> = Extract<keyof T, string>;

export interface SettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<Settings>;
}

export interface DataStore {
  areas: CollectionRepository<Area>;
  projects: CollectionRepository<Project>;
  tasks: CollectionRepository<Task>;
  blocks: CollectionRepository<ScheduleBlock>;
  timeEntries: CollectionRepository<TimeEntry>;
  goals: CollectionRepository<Goal>;
  goalProgress: CollectionRepository<GoalProgress>;
  habits: CollectionRepository<Habit>;
  habitEntries: CollectionRepository<HabitEntry>;
  reviews: CollectionRepository<Review>;
  templates: CollectionRepository<WeekTemplate>;
  settings: SettingsRepository;
}

export const COLLECTION_NAMES = [
  "areas",
  "projects",
  "tasks",
  "blocks",
  "timeEntries",
  "goals",
  "goalProgress",
  "habits",
  "habitEntries",
  "reviews",
  "templates",
] as const;
export type CollectionName = (typeof COLLECTION_NAMES)[number];

/** Secondary indexes created by the IndexedDB implementation. */
export const COLLECTION_INDEXES: Record<CollectionName, string[]> = {
  areas: [],
  projects: ["areaId"],
  tasks: ["projectId", "areaId", "status"],
  blocks: ["date", "taskId"],
  timeEntries: ["date", "taskId"],
  goals: [],
  goalProgress: ["goalId", "date"],
  habits: [],
  habitEntries: ["habitId", "date"],
  reviews: ["type", "periodStart"],
  templates: [],
};
