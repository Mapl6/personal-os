import { addDaysKey, toDateKey, weekRange, weekdayOf, type DateKey, type WeekdayIndex } from "@/lib/date";
import { createId } from "@/lib/utils/id";
import type { Area, AreaColor, GoalMetric, ScheduleBlock, TimeEntry } from "@/types/domain";
import type { Services } from ".";

export interface DefaultArea {
  name: string;
  color: AreaColor;
  keywords: string[];
  description: string;
}

export const DEFAULT_AREAS: DefaultArea[] = [
  {
    name: "Frontend",
    color: "indigo",
    description: "Frontend learning and practice projects.",
    keywords: ["react", "typescript", "ts", "javascript", "js", "next", "nextjs", "next.js", "css", "testing", "frontend", "html"],
  },
  {
    name: "Startup + AI",
    color: "violet",
    description: "Building the startup, including AI features.",
    keywords: ["startup", "mvp", "ai", "backend", "database", "db", "product", "llm", "deploy", "marketing"],
  },
  {
    name: "Career",
    color: "sky",
    description: "Career moves, interviews, portfolio.",
    keywords: ["career", "interview", "resume", "cv", "linkedin", "portfolio"],
  },
  {
    name: "Health",
    color: "emerald",
    description: "Gym, yoga and recovery.",
    keywords: ["gym", "yoga", "run", "workout", "health", "walk", "stretch"],
  },
  {
    name: "Personal",
    color: "amber",
    description: "Books, errands and personal time.",
    keywords: ["book", "read", "reading", "journal", "personal", "family", "errand"],
  },
  {
    name: "Entertainment",
    color: "rose",
    description: "Games, movies and fun — rest is part of the plan.",
    keywords: ["movie", "game", "games", "series", "film", "watch", "play"],
  },
];

export interface WeeklyGoalSetup {
  areaName: string;
  metric: Extract<GoalMetric, "hours" | "sessions">;
  target: number;
  keyword?: string;
  title?: string;
}

export const DEFAULT_WEEKLY_GOALS: WeeklyGoalSetup[] = [
  { areaName: "Frontend", metric: "hours", target: 8 },
  { areaName: "Startup + AI", metric: "hours", target: 8 },
  { areaName: "Health", metric: "sessions", target: 2, keyword: "gym", title: "Gym" },
  { areaName: "Personal", metric: "sessions", target: 3, keyword: "read", title: "Reading" },
];

export interface WorkspaceSetup {
  name: string;
  workingDays: number[];
  dayStartMinutes: number;
  dayEndMinutes: number;
  areaNames: string[];
  weeklyGoals: WeeklyGoalSetup[];
  includeExamples: boolean;
  timeZone?: string;
}

/** Onboarding: creates areas, weekly goals, the "Normal Week" template and (optionally) example data. */
export async function setupWorkspace(services: Services, setup: WorkspaceSetup, now = new Date()): Promise<void> {
  await services.data.saveSettings({
    name: setup.name,
    workingDays: setup.workingDays,
    dayStartMinutes: setup.dayStartMinutes,
    dayEndMinutes: setup.dayEndMinutes,
    timeZone: setup.timeZone ?? "UTC",
  });

  const areas: Area[] = [];
  for (const name of setup.areaNames) {
    const def = DEFAULT_AREAS.find((a) => a.name === name);
    areas.push(
      await services.areas.create({
        name,
        color: def?.color ?? "slate",
        keywords: def?.keywords ?? [name.toLowerCase()],
        description: def?.description ?? "",
      }),
    );
  }
  const areaByName = new Map(areas.map((a) => [a.name, a]));

  for (const g of setup.weeklyGoals) {
    const area = areaByName.get(g.areaName);
    if (!area || g.target <= 0) continue;
    await services.goals.create({
      title: g.title ?? area.name,
      period: "weekly",
      metric: g.metric,
      target: g.target,
      tracking: "auto",
      areaId: area.id,
      keyword: g.keyword ?? "",
    });
  }

  const id = (name: string) => areaByName.get(name)?.id ?? null;
  const frontend = id("Frontend");
  const startup = id("Startup + AI");
  const health = id("Health");
  const personal = id("Personal");
  const H = 60;
  const items = [
    { weekday: 1, title: "Frontend — Deep learning", areaId: frontend, durationMinutes: 3 * H, startMinutes: 9 * H },
    { weekday: 1, title: "Startup — Development", areaId: startup, durationMinutes: 2 * H, startMinutes: 14 * H + 30 },
    { weekday: 2, title: "Frontend — Deep learning", areaId: frontend, durationMinutes: 3 * H, startMinutes: 9 * H },
    { weekday: 2, title: "Startup — Development", areaId: startup, durationMinutes: 2 * H, startMinutes: 14 * H + 30 },
    { weekday: 3, title: "Frontend — Practice", areaId: frontend, durationMinutes: 2 * H, startMinutes: 9 * H },
    { weekday: 3, title: "Startup — Development", areaId: startup, durationMinutes: 3 * H, startMinutes: 14 * H + 30 },
    { weekday: 4, title: "Gym", areaId: health, durationMinutes: 75, startMinutes: 18 * H + 30 },
    { weekday: 4, title: "Startup — Development", areaId: startup, durationMinutes: 3 * H, startMinutes: 14 * H + 30 },
    { weekday: 5, title: "Frontend — Practice", areaId: frontend, durationMinutes: 2 * H, startMinutes: 9 * H },
    { weekday: 6, title: "Startup — Research / Product", areaId: startup, durationMinutes: 3 * H, startMinutes: 10 * H },
    { weekday: 6, title: "Personal time", areaId: personal, durationMinutes: 2 * H, startMinutes: 16 * H },
    { weekday: 0, title: "Weekly Review", areaId: personal, durationMinutes: 45, startMinutes: 18 * H },
  ].filter((i) => i.areaId !== null || !setup.areaNames.length);
  await services.templates.create(
    "Normal Week",
    items.map((i) => ({ ...i, projectId: null })),
  );

  if (setup.includeExamples) await seedExampleData(services, areas, now);
  await services.data.saveSettings({ onboarded: true });
}

