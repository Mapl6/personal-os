import type { Metadata } from "next";
import { GoalsView } from "@/features/goals/goals-view";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage({ searchParams }: PageProps<"/goals">) {
  const sp = await searchParams;
  return <GoalsView openNew={sp.new === "1"} />;
}
