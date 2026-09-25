import type { Metadata } from "next";
import { MonthView } from "@/features/month/month-view";

export const metadata: Metadata = { title: "Month" };

export default function MonthPage() {
  return <MonthView />;
}
