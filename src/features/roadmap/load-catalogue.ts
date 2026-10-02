import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCatalogueFile, ROADMAP_DOMAINS, type RoadmapFeature } from "@/lib/roadmap/catalogue";

const CATALOGUE_DIR = path.join(process.cwd(), "docs", "features");

/**
 * Reads the feature catalogue from docs/features. Server-only (uses the file
 * system); runs at build time, so the roadmap page is prerendered as static HTML.
 */
export async function loadCatalogue(): Promise<RoadmapFeature[]> {
  const files = await Promise.all(
    ROADMAP_DOMAINS.map(async (d) => parseCatalogueFile(await readFile(path.join(CATALOGUE_DIR, d.file), "utf8"), d.name)),
  );
  return files.flat();
}
