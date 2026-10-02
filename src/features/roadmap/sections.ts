import { NAV_ITEMS } from "@/components/layout/nav-items";
import type { RoadmapDomain } from "@/lib/roadmap/catalogue";

export const SECTION_GROUPS = ["Plan", "Capture", "Know", "Life", "Reflect", "AI", "System"] as const;
export type SectionGroup = (typeof SECTION_GROUPS)[number];

export interface AppSection {
  label: string;
  group: SectionGroup;
  /** Phase that adds it; 0 = in the app today. */
  phase: number;
  domain: RoadmapDomain;
}

const CURRENT_GROUP: Record<string, SectionGroup> = { "/analytics": "Reflect", "/reviews": "Reflect", "/settings": "System" };

/** Today's sections come straight from the real sidebar, so this stays true as the app changes. */
const CURRENT: AppSection[] = NAV_ITEMS.map((item) => ({
  label: item.label,
  group: CURRENT_GROUP[item.href] ?? "Plan",
  phase: 0,
  domain: CURRENT_GROUP[item.href] === "System" ? "Platform" : "Planning",
}));

/** Sections the roadmap adds, as they would appear in the sidebar. */
const PLANNED: AppSection[] = [
  { label: "Inbox", group: "Capture", phase: 1, domain: "Capture" },
  { label: "Brain dump", group: "Capture", phase: 1, domain: "Capture" },
  { label: "Pages", group: "Know", phase: 1, domain: "Knowledge" },
  { label: "Daily notes", group: "Know", phase: 1, domain: "Knowledge" },
  { label: "Search", group: "Know", phase: 1, domain: "Knowledge" },
  { label: "Features", group: "System", phase: 1, domain: "Platform" },
  { label: "Trash", group: "System", phase: 1, domain: "Platform" },
  { label: "Focus mode", group: "Plan", phase: 2, domain: "Planning" },
  { label: "Challenges", group: "Plan", phase: 2, domain: "Life modules" },
  { label: "Read later", group: "Capture", phase: 2, domain: "Capture" },
  { label: "Databases", group: "Know", phase: 2, domain: "Databases" },
  { label: "Graph", group: "Know", phase: 2, domain: "Knowledge" },
  { label: "Flashcards", group: "Know", phase: 2, domain: "Life modules" },
  { label: "Journal", group: "Life", phase: 2, domain: "Life modules" },
  { label: "Library", group: "Life", phase: 2, domain: "Life modules" },
  { label: "Learning", group: "Life", phase: 2, domain: "Life modules" },
  { label: "Canvas", group: "Know", phase: 3, domain: "Knowledge" },
  ...["Health", "Nutrition", "Cycle", "Finance", "People", "Startup", "Career", "Home", "Travel", "Recipes", "Ideas"].map(
    (label): AppSection => ({ label, group: "Life", phase: 3, domain: "Life modules" }),
  ),
  { label: "Life dashboard", group: "Reflect", phase: 3, domain: "Planning" },
  { label: "Insights", group: "Reflect", phase: 3, domain: "Planning" },
  { label: "Devices & sync", group: "System", phase: 4, domain: "Platform" },
  { label: "Integrations", group: "System", phase: 4, domain: "Platform" },
  { label: "Privacy", group: "System", phase: 4, domain: "Platform" },
  { label: "Plugins", group: "System", phase: 4, domain: "Platform" },
  { label: "Ask AI", group: "AI", phase: 5, domain: "AI" },
];

export const APP_SECTIONS: AppSection[] = [...CURRENT, ...PLANNED];
