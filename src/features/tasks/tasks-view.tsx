"use client";

import { CheckSquare, Pencil, Plus, Repeat, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, NativeSelect } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllBlocks, usePriorityLabel } from "@/hooks/queries";
import { useToday } from "@/hooks/use-now";
import { formatDuration, relativeDayLabel } from "@/lib/date";
import { describeRecurrence } from "@/lib/recurrence";
import { cn } from "@/lib/utils/cn";
import { ui } from "@/store/ui-store";
import { PRIORITIES, type Task } from "@/types/domain";
import { workActions } from "./actions";
import { PriorityBadge, StatusBadge } from "./task-status";
import { useLookups } from "./use-lookups";

type StatusFilter = "open" | "all" | "unscheduled" | "completed" | "skipped" | "recurring";
const PRIORITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export function TasksView({ projectId, areaId, embedded }: { projectId?: string; areaId?: string; embedded?: boolean }) {
  const lookups = useLookups();
  const blocks = useAllBlocks();
  const priorityLabel = usePriorityLabel();
  const today = useToday() ?? "";
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("open");
  const [area, setArea] = React.useState(areaId ?? "");
  const [project, setProject] = React.useState(projectId ?? "");
  const [priority, setPriority] = React.useState("");
  const [sort, setSort] = React.useState<"priority" | "due" | "created" | "title">("priority");
  const deferredQuery = React.useDeferredValue(query);

  const nextBlock = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const b of blocks.data ?? []) {
      if (b.status !== "planned") continue;
      const cur = m.get(b.taskId);
      if (!cur || b.date < cur) m.set(b.taskId, b.date);
    }
    return m;
  }, [blocks.data]);

  const filtered = React.useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = lookups.tasks.filter((t) => {
      if (projectId && t.projectId !== projectId) return false;
      if (areaId && t.areaId !== areaId) return false;
      if (area && t.areaId !== area) return false;
      if (project && t.projectId !== project) return false;
      if (priority && t.priority !== priority) return false;
      const open = ["inbox", "planned", "in_progress"].includes(t.status);
      if (status === "open" && !open) return false;
      if (status === "unscheduled" && !(open && !t.recurrence && !nextBlock.has(t.id))) return false;
      if (status === "completed" && t.status !== "completed") return false;
      if (status === "skipped" && t.status !== "skipped" && t.status !== "cancelled") return false;
      if (status === "recurring" && !t.recurrence) return false;
      if (q && !`${t.title} ${t.description} ${t.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const cmp: Record<typeof sort, (a: Task, b: Task) => number> = {
      priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"),
      due: (a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"),
      created: (a, b) => b.createdAt.localeCompare(a.createdAt),
      title: (a, b) => a.title.localeCompare(b.title),
    };
    return list.sort(cmp[sort]);
  }, [lookups.tasks, deferredQuery, status, area, project, priority, sort, nextBlock, projectId, areaId]);

  const [limit, setLimit] = React.useState(100);

  if (lookups.isLoading) return <Skeleton className="h-96" />;

  return (
    <>
      {!embedded && (
        <PageHeader
          title="Tasks"
          description="Every piece of work, scheduled or not."
          actions={
            <Button size="sm" onClick={() => ui.newTask({ areaId: areaId ?? null, projectId: projectId ?? null })}>
              <Plus /> New task
            </Button>
          }
        />
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" className="pl-8" aria-label="Search tasks" />
        </div>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="w-auto" aria-label="Status filter">
          <option value="open">Open</option>
          <option value="unscheduled">Unscheduled</option>
          <option value="recurring">Recurring</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped / cancelled</option>
          <option value="all">All</option>
        </NativeSelect>
        {!areaId && (
          <NativeSelect value={area} onChange={(e) => setArea(e.target.value)} className="w-auto" aria-label="Area filter">
            <option value="">All areas</option>
            {lookups.areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </NativeSelect>
        )}
        {!projectId && (
          <NativeSelect value={project} onChange={(e) => setProject(e.target.value)} className="w-auto" aria-label="Project filter">
            <option value="">All projects</option>
            {lookups.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
        )}
        <NativeSelect value={priority} onChange={(e) => setPriority(e.target.value)} className="w-auto" aria-label="Priority filter">
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{priorityLabel(p)}</option>
          ))}
        </NativeSelect>
        <NativeSelect value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="w-auto" aria-label="Sort by">
          <option value="priority">Sort: priority</option>
          <option value="due">Sort: due date</option>
          <option value="created">Sort: newest</option>
          <option value="title">Sort: title</option>
        </NativeSelect>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={lookups.tasks.length === 0 ? "No tasks yet." : "No tasks match these filters."}
          description={lookups.tasks.length === 0 ? "Press N or ⌘K to add your first task." : undefined}
          action={<Button size="sm" onClick={() => ui.newTask({ areaId: areaId ?? null, projectId: projectId ?? null })}><Plus /> New task</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border" aria-label="Tasks">
            {filtered.slice(0, limit).map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                areaName={t.areaId ? lookups.areaById.get(t.areaId)?.name : undefined}
                areaColor={t.areaId ? lookups.areaById.get(t.areaId)?.color : undefined}
                projectName={t.projectId ? lookups.projectById.get(t.projectId)?.name : undefined}
                next={nextBlock.get(t.id)}
                today={today}
              />
            ))}
          </ul>
          {filtered.length > limit && (
            <div className="border-t border-border p-2 text-center">
              <Button size="sm" variant="ghost" onClick={() => setLimit((l) => l + 200)}>
                Show more ({filtered.length - limit} remaining)
              </Button>
            </div>
          )}
        </Card>
      )}
    </>
  );
}

const TaskRow = React.memo(function TaskRow({
  task,
  areaName,
  areaColor,
  projectName,
  next,
  today,
}: {
  task: Task;
  areaName?: string;
  areaColor?: string;
  projectName?: string;
  next?: string;
  today: string;
}) {
  const done = task.status === "completed";
  const subDone = task.subtasks.filter((s) => s.done).length;
  return (
    <li className="group flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30">
      {task.recurrence ? (
        <Repeat className="size-4 shrink-0 text-muted-foreground" aria-label="Recurring" />
      ) : (
        <Checkbox
          checked={done}
          onCheckedChange={() => (done ? workActions.reopenTask(task) : workActions.completeTask(task))}
          aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        />
      )}
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => ui.editTask(task.id)}>
        <div className={cn("flex items-center gap-2 truncate text-sm font-medium", done && "text-muted-foreground")}>
          <span className="truncate">{task.title}</span>
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular">
          {areaName && (
            <span className="inline-flex items-center gap-1">
              <AreaDot color={areaColor} /> {areaName}
            </span>
          )}
          {projectName && <span>· {projectName}</span>}
          <span>· {formatDuration(task.estimatedMinutes)}</span>
          {task.recurrence && <span>· {describeRecurrence(task.recurrence)}</span>}
          {task.subtasks.length > 0 && <span>· {subDone}/{task.subtasks.length} subtasks</span>}
          {task.dueDate && <span className={cn(task.dueDate < today && !done && "text-warning")}>· due {relativeDayLabel(task.dueDate, today)}</span>}
          {next && !done && <span>· next {relativeDayLabel(next, today)}</span>}
          {task.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </button>
      <span className="hidden sm:block">
        <StatusBadge status={task.status} />
      </span>
      <div className="flex opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button size="icon-xs" variant="ghost" onClick={() => ui.editTask(task.id)} aria-label={`Edit ${task.title}`}>
          <Pencil />
        </Button>
        <Button size="icon-xs" variant="ghost" onClick={() => workActions.deleteTask(task)} aria-label={`Delete ${task.title}`}>
          <Trash2 />
        </Button>
      </div>
    </li>
  );
});
