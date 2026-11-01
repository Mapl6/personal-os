import type { Metadata } from "next";
import { BrainDumpView } from "@/features/inbox/brain-dump-view";

export const metadata: Metadata = { title: "Brain dump" };

export default function BrainDumpPage() {
  return <BrainDumpView />;
}
