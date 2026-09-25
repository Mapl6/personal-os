import { Badge } from "@/components/ui/badge";
import type { Priority, TaskStatus } from "@/types/domain";

const STATUS: Record<TaskStatus, { label: string; variant: "default" | "primary" | "success" | "warning" | "info" | "outline" }> = {
  inbox: { label: "Inbox", variant: "outline" },
  planned: { label: "Planned", variant: "info" },
  in_progress: { label: "In progress", variant: "primary" },
  completed: { label: "Completed", variant: "success" },
  // Skipping is a choice, not a failure — neutral styling.
  skipped: { label: "Skipped", variant: "default" },
  cancelled: { label: "Cancelled", variant: "default" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "medium") return null;
  const variant = priority === "critical" ? "danger" : priority === "high" ? "warning" : "outline";
  return <Badge variant={variant}>{priority}</Badge>;
}
