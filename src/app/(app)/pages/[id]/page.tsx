import type { Metadata } from "next";
import { PageView } from "@/features/pages/page-view";

export const metadata: Metadata = { title: "Page" };

export default async function PageRoute({ params }: PageProps<"/pages/[id]">) {
  const { id } = await params;
  return <PageView id={id} />;
}
