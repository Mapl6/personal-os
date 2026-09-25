import { collectWork } from "./work";
import type { Project, ScheduleBlock, Task, TimeEntry } from "@/types/domain";

export interface ProjectStats {
  project: Project;
  total: number;
  completed: number;
  open: number;
  percent: number;
  minutesSpent: number;
  plannedMinutes: number;
}

const ALL_TIME = { from: "0000-01-01", to: "9999-12-31" };

/** Progress = completed / non-cancelled tasks. Time = all actual work on its tasks. */
export function computeProjectStats(
  projects: readonly Project[],
  tasks: readonly Task[],
  blocks: readonly ScheduleBlock[],
  entries: readonly TimeEntry[],
): Map<string, ProjectStats> {
  const taskProject = new Map<string, string>();
  const out = new Map<string, ProjectStats>();
  for (const p of projects) {
    out.set(p.id, { project: p, total: 0, completed: 0, open: 0, percent: 0, minutesSpent: 0, plannedMinutes: 0 });
  }
  for (const t of tasks) {
    if (!t.projectId) continue;
    const s = out.get(t.projectId);
    if (!s) continue;
    taskProject.set(t.id, t.projectId);
    if (t.status === "cancelled") continue;
    s.total++;
    if (t.status === "completed") s.completed++;
    else if (t.status !== "skipped") s.open++;
  }
  for (const r of collectWork(blocks, entries, ALL_TIME)) {
    const pid = taskProject.get(r.taskId);
    if (pid) out.get(pid)!.minutesSpent += r.minutes;
  }
  for (const b of blocks) {
    const pid = taskProject.get(b.taskId);
    if (pid && b.status === "planned") out.get(pid)!.plannedMinutes += b.durationMinutes;
  }
  for (const s of out.values()) {
    s.percent = s.total ? Math.round((s.completed / s.total) * 100) : 0;
    s.minutesSpent = Math.round(s.minutesSpent);
  }
  return out;
}
