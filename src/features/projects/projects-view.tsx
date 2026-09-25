"use client";

import { CalendarClock, FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { AreaDot } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToday } from "@/hooks/use-now";
import { diffDays, formatDateKey, formatHours } from "@/lib/date";
import { cn } from "@/lib/utils/cn";
import type { ProjectStats } from "@/lib/analytics/projects";
import type { Area } from "@/types/domain";
import { ProjectDialog } from "./project-dialog";
import { useProjectStats } from "./use-project-stats";

export function ProjectsView() {
  const { stats, lookups, isLoading } = useProjectStats();
  const [open, setOpen] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const today = useToday() ?? "";
  if (isLoading) return <Skeleton className="h-96" />;
  const list = [...stats.values()].filter((s) => showAll || s.project.status === "active" || s.project.status === "paused");

  return (
    <>
      <PageHeader
        title="Projects"
        description="Bodies of work with an outcome. Each groups the tasks that get you there."
        actions={
          <>
            <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Hide completed" : "Show all"}
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus /> New project
            </Button>
          </>
        }
      />
      {list.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet." description="E.g. “Frontend Mastery” or “Startup MVP”." action={<Button size="sm" onClick={() => setOpen(true)}><Plus /> Create project</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <ProjectCard key={s.project.id} stats={s} area={s.project.areaId ? lookups.areaById.get(s.project.areaId) : undefined} today={today} />
          ))}
        </div>
      )}
      <ProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ProjectCard({ stats, area, today }: { stats: ProjectStats; area?: Area; today: string }) {
  const { project } = stats;
  const daysLeft = project.deadline && today ? diffDays(project.deadline, today) : null;
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="h-full p-4 transition-colors hover:bg-accent/30">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AreaDot color={area?.color} /> {area?.name ?? "No area"}
            </div>
            <h2 className="mt-1 truncate font-semibold">{project.name}</h2>
          </div>
          {project.status !== "active" && <Badge>{project.status}</Badge>}
        </div>
        {project.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>}
        <div className="mt-4 flex items-baseline justify-between text-sm tabular">
          <span className="font-medium">{stats.percent}%</span>
          <span className="text-xs text-muted-foreground">
            {stats.completed}/{stats.total} tasks · {formatHours(stats.minutesSpent)} spent
          </span>
        </div>
        <Progress value={stats.percent} className="mt-1.5" label={`${project.name} progress`} />
        {project.deadline && (
          <div className={cn("mt-3 flex items-center gap-1.5 text-xs", daysLeft !== null && daysLeft < 7 ? "text-warning" : "text-muted-foreground")}>
            <CalendarClock className="size-3.5" />
            {formatDateKey(project.deadline, "MMM d, yyyy")}
            {daysLeft !== null && (daysLeft >= 0 ? ` · ${daysLeft} days left` : ` · ${-daysLeft} days past`)}
          </div>
        )}
      </Card>
    </Link>
  );
}
