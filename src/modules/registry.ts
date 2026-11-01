import type { FeatureDefinition, FeaturePreset } from "./types";

export const FEATURES: FeatureDefinition[] = [
  // ---- core
  { id: "today", label: "Today", description: "Today’s timeline and the dashboard.", group: "planning", core: true, defaultEnabled: true, privacy: "normal", routes: ["/", "/today"], widgets: ["progress", "schedule", "next", "areas", "stats"] },
  { id: "tasks", label: "Tasks", description: "Every piece of work, scheduled or not.", group: "planning", core: true, defaultEnabled: true, privacy: "normal", routes: ["/tasks"], collections: ["tasks", "blocks"] },
  { id: "calendar", label: "Calendar", description: "Day, week and month calendar with drag and drop.", group: "planning", core: true, defaultEnabled: true, privacy: "normal", routes: ["/calendar"] },
  { id: "inbox", label: "Inbox", description: "One place for everything you capture, processed later.", group: "capture", core: true, defaultEnabled: true, privacy: "normal", routes: ["/inbox"], collections: ["inbox", "attachments"] },
  { id: "search", label: "Search", description: "Find anything across tasks, pages and notes.", group: "knowledge", core: true, defaultEnabled: true, privacy: "normal", routes: ["/search"] },

  // ---- planning
  { id: "planViews", label: "Week and month plans", description: "Week board with templates and the month overview.", group: "planning", defaultEnabled: true, privacy: "normal", routes: ["/week", "/month"], collections: ["templates"] },
  { id: "projects", label: "Projects", description: "Group tasks into projects with progress and deadlines.", group: "planning", defaultEnabled: true, privacy: "normal", routes: ["/projects"], collections: ["projects"] },
  { id: "areas", label: "Areas", description: "Life areas that tasks, projects and goals belong to.", group: "planning", defaultEnabled: true, privacy: "normal", routes: ["/areas"], collections: ["areas"] },
  { id: "goals", label: "Goals", description: "Daily to long-term goals with milestones and progress.", group: "planning", defaultEnabled: true, privacy: "normal", routes: ["/goals"], widgets: ["weeklyGoals", "monthlyGoals"], collections: ["goals", "goalProgress"] },
  { id: "habits", label: "Habits", description: "Lightweight habit tracker with streaks.", group: "planning", defaultEnabled: true, privacy: "normal", routes: ["/habits"], widgets: ["habits"], collections: ["habits", "habitEntries"] },
  { id: "timeTracking", label: "Time tracking", description: "Optional timer and manual time logs.", group: "planning", defaultEnabled: true, privacy: "normal", widgets: ["focus"], collections: ["timeEntries"] },

  // ---- capture
  { id: "brainDump", label: "Brain dump", description: "Empty your head line by line, then send each line on.", group: "capture", defaultEnabled: true, dependsOn: ["inbox"], privacy: "normal", routes: ["/brain-dump"] },

  // ---- knowledge
  { id: "pages", label: "Pages", description: "Notion-style pages with blocks, nested in a tree.", group: "knowledge", defaultEnabled: true, privacy: "normal", routes: ["/pages"], collections: ["pages", "pageContents"] },
  { id: "dailyNotes", label: "Daily notes", description: "A note for every day, showing that day’s plan.", group: "knowledge", defaultEnabled: true, dependsOn: ["pages"], privacy: "normal", routes: ["/daily"] },
  { id: "links", label: "Links and backlinks", description: "[[Wiki links]], @mentions and backlinks between everything.", group: "knowledge", defaultEnabled: true, dependsOn: ["pages"], privacy: "normal", collections: ["links"] },

  // ---- reflection
  { id: "reviews", label: "Reviews", description: "Daily, weekly and monthly reviews.", group: "reflection", defaultEnabled: true, privacy: "normal", routes: ["/reviews"], collections: ["reviews"] },
  { id: "analytics", label: "Analytics", description: "Where your time went and how plans compared.", group: "reflection", defaultEnabled: true, privacy: "normal", routes: ["/analytics"] },
  { id: "mood", label: "Mood check-ins", description: "Two-tap mood and energy logs during the day.", group: "reflection", defaultEnabled: true, privacy: "private", collections: ["checkIns"] },
  { id: "dayRating", label: "Day rating", description: "Rate each day 1–5 in the evening review.", group: "reflection", defaultEnabled: true, privacy: "private", collections: ["dayRatings"] },
];

export const FEATURE_BY_ID = new Map(FEATURES.map((f) => [f.id, f]));

/** Route → owning feature (longest prefix wins). */
export function featureForRoute(pathname: string): FeatureDefinition | undefined {
  let best: { f: FeatureDefinition; len: number } | undefined;
  for (const f of FEATURES) {
    for (const r of f.routes ?? []) {
      const hit = r === "/" ? pathname === "/" : pathname === r || pathname.startsWith(`${r}/`);
      if (hit && (!best || r.length > best.len)) best = { f, len: r.length };
    }
  }
  return best?.f;
}

const ALL_OPTIONAL = FEATURES.filter((f) => !f.core).map((f) => f.id);

export const PRESETS: FeaturePreset[] = [
  { id: "everything", label: "Everything", description: "Every feature on.", enabled: ALL_OPTIONAL },
  { id: "planner", label: "Planner only", description: "Plan, track and review — no notes or check-ins.", enabled: ["planViews", "projects", "areas", "goals", "habits", "timeTracking", "reviews", "analytics"] },
  { id: "student", label: "Student", description: "Pages and daily notes for studying, plus goals and habits.", enabled: ["planViews", "areas", "goals", "habits", "timeTracking", "pages", "dailyNotes", "links", "brainDump", "reviews"] },
  { id: "health", label: "Health focus", description: "Habits, mood and day ratings, light planning.", enabled: ["habits", "mood", "dayRating", "reviews", "analytics", "goals", "brainDump"] },
  { id: "founder", label: "Founder", description: "Projects, notes and time tracking for building a company.", enabled: ["planViews", "projects", "areas", "goals", "timeTracking", "pages", "dailyNotes", "links", "brainDump", "reviews", "analytics"] },
];
