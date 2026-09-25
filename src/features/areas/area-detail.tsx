"use client";

import { Archive, ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { areaColorVar } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { Stat } from "@/components/shared/stat";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalProgressList } from "@/features/goals/goal-progress-list";
import { ProjectCard } from "@/features/projects/projects-view";
import { ProjectDialog } from "@/features/projects/project-dialog";
import { useProjectStats } from "@/features/projects/use-project-stats";
import { TasksView } from "@/features/tasks/tasks-view";
import { useAction } from "@/hooks/use-action";
import { formatHours } from "@/lib/date";
import { getServices } from "@/services";
import { AreaDialog } from "./area-dialog";
import { useAreaStats } from "./use-area-stats";

export function AreaDetail({ id }: { id: string }) {
  const { stats, lookups, today, isLoading } = useAreaStats();
  const projectStats = useProjectStats();
  const router = useRouter();
  const [edit, setEdit] = React.useState(false);
  const [newProject, setNewProject] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const remove = useAction(() => getServices().areas.remove(id), {
    invalidate: ["areas"],
    success: "Area deleted — tasks and projects were kept",
    onSuccess: () => router.push("/areas"),
  });
  const archive = useAction((archived: boolean) => getServices().areas.update(id, { archived }), {
    invalidate: ["areas"],
    success: (_, archived) => (archived ? "Area archived" : "Area restored"),
  });

  if (isLoading || projectStats.isLoading) return <Skeleton className="h-96" />;
  const area = lookups.areaById.get(id);
  if (!area) return <EmptyState title="Area not found." action={<Button asChild size="sm"><Link href="/areas">Back to areas</Link></Button>} />;
  const s = stats.get(id)!;
  const projects = [...projectStats.stats.values()].filter((p) => p.project.areaId === id);

  return (
    <>
      <Button asChild variant="link" size="sm" className="mb-2 h-auto text-muted-foreground">
        <Link href="/areas"><ArrowLeft /> Areas</Link>
      </Button>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: areaColorVar(area.color) }} aria-hidden />
            {area.name}
          </span>
        }
        description={area.description || undefined}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setEdit(true)}><Pencil /> Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => archive.mutate(!area.archived)}><Archive /> {area.archived ? "Restore" : "Archive"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirm(true)} aria-label="Delete area"><Trash2 /></Button>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Last 30 days" value={formatHours(s.minutes30)} hint={`${formatHours(s.planned30)} planned`} />
        <Stat label="Open tasks" value={s.openTasks} />
        <Stat label="Active projects" value={s.projects} />
        <Stat label="Goals" value={s.goals} />
      </div>
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <SectionTitle>Goals</SectionTitle>
            <GoalProgressList reference={today} periods={["weekly", "monthly", "long_term", "daily"]} areaId={id} columns={1} />
          </CardContent>
        </Card>
        <div>
          <SectionTitle action={<Button size="xs" variant="ghost" onClick={() => setNewProject(true)}><Plus /> Project</Button>}>Projects</SectionTitle>
          {projects.length === 0 ? (
            <EmptyState compact title="No projects in this area." />
          ) : (
            <div className="grid gap-3">
              {projects.map((p) => (
                <ProjectCard key={p.project.id} stats={p} area={area} today={today ?? ""} />
              ))}
            </div>
          )}
        </div>
      </div>
      <SectionTitle>Tasks</SectionTitle>
      <TasksView areaId={id} embedded />
      <AreaDialog open={edit} onOpenChange={setEdit} area={area} />
      <ProjectDialog open={newProject} onOpenChange={setNewProject} defaultAreaId={id} />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete “${area.name}”?`}
        description="Tasks and projects in this area are kept but lose their area. Consider archiving instead."
        confirmLabel="Delete area"
        destructive
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
