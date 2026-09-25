import type { DateKey } from "@/lib/date";
import type { Priority } from "@/types/domain";

/**
 * A proposed modification to the plan. Every bulk operation (rollover,
 * applying a template, and — later — an AI assistant) produces a list of
 * these first. The UI shows them, the user confirms, then they're applied.
 * Nothing moves silently.
 */
export type PlanChange =
  | {
      kind: "move_block";
      blockId: string;
      title: string;
      from: { date: DateKey; startMinutes: number | null };
      to: { date: DateKey; startMinutes: number | null };
    }
  | {
      kind: "create_task";
      title: string;
      areaId: string | null;
      projectId: string | null;
      priority?: Priority;
      durationMinutes: number;
      date: DateKey;
      startMinutes: number | null;
    }
  | {
      kind: "schedule_task";
      taskId: string;
      title: string;
      date: DateKey;
      startMinutes: number | null;
      durationMinutes: number;
    }
  | { kind: "skip_block"; blockId: string; title: string };

export interface ChangeProposal {
  summary: string;
  changes: PlanChange[];
}
