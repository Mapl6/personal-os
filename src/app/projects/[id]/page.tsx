import type { Metadata } from "next";
import { ProjectDetail } from "@/features/projects/project-detail";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
