"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksView } from "@/features/tasks/tasks-view";
import { useAction } from "@/hooks/use-action";
import { useToday } from "@/hooks/use-now";
import { diffDays, formatDateKey, formatHours } from "@/lib/date";
import { getServices } from "@/services";
import { ProjectDialog } from "./project-dialog";
import { useProjectStats } from "./use-project-stats";

export function ProjectDetail({ id }: { id: string }) {
  const { stats, lookups, isLoading } = useProjectStats();
  const router = useRouter();
  const today = useToday() ?? "";
  const [edit, setEdit] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const remove = useAction(() => getServices().projects.remove(id), {
    invalidate: ["projects"],
    success: "Project deleted — its tasks were kept",
    onSuccess: () => router.push("/projects"),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  const s = stats.get(id);
  if (!s) {
    return <EmptyState title="Project not found." action={<Button asChild size="sm"><Link href="/projects">Back to projects</Link></Button>} />;
  }
  const area = s.project.areaId ? lookups.areaById.get(s.project.areaId) : undefined;
  const daysLeft = s.project.deadline && today ? diffDays(s.project.deadline, today) : null;

  return (
    <>
      <Button asChild variant="link" size="sm" className="mb-2 h-auto text-muted-foreground">
        <Link href="/projects"><ArrowLeft /> Projects</Link>
      </Button>
      <PageHeader
        title={s.project.name}
        description={
          <span className="inline-flex items-center gap-1.5">
            <AreaDot color={area?.color} /> {area?.name ?? "No area"} {s.project.description && `· ${s.project.description}`}
          </span>
        }
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setEdit(true)}><Pencil /> Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(true)} aria-label="Delete project"><Trash2 /></Button>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="text-xs text-muted-foreground">Progress</div>
          <div className="mt-1 text-xl font-semibold tabular">{s.percent}%</div>
          <Progress value={s.percent} className="mt-2" label="Project progress" />
        </div>
        <Stat label="Tasks" value={`${s.completed} / ${s.total}`} hint={`${s.open} open`} />
        <Stat label="Time spent" value={formatHours(s.minutesSpent)} hint={`${formatHours(s.plannedMinutes)} still planned`} />
        <Stat
          label="Deadline"
          value={s.project.deadline ? formatDateKey(s.project.deadline, "MMM d") : "—"}
          hint={daysLeft === null ? "No deadline" : daysLeft >= 0 ? `${daysLeft} days left` : `${-daysLeft} days past`}
        />
      </div>
      <TasksView projectId={id} embedded />
      <ProjectDialog open={edit} onOpenChange={setEdit} project={s.project} />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete “${s.project.name}”?`}
        description="The project is removed; its tasks stay in your task list without a project."
        confirmLabel="Delete project"
        destructive
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
