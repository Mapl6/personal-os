import type { Metadata } from "next";
import { AreaDetail } from "@/features/areas/area-detail";

export const metadata: Metadata = { title: "Area" };

export default async function AreaPage({ params }: PageProps<"/areas/[id]">) {
  const { id } = await params;
  return <AreaDetail id={id} />;
}
