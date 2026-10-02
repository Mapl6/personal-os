import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isBuiltAt, parseCatalogueFile, plainText, ROADMAP_DOMAINS, summarizeStage } from "@/lib/roadmap/catalogue";

const SAMPLE = `# Knowledge

## Pages and the block editor

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| KN-01 | Pages | Create pages with \`/\` and [links](x.md) | P0 | 1 | ⬜ |
| KN-24 | Tags | Nested tags | P0 | 1 | 🟡 Tags exist on tasks |
| KN-40 | Canvas | Whiteboard | P2 | 3 | ⬜ |
| PL-64 | Accessibility | WCAG | P0 | all | 🟡 Existing UI follows it |
| PL-71 | Native app | Expo | P2 | 4+ | ⬜ |

## Already shipped (Phase 0)

| ID | Feature | Status |
| --- | --- | --- |
| PE-A1 | Tasks | ✅ |
`;

describe("roadmap catalogue parser", () => {
  const features = parseCatalogueFile(SAMPLE, "Knowledge");

  it("parses full and short table rows", () => {
    expect(features.map((f) => f.id)).toEqual(["KN-01", "KN-24", "KN-40", "PL-64", "PL-71", "PE-A1"]);
    expect(features[0]).toMatchObject({ name: "Pages", details: "Create pages with / and links", priority: "P0", phase: 1, status: "planned", group: "Pages and the block editor" });
    expect(features[5]).toMatchObject({ name: "Tasks", status: "shipped", phase: 0, group: "Shipped planner" });
  });

  it("reads status notes and odd phases", () => {
    expect(features[1]).toMatchObject({ status: "partial", note: "Tags exist on tasks" });
    expect(features[3].phase).toBe(0);
    expect(features[4].phase).toBe(4);
  });

  it("groups life module rows by module", () => {
    const [f] = parseCatalogueFile("## Finance (`FIN`)\n| LM-FIN-13 | Loans | Lent and borrowed | P0 | 3 | ⬜ |", "Life modules");
    expect(f.group).toBe("Finance");
  });

  it("decides what is built at each stage", () => {
    const [kn01, , canvas, , , tasks] = features;
    expect(isBuiltAt(tasks, 0)).toBe(true);
    expect(isBuiltAt(kn01, 0)).toBe(false);
    expect(isBuiltAt(kn01, 1)).toBe(true);
    expect(isBuiltAt(canvas, 3)).toBe(true);
    expect(isBuiltAt(canvas, 3, false)).toBe(false);
    expect(summarizeStage(features, 0)).toEqual({ total: 6, builtToday: 1, partlyBuiltToday: 2, builtAtStage: 1 });
  });

  it("strips inline markdown", () => {
    expect(plainText("**Bold** `code` [link](a.md)")).toBe("Bold code link");
  });
});

describe("real feature catalogue", () => {
  const all = ROADMAP_DOMAINS.flatMap((d) =>
    parseCatalogueFile(readFileSync(path.join(process.cwd(), "docs", "features", d.file), "utf8"), d.name),
  );

  it("parses every domain with unique IDs", () => {
    expect(all.length).toBeGreaterThan(300);
    expect(new Set(all.map((f) => f.id)).size).toBe(all.length);
    for (const d of ROADMAP_DOMAINS) expect(all.some((f) => f.domain === d.name)).toBe(true);
  });

  it("has a valid phase and some shipped features", () => {
    expect(all.every((f) => f.phase >= 0 && f.phase <= 5)).toBe(true);
    expect(all.some((f) => f.status === "shipped")).toBe(true);
  });
});
