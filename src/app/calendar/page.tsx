import type { Metadata } from "next";
import { CalendarView, type CalendarMode } from "@/features/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const sp = await searchParams;
  const view = typeof sp.view === "string" && ["day", "week", "month"].includes(sp.view) ? (sp.view as CalendarMode) : undefined;
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : undefined;
  return <CalendarView initialView={view} initialDate={date} />;
}
