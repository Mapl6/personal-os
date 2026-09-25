import { createId } from "@/lib/utils/id";
import type { Review, ReviewType } from "@/types/domain";
import type { ServiceContext } from "./context";

export function createReviewService(ctx: ServiceContext) {
  const { store } = ctx;
  return {
    async find(type: ReviewType, periodStart: string): Promise<Review | undefined> {
      return (await store.reviews.listBy("periodStart", periodStart)).find((r) => r.type === type);
    },
    /** Creates or updates the review for a period (one per type+period). */
    async save(input: {
      type: ReviewType;
      periodStart: string;
      answers: Record<string, string>;
      energy?: number | null;
    }): Promise<Review> {
      const now = ctx.now().toISOString();
      const existing = (await store.reviews.listBy("periodStart", input.periodStart)).find((r) => r.type === input.type);
      const review: Review = {
        id: existing?.id ?? createId("rev"),
        type: input.type,
        periodStart: input.periodStart,
        answers: input.answers,
        energy: input.energy ?? existing?.energy ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      return store.reviews.put(review);
    },
    async remove(id: string) {
      await store.reviews.delete(id);
    },
  };
}

export type ReviewService = ReturnType<typeof createReviewService>;
