import type { Metadata } from "next";
import { loadCatalogue } from "@/features/roadmap/load-catalogue";
import { RoadmapView } from "@/features/roadmap/roadmap-view";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Every planned feature of Personal OS, phase by phase: what the app does today and what it will do when complete.",
};

/** Public: lives outside the (app) group, so it skips onboarding and local data. */
export default async function RoadmapPage() {
  return <RoadmapView features={await loadCatalogue()} />;
}
