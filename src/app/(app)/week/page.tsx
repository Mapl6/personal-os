import type { Metadata } from "next";
import { WeekView } from "@/features/week/week-view";

export const metadata: Metadata = { title: "Week" };

export default function WeekPage() {
  return <WeekView />;
}
