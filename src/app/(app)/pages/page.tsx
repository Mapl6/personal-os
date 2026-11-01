import type { Metadata } from "next";
import { PagesIndex } from "@/features/pages/pages-index";

export const metadata: Metadata = { title: "Pages" };

export default function PagesPage() {
  return <PagesIndex />;
}
