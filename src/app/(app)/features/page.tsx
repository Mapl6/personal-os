import type { Metadata } from "next";
import { FeaturesView } from "@/features/features-settings/features-view";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return <FeaturesView />;
}
