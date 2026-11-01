import type { Metadata } from "next";
import { DailyView } from "@/features/pages/daily-view";

export const metadata: Metadata = { title: "Daily note" };

export default async function DailyDatePage({ params }: PageProps<"/daily/[date]">) {
  const { date } = await params;
  return <DailyView date={date} />;
}
