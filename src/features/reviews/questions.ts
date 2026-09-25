import type { ReviewType } from "@/types/domain";

export interface ReviewQuestion {
  id: string;
  label: string;
  placeholder?: string;
}

export const REVIEW_QUESTIONS: Record<ReviewType, ReviewQuestion[]> = {
  daily: [
    { id: "completed", label: "What did I complete?" },
    { id: "not_completed", label: "What did I not complete?" },
    { id: "why", label: "Why?", placeholder: "No judgement — just notice what got in the way." },
    { id: "move", label: "What should move to tomorrow?" },
    { id: "achievement", label: "Most important achievement" },
    { id: "notes", label: "Notes" },
  ],
  weekly: [
    { id: "went_well", label: "What went well?" },
    { id: "went_poorly", label: "What went poorly?" },
    { id: "achievement", label: "Biggest achievement" },
    { id: "problem", label: "Biggest problem" },
    { id: "change", label: "What should change next week?" },
    { id: "notes", label: "Notes" },
  ],
  monthly: [
    { id: "achievements", label: "Major achievements" },
    { id: "goals_completed", label: "Goals completed" },
    { id: "goals_missed", label: "Goals missed (and what they taught me)" },
    { id: "lessons", label: "Lessons learned" },
    { id: "priorities", label: "Next month’s priorities" },
    { id: "notes", label: "Notes" },
  ],
};
