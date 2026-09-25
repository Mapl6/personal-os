"use client";

import { Archive, Flag, MoreHorizontal, Pencil, Plus, Target, Trash2 } from "lucide-react";
import * as React from "react";
import { AreaDot, areaColorVar } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLookups } from "@/features/tasks/use-lookups";
import { useAction } from "@/hooks/use-action";
import { useToday } from "@/hooks/use-now";
import { formatDateKey } from "@/lib/date";
import type { GoalProgressResult } from "@/lib/goals/progress";
import { cn } from "@/lib/utils/cn";
import { getServices } from "@/services";
import { ui } from "@/store/ui-store";
import type { Goal, GoalPeriod } from "@/types/domain";
import { GoalDialog } from "./goal-dialog";
import { useGoalProgressList } from "./use-goal-progress";

const TABS: { value: GoalPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "daily", label: "Daily" },
  { value: "long_term", label: "Long-term" },
];

export function GoalsView({ openNew }: { openNew?: boolean }) {
  const today = useToday();
  const { results, isLoading } = useGoalProgressList(today);
  const [dialog, setDialog] = React.useState<{ goal?: Goal } | null>(openNew ? {} : null);

  if (isLoading || !today) return <Skeleton className="h-96" />;

  return (
    <>
      <PageHeader
        title="Goals"
        description="Daily, weekly and monthly targets, and long-term goals broken into milestones and tasks."
        actions={<Button size="sm" onClick={() => setDialog({})}><Plus /> New goal</Button>}
      />
      <Tabs defaultValue="weekly">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <span className="text-xs text-muted-foreground">{results.filter((r) => r.goal.period === t.value).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => {
          const list = results.filter((r) => r.goal.period === t.value);
          return (
            <TabsContent key={t.value} value={t.value}>
              {list.length === 0 ? (
                <EmptyState icon={Target} title={`No ${t.label.toLowerCase()} goals.`} description={t.value === "long_term" ? "E.g. “Become a senior frontend developer”, with milestones." : "E.g. Frontend · 8 hours, Gym · 2 sessions."} action={<Button size="sm" onClick={() => setDialog({})}><Plus /> New goal</Button>} />
              ) : (
                <div className={cn("grid gap-3", t.value === "long_term" ? "lg:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3")}>
                  {list.map((r) => (
                    <GoalCard key={r.goal.id} result={r} onEdit={() => setDialog({ goal: r.goal })} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
      <GoalDialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)} goal={dialog?.goal} />
    </>
  );
}

function GoalCard({ result, onEdit }: { result: GoalProgressResult; onEdit: () => void }) {
  const { goal } = result;
  const lookups = useLookups();
  const area = goal.areaId ? lookups.areaById.get(goal.areaId) : undefined;
  const [confirm, setConfirm] = React.useState(false);
  const [logValue, setLogValue] = React.useState("");
  const [milestone, setMilestone] = React.useState("");
  const g = () => getServices().goals;
  const log = useAction((v: number) => g().logProgress(goal.id, v), { invalidate: ["goals"], success: (_, v) => `Logged ${v} ${result.unitLabel}` });
  const remove = useAction(() => g().remove(goal.id), { invalidate: ["goals", "work"], success: "Goal deleted" });
  const archive = useAction(() => g().update(goal.id, { archived: true }), { invalidate: ["goals"], success: "Goal archived" });
  const addMs = useAction((title: string) => g().addMilestone(goal.id, title), { invalidate: ["goals"] });
  const toggleMs = useAction((id: string) => g().toggleMilestone(goal.id, id), { invalidate: ["goals"] });
  const removeMs = useAction((id: string) => g().removeMilestone(goal.id, id), { invalidate: ["goals"] });
  const linkedTasks = lookups.tasks.filter((t) => t.goalId === goal.id);
  const msDone = goal.milestones.filter((m) => m.done).length;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AreaDot color={area?.color} /> {area?.name ?? "Any area"}
            <Badge variant="outline">{goal.tracking === "auto" ? "auto" : "manual"}</Badge>
          </div>
          <h2 className="mt-1 font-semibold">{goal.title}</h2>
          {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-xs" variant="ghost" aria-label={`Actions for ${goal.title}`}><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => ui.newTask({ goalId: goal.id, areaId: goal.areaId, projectId: goal.projectId })}><Plus /> Add task for this goal</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => archive.mutate()}><Archive /> Archive</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => setConfirm(true)}><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-baseline justify-between text-sm tabular">
        <span className={cn("font-medium", result.percent >= 100 && "text-success")}>{result.label}</span>
        <span className="text-xs text-muted-foreground">
          {result.percent}%
          {goal.period !== "long_term" && ` · ${formatDateKey(result.range.from, "MMM d")}${result.range.to !== result.range.from ? `–${formatDateKey(result.range.to, "MMM d")}` : ""}`}
        </span>
      </div>
      <Progress value={result.percent} className="mt-1.5 h-2" color={areaColorVar(area?.color ?? "indigo")} label={`${goal.title} progress`} />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {goal.deadline && <span>Deadline {formatDateKey(goal.deadline, "MMM d, yyyy")}</span>}
        {linkedTasks.length > 0 && <span>· {linkedTasks.length} linked tasks</span>}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="xs" variant="secondary" className="ml-auto"><Plus /> Log progress</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = Number(logValue);
                if (!Number.isFinite(v) || v === 0) return;
                log.mutate(v);
                setLogValue("");
              }}
            >
              <label className="text-xs text-muted-foreground" htmlFor={`log-${goal.id}`}>
                Add {result.unitLabel === "h" ? "hours" : result.unitLabel} {goal.tracking === "auto" && "(adjustment on top of automatic progress)"}
              </label>
              <Input id={`log-${goal.id}`} type="number" step="any" value={logValue} onChange={(e) => setLogValue(e.target.value)} autoFocus />
              <Button type="submit" size="sm" className="w-full" disabled={log.isPending}>Log</Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {(goal.period === "long_term" || goal.milestones.length > 0) && (
        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Flag className="size-3.5" /> Milestones</span>
            <span className="tabular">{msDone}/{goal.milestones.length}</span>
          </div>
          <ul className="space-y-1">
            {goal.milestones.map((m) => {
              const tasks = linkedTasks.filter((t) => t.milestoneId === m.id);
              return (
                <li key={m.id} className="group flex items-center gap-2 text-sm">
                  <Checkbox checked={m.done} onCheckedChange={() => toggleMs.mutate(m.id)} aria-label={`Milestone ${m.title}`} />
                  <span className={cn("flex-1", m.done && "text-muted-foreground line-through")}>{m.title}</span>
                  {tasks.length > 0 && <span className="text-xs text-muted-foreground">{tasks.filter((t) => t.status === "completed").length}/{tasks.length} tasks</span>}
                  <Button size="icon-xs" variant="ghost" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Add task to ${m.title}`} onClick={() => ui.newTask({ goalId: goal.id, milestoneId: m.id, areaId: goal.areaId, title: m.title })}>
                    <Plus />
                  </Button>
                  <Button size="icon-xs" variant="ghost" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Remove ${m.title}`} onClick={() => removeMs.mutate(m.id)}>
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!milestone.trim()) return;
              addMs.mutate(milestone.trim());
              setMilestone("");
            }}
          >
            <Input className="h-8" value={milestone} onChange={(e) => setMilestone(e.target.value)} placeholder="Add milestone" aria-label="New milestone" />
            <Button type="submit" size="sm" variant="secondary">Add</Button>
          </form>
        </div>
      )}
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`Delete “${goal.title}”?`} description="Progress logs are removed; linked tasks are kept." confirmLabel="Delete" destructive onConfirm={() => remove.mutate()} />
    </Card>
  );
}
