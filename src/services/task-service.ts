import { createId } from "@/lib/utils/id";
import { taskSchema, type Priority, type Recurrence, type Subtask, type Task, type TaskStatus } from "@/types/domain";
import { must, type ServiceContext } from "./context";
import type { ScheduleService } from "./schedule-service";

export interface TaskInput {
  title: string;
  description?: string;
  notes?: string;
  priority?: Priority;
  areaId?: string | null;
  projectId?: string | null;
  goalId?: string | null;
  milestoneId?: string | null;
  tags?: string[];
  estimatedMinutes?: number;
  dueDate?: string | null;
  recurrence?: Recurrence | null;
  dependencies?: string[];
  subtasks?: Subtask[];
  status?: TaskStatus;
}

export interface ScheduleInput {
  date: string;
  startMinutes: number | null;
  durationMinutes?: number;
}

export function createTaskService(ctx: ServiceContext, getSchedule: () => ScheduleService) {
  const { store } = ctx;
  const iso = () => ctx.now().toISOString();

  async function create(input: TaskInput, schedule?: ScheduleInput): Promise<Task> {
    const now = iso();
    const task = taskSchema.parse({
      id: createId("task"),
      title: input.title.trim(),
      description: input.description ?? "",
      notes: input.notes ?? "",
      status: input.status ?? "inbox",
      priority: input.priority ?? "medium",
      areaId: input.areaId ?? null,
      projectId: input.projectId ?? null,
      goalId: input.goalId ?? null,
      milestoneId: input.milestoneId ?? null,
      tags: input.tags ?? [],
      estimatedMinutes: input.estimatedMinutes ?? 60,
      dueDate: input.dueDate ?? null,
      recurrence: input.recurrence ?? null,
      dependencies: input.dependencies ?? [],
      subtasks: input.subtasks ?? [],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    });
    await store.tasks.put(task);
    if (task.recurrence) {
      await getSchedule().materializeTask(task);
    } else if (schedule) {
      await getSchedule().scheduleTask(task.id, {
        ...schedule,
        durationMinutes: schedule.durationMinutes ?? task.estimatedMinutes,
      });
    }
    return (await store.tasks.get(task.id))!;
  }

  async function update(id: string, patch: Partial<TaskInput>): Promise<Task> {
    const existing = await must(store.tasks.get(id), "Task");
    const next = taskSchema.parse({ ...existing, ...patch, id, updatedAt: iso() });
    if (patch.status === "completed" && !existing.completedAt) next.completedAt = iso();
    if (patch.status && patch.status !== "completed") next.completedAt = null;
    await store.tasks.put(next);
    const recurrenceChanged = JSON.stringify(existing.recurrence) !== JSON.stringify(next.recurrence);
    if (recurrenceChanged) await getSchedule().regenerateRecurring(next);
    return next;
  }

  async function remove(id: string): Promise<void> {
    const [blocks, entries] = await Promise.all([
      store.blocks.listBy("taskId", id),
      store.timeEntries.listBy("taskId", id),
    ]);
    await store.blocks.deleteMany(blocks.map((b) => b.id));
    await store.timeEntries.deleteMany(entries.map((e) => e.id));
    await store.tasks.delete(id);
    // Drop dangling dependency references.
    const dependents = (await store.tasks.list()).filter((t) => t.dependencies.includes(id));
    await store.tasks.putMany(dependents.map((t) => ({ ...t, dependencies: t.dependencies.filter((d) => d !== id) })));
  }

  /** Completes the task and any of its still-planned blocks. */
  async function complete(id: string): Promise<Task> {
    const task = await must(store.tasks.get(id), "Task");
    const schedule = getSchedule();
    const blocks = (await store.blocks.listBy("taskId", id)).filter((b) => b.status === "planned");
    if (task.recurrence) {
      throw new Error("Recurring tasks are completed per occurrence — complete a scheduled block instead.");
    }
    for (const block of blocks) await schedule.completeBlock(block.id, { cascade: false });
    const next: Task = { ...task, status: "completed", completedAt: iso(), updatedAt: iso() };
    await store.tasks.put(next);
    return next;
  }

  async function reopen(id: string): Promise<Task> {
    const task = await must(store.tasks.get(id), "Task");
    const next: Task = { ...task, status: "inbox", completedAt: null, updatedAt: iso() };
    await store.tasks.put(next);
    await syncStatus(id);
    return (await store.tasks.get(id))!;
  }

  async function setStatus(id: string, status: TaskStatus): Promise<Task> {
    if (status === "completed") return complete(id);
    return update(id, { status });
  }

  async function toggleSubtask(id: string, subtaskId: string): Promise<Task> {
    const task = await must(store.tasks.get(id), "Task");
    return update(id, {
      subtasks: task.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s)),
    });
  }

  /**
   * Keeps the lifecycle status coherent with the schedule:
   * inbox ⇄ planned depending on whether open blocks exist; in_progress while
   * a timer runs. Terminal states (completed/cancelled/skipped) are left alone.
   */
  async function syncStatus(id: string): Promise<void> {
    const task = await store.tasks.get(id);
    if (!task || ["completed", "cancelled", "skipped"].includes(task.status)) return;
    const [blocks, entries] = await Promise.all([
      store.blocks.listBy("taskId", id),
      store.timeEntries.listBy("taskId", id),
    ]);
    const running = entries.some((e) => e.end === null);
    const hasPlanned = blocks.some((b) => b.status === "planned");
    const status: TaskStatus = running
      ? "in_progress"
      : task.status === "in_progress" && (hasPlanned || entries.length)
        ? "in_progress"
        : hasPlanned || task.recurrence
          ? "planned"
          : "inbox";
    if (status !== task.status) await store.tasks.put({ ...task, status, updatedAt: iso() });
  }

  return { create, update, remove, complete, reopen, setStatus, toggleSubtask, syncStatus };
}

export type TaskService = ReturnType<typeof createTaskService>;
