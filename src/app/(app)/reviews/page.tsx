import type { Metadata } from "next";
import { ReviewsView } from "@/features/reviews/reviews-view";
import type { ReviewType } from "@/types/domain";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  const sp = await searchParams;
  const type = typeof sp.type === "string" && ["daily", "weekly", "monthly"].includes(sp.type) ? (sp.type as ReviewType) : undefined;
  return <ReviewsView initialType={type} />;
}