/** Small deterministic PRNG so example data is stable between runs. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Realistic example data relative to `now`: today's schedule, an unscheduled
 * pool, recurring tasks, goals/habits and ~3 weeks of history for analytics.
 */
export async function seedExampleData(services: Services, areas: Area[], now = new Date()): Promise<void> {
  const today = toDateKey(now);
  const settings = await services.data.getSettings();
  const weekStartsOn = settings.weekStartsOn as WeekdayIndex;
  const areaId = (name: string) => areas.find((a) => a.name === name)?.id ?? null;
  const frontend = areaId("Frontend");
  const startup = areaId("Startup + AI");
  const health = areaId("Health");
  const personal = areaId("Personal");
  const fun = areaId("Entertainment");
  const H = 60;

  const fm = await services.projects.create({
    name: "Frontend Mastery",
    areaId: frontend,
    description: "JavaScript → TypeScript → React → Next.js → Testing → System design.",
    deadline: addDaysKey(today, 120),
  });
  const mvp = await services.projects.create({
    name: "Startup MVP",
    areaId: startup,
    description: "Product definition, UX, database, backend, frontend, AI, deployment.",
    deadline: addDaysKey(today, 75),
  });

  const t = services.tasks;
  // Today's schedule
  await t.create(
    { title: "Learn React Rendering", areaId: frontend, projectId: fm.id, estimatedMinutes: 2 * H, priority: "high", tags: ["react"] },
    { date: today, startMinutes: 9 * H },
  );
  await t.create(
    { title: "TypeScript Generics", areaId: frontend, projectId: fm.id, estimatedMinutes: 90, tags: ["typescript"] },
    { date: today, startMinutes: 11 * H + 30 },
  );
  await t.create(
    { title: "Build AI Feature", areaId: startup, projectId: mvp.id, estimatedMinutes: 3 * H, priority: "high", tags: ["ai"] },
    { date: today, startMinutes: 14 * H + 30 },
  );
  await t.create(
    { title: "Startup research / product", areaId: startup, projectId: mvp.id, estimatedMinutes: 90 },
    { date: today, startMinutes: 17 * H + 30 },
  );

  // Unscheduled pool
  await t.create({ title: "Read React documentation", areaId: frontend, projectId: fm.id, estimatedMinutes: 60, tags: ["react"] });
  await t.create({ title: "Build React Testing Exercise", areaId: frontend, projectId: fm.id, estimatedMinutes: 2 * H, tags: ["testing"] });
  await t.create({
    title: "Startup Database Design",
    areaId: startup,
    projectId: mvp.id,
    estimatedMinutes: 3 * H,
    priority: "high",
    dueDate: addDaysKey(today, 4),
    subtasks: [
      { id: createId("st"), title: "List core entities", done: true },
      { id: createId("st"), title: "Draw ER diagram", done: false },
      { id: createId("st"), title: "Write migrations", done: false },
    ],
  });
  await t.create({ title: "Read Book", areaId: personal, estimatedMinutes: 45, tags: ["reading"] });
  await t.create({ title: "Watch Movie", areaId: fun, estimatedMinutes: 2 * H }, { date: addDaysKey(today, 1), startMinutes: 20 * H });
  await t.create({ title: "Next.js App Router deep dive", areaId: frontend, projectId: fm.id, estimatedMinutes: 2 * H }, { date: addDaysKey(today, 1), startMinutes: 9 * H });
  await t.create({ title: "MVP deployment pipeline", areaId: startup, projectId: mvp.id, estimatedMinutes: 2 * H }, { date: addDaysKey(today, 2), startMinutes: 14 * H + 30 });

  // Recurring
  const weekStart = weekRange(today, weekStartsOn).from;
  await t.create({
    title: "Gym",
    areaId: health,
    estimatedMinutes: 75,
    recurrence: { frequency: "weekly", interval: 1, weekdays: [1, 4], dayOfMonth: null, startDate: weekStart, endDate: null, startMinutes: 18 * H + 30 },
  });
  await t.create({
    title: "Weekly Review",
    areaId: personal,
    estimatedMinutes: 45,
    recurrence: { frequency: "weekly", interval: 1, weekdays: [0], dayOfMonth: null, startDate: weekStart, endDate: null, startMinutes: 18 * H },
  });
  await t.create({
    title: "Yoga",
    areaId: health,
    estimatedMinutes: 30,
    recurrence: { frequency: "weekly", interval: 1, weekdays: [2, 6], dayOfMonth: null, startDate: weekStart, endDate: null, startMinutes: 8 * H },
  });

  // Goals
  await services.goals.create({ title: "Frontend", period: "monthly", metric: "hours", target: 32, tracking: "auto", areaId: frontend });
  await services.goals.create({ title: "Startup + AI", period: "monthly", metric: "hours", target: 32, tracking: "auto", areaId: startup });
  await services.goals.create({ title: "Gym", period: "monthly", metric: "sessions", target: 8, tracking: "auto", areaId: health, keyword: "gym" });
  const book = await services.goals.create({ title: "Book", period: "monthly", metric: "pages", target: 250, tracking: "manual", areaId: personal });
  const senior = await services.goals.create({
    title: "Become Senior Frontend Developer",
    description: "Deep, practical mastery of the modern frontend stack.",
    period: "long_term",
    metric: "hours",
    target: 500,
    tracking: "auto",
    areaId: frontend,
    deadline: addDaysKey(today, 365),
  });
  for (const [i, m] of ["JavaScript", "TypeScript", "React", "Next.js", "Testing", "Architecture", "System Design"].entries()) {
    await services.goals.addMilestone(senior.id, m);
    if (i < 1) {
      const g = await services.store.goals.get(senior.id);
      await services.goals.toggleMilestone(senior.id, g!.milestones[i].id);
    }
  }

  // Habits
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const habitDefs: { name: string; weekdays: number[]; color: AreaColor; rate: number }[] = [
    { name: "Sleep before 23:30", weekdays: allDays, color: "indigo", rate: 0.7 },
    { name: "Morning coffee", weekdays: allDays, color: "amber", rate: 0.95 },
    { name: "Daily planning", weekdays: settings.workingDays, color: "sky", rate: 0.8 },
    { name: "Reading", weekdays: allDays, color: "amber", rate: 0.55 },
    { name: "Yoga", weekdays: [2, 6], color: "emerald", rate: 0.7 },
    { name: "Weekly review", weekdays: [0], color: "violet", rate: 0.8 },
  ];
  const rand = mulberry32(42);
  for (const def of habitDefs) {
    const habit = await services.habits.create({ name: def.name, weekdays: def.weekdays, color: def.color });
    const entries = [];
    for (let i = 1; i <= 28; i++) {
      const date = addDaysKey(today, -i);
      if (def.weekdays.includes(weekdayOf(date)) && rand() < def.rate) {
        entries.push({ id: createId("he"), habitId: habit.id, date, createdAt: now.toISOString() });
      }
    }
    await services.store.habitEntries.putMany(entries);
  }

  // History: ~3 weeks of completed / skipped / moved work.
  await seedHistory(services, { today, now, frontend, startup, health, personal, fun, fmId: fm.id, mvpId: mvp.id, rand });

  for (let i = 1; i <= 20; i += 3) await services.goals.logProgress(book.id, 15 + Math.round(rand() * 15), addDaysKey(today, -i));
}

