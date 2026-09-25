import type { Metadata } from "next";
import { AreasView } from "@/features/areas/areas-view";

export const metadata: Metadata = { title: "Areas" };

export default function AreasPage() {
  return <AreasView />;
}
