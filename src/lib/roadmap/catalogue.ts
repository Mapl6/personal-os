/**
 * Parses the feature catalogue (docs/features/*.md) into data for the public
 * roadmap page. The markdown tables are the single source of truth: each row is
 * `| ID | Feature | Details | Priority | Phase | Status |`, except the
 * "Already shipped" table in planning.md, which is `| ID | Feature | Status |`.
 */

export const ROADMAP_DOMAINS = [
  { name: "Knowledge", file: "knowledge.md" },
  { name: "Databases", file: "databases.md" },
  { name: "Planning", file: "planning.md" },
  { name: "Life modules", file: "life-modules.md" },
  { name: "Capture", file: "capture.md" },
  { name: "AI", file: "ai.md" },
  { name: "Platform", file: "platform.md" },
] as const;
export type RoadmapDomain = (typeof ROADMAP_DOMAINS)[number]["name"];

/** Phase 0 is what ships today; 5 is the complete app. */
export const ROADMAP_STAGES = [
  { label: "Today", title: "The planner", summary: "What the app does now" },
  { label: "Phase 1", title: "Foundation", summary: "Inbox, pages, links, search" },
  { label: "Phase 2", title: "Databases", summary: "First modules, focus mode" },
  { label: "Phase 3", title: "Life modules", summary: "Health, finance, insights" },
  { label: "Phase 4", title: "Sync & platform", summary: "Devices, privacy, integrations" },
  { label: "Phase 5", title: "AI second brain", summary: "The complete app" },
] as const;
export const FINAL_STAGE = ROADMAP_STAGES.length - 1;

export const LIFE_MODULES: Record<string, string> = {
  JRN: "Journal",
  LIB: "Library",
  LRN: "Learning",
  CHL: "Challenges",
  HLT: "Health",
  NUT: "Nutrition",
  CYC: "Cycle",
  FIN: "Finance",
  PPL: "People",
  STU: "Startup",
  CAR: "Career",
  HOM: "Home",
  TRV: "Travel",
  RCP: "Recipes",
  IDE: "Ideas",
};

export type FeatureStatus = "shipped" | "partial" | "planned";
export type FeaturePriority = "P0" | "P1" | "P2";

export interface RoadmapFeature {
  id: string;
  name: string;
  details: string;
  priority: FeaturePriority;
  /** 0–5; shipped features are always 0. */
  phase: number;
  status: FeatureStatus;
  /** Text after the status emoji, e.g. "Tags exist on tasks". */
  note: string;
  domain: RoadmapDomain;
  /** Section heading in the catalogue, or the module name for life modules. */
  group: string;
}

const ROW = /^\| ((?:KN|DB|PE|RV|CA|AI|PL)-[A-Z]?\d+|LM-[A-Z]{3}-\d+) \|(.*)\|\s*$/;

/** Strips inline markdown (code, links, emphasis) for plain-text display. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .trim();
}

function parseStatus(cell: string): { status: FeatureStatus; note: string } {
  const status: FeatureStatus = cell.startsWith("✅") ? "shipped" : cell.startsWith("🟡") ? "partial" : "planned";
  return { status, note: plainText(cell.replace(/^(✅|🟡|⬜)\s*/u, "")) };
}

function parsePhase(cell: string): number {
  if (cell === "all") return 0;
  const n = Number.parseInt(cell, 10); // "4+" → 4
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), FINAL_STAGE) : 0;
}

function parsePriority(cell: string): FeaturePriority {
  return cell === "P0" || cell === "P1" || cell === "P2" ? cell : "P2";
}

export function parseCatalogueFile(markdown: string, domain: RoadmapDomain): RoadmapFeature[] {
  const features: RoadmapFeature[] = [];
  let section = "";
  for (const line of markdown.split("\n")) {
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      section = plainText(heading[1].replace(/\s*\(`[^`]*`\)/, ""));
      continue;
    }
    const row = ROW.exec(line);
    if (!row) continue;
    const id = row[1];
    const cells = row[2].split("|").map((c) => c.trim());
    const short = cells.length === 2; // | ID | Feature | Status |
    const [name, details, priority, phase, status] = short ? [cells[0], "", "P0", "0", cells[1]] : cells;
    const parsed = parseStatus(status);
    const group = id.startsWith("LM-")
      ? (LIFE_MODULES[id.split("-")[1]] ?? section)
      : section.startsWith("Already shipped")
        ? "Shipped planner"
        : section;
    features.push({
      id,
      name: plainText(name),
      details: plainText(details),
      priority: parsePriority(priority),
      phase: parsed.status === "shipped" ? 0 : parsePhase(phase),
      status: parsed.status,
      note: parsed.note,
      domain,
      group,
    });
  }
  return features;
}

/** Whether a feature exists in the app at the end of `stage` (0 = today). */
export function isBuiltAt(feature: RoadmapFeature, stage: number, includeP2 = true): boolean {
  if (feature.status === "shipped") return true;
  if (stage === 0) return false;
  return feature.phase <= stage && (includeP2 || feature.priority !== "P2");
}

export interface StageSummary {
  total: number;
  builtToday: number;
  partlyBuiltToday: number;
  builtAtStage: number;
}

export function summarizeStage(features: RoadmapFeature[], stage: number, includeP2 = true): StageSummary {
  return {
    total: features.length,
    builtToday: features.filter((f) => f.status === "shipped").length,
    partlyBuiltToday: features.filter((f) => f.status === "partial").length,
    builtAtStage: features.filter((f) => isBuiltAt(f, stage, includeP2)).length,
  };
}
