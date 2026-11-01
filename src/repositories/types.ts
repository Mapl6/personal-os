import type {
  Attachment,
  CheckIn,
  DayRating,
  InboxItem,
  Link,
  Page,
  PageContent,
  TrashItem,
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

/** Small key/value store for app metadata (schema version, snapshots, search index…). */
export interface MetaRepository {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Row type of every collection. Adding a collection = one line here + one in COLLECTION_NAMES. */
export interface CollectionTypes {
  areas: Area;
  projects: Project;
  tasks: Task;
  blocks: ScheduleBlock;
  timeEntries: TimeEntry;
  goals: Goal;
  goalProgress: GoalProgress;
  habits: Habit;
  habitEntries: HabitEntry;
  reviews: Review;
  templates: WeekTemplate;
  // Phase 1
  trash: TrashItem;
  inbox: InboxItem;
  attachments: Attachment;
  checkIns: CheckIn;
  dayRatings: DayRating;
  pages: Page;
  pageContents: PageContent;
  links: Link;
}

export type DataStore = { [K in keyof CollectionTypes]: CollectionRepository<CollectionTypes[K]> } & {
  settings: SettingsRepository;
  meta: MetaRepository;
};

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
  "trash",
  "inbox",
  "attachments",
  "checkIns",
  "dayRatings",
  "pages",
  "pageContents",
  "links",
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
  trash: ["deletedAt"],
  inbox: ["status"],
  attachments: ["sha256"],
  checkIns: ["date"],
  dayRatings: ["date"],
  pages: ["parentId", "kind", "periodStart"],
  pageContents: [],
  links: ["fromKey", "toKey"],
};