async function seedHistory(
  services: Services,
  ctx: {
    today: DateKey;
    now: Date;
    frontend: string | null;
    startup: string | null;
    health: string | null;
    personal: string | null;
    fun: string | null;
    fmId: string;
    mvpId: string;
    rand: () => number;
  },
) {
  const { today, rand } = ctx;
  const settings = await services.data.getSettings();
  const iso = ctx.now.toISOString();
  const topics = {
    frontend: ["React hooks deep dive", "CSS layout practice", "TypeScript utility types", "Testing Library exercises", "Next.js routing"],
    startup: ["User interviews synthesis", "API design", "Auth flow", "Prompt engineering spike", "Landing page copy", "Data model review"],
  };
  const blocks: ScheduleBlock[] = [];
  const entries: TimeEntry[] = [];

  for (let i = 21; i >= 1; i--) {
    const date = addDaysKey(today, -i);
    const weekday = weekdayOf(date);
    if (!settings.workingDays.includes(weekday) && weekday !== 0) continue;

    const plan: { title: string; area: string | null; project: string | null; start: number; dur: number }[] = [];
    if (weekday !== 0 && weekday !== 6) {
      plan.push({ title: topics.frontend[i % topics.frontend.length], area: ctx.frontend, project: ctx.fmId, start: 540, dur: 120 });
      plan.push({ title: topics.frontend[(i + 2) % topics.frontend.length] + " — practice", area: ctx.frontend, project: ctx.fmId, start: 690, dur: 90 });
      plan.push({ title: topics.startup[i % topics.startup.length], area: ctx.startup, project: ctx.mvpId, start: 870, dur: 180 });
    } else if (weekday === 6) {
      plan.push({ title: topics.startup[(i + 3) % topics.startup.length], area: ctx.startup, project: ctx.mvpId, start: 600, dur: 180 });
      plan.push({ title: "Movie night", area: ctx.fun, project: null, start: 1200, dur: 120 });
    } else {
      plan.push({ title: "Read Book — chapter", area: ctx.personal, project: null, start: 660, dur: 60 });
    }
    if (weekday === 1 || weekday === 4) plan.push({ title: "Gym session", area: ctx.health, project: null, start: 1110, dur: 75 });
    if (weekday === 3) plan.push({ title: "Read Book — chapter", area: ctx.personal, project: null, start: 1260, dur: 45 });

    for (const p of plan) {
      const task = await services.tasks.create({
        title: p.title,
        areaId: p.area,
        projectId: p.project,
        estimatedMinutes: p.dur,
        status: "planned",
      });
      const roll = rand();
      const moved = roll > 0.86;
      const status: ScheduleBlock["status"] = roll < 0.74 ? "completed" : roll < 0.8 ? "skipped" : "completed";
      const actual = Math.max(15, Math.round((p.dur * (0.75 + rand() * 0.5)) / 5) * 5);
      const block: ScheduleBlock = {
        id: createId("blk"),
        taskId: task.id,
        date,
        startMinutes: p.start,
        durationMinutes: p.dur,
        status,
        actualMinutes: status === "completed" ? actual : null,
        originalDate: moved ? addDaysKey(date, -1) : date,
        rescheduleCount: moved ? 1 + Math.floor(rand() * 2) : 0,
        occurrenceDate: null,
        completedAt: status === "completed" ? new Date(`${date}T${String(Math.floor((p.start + p.dur) / 60) % 24).padStart(2, "0")}:00:00`).toISOString() : null,
        createdAt: iso,
        updatedAt: iso,
      };
      blocks.push(block);
      if (status === "completed" && rand() < 0.6) {
        const start = new Date(`${date}T00:00:00`);
        start.setMinutes(p.start);
        entries.push({
          id: createId("te"),
          taskId: task.id,
          blockId: block.id,
          date,
          start: start.toISOString(),
          end: new Date(start.getTime() + actual * 60000).toISOString(),
          durationMinutes: actual,
          source: "timer",
          endReason: "stop",
          note: "",
        });
      }
      const taskStatus = status === "completed" ? "completed" : "skipped";
      const saved = await services.store.tasks.get(task.id);
      await services.store.tasks.put({
        ...saved!,
        status: taskStatus,
        completedAt: status === "completed" ? block.completedAt : null,
      });
    }
  }
  await services.store.blocks.putMany(blocks);
  await services.store.timeEntries.putMany(entries);
}
