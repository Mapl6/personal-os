import type { Metadata } from "next";
import { DailyView } from "@/features/pages/daily-view";

export const metadata: Metadata = { title: "Daily note" };

export default function DailyPage() {
  return <DailyView />;
}
