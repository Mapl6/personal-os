"use client";

import { Compass, Plus } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { areaColorVar } from "@/components/shared/area";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHours } from "@/lib/date";
import { AreaDialog } from "./area-dialog";
import { useAreaStats } from "./use-area-stats";

export function AreasView() {
  const { stats, lookups, isLoading } = useAreaStats();
  const [open, setOpen] = React.useState(false);
  if (isLoading) return <Skeleton className="h-96" />;
  const areas = lookups.areas.filter((a) => !a.archived);
  const max = Math.max(1, ...areas.map((a) => stats.get(a.id)?.minutes30 ?? 0));

  return (
    <>
      <PageHeader
        title="Areas"
        description="Permanent life categories. Balance matters more than volume."
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus /> New area</Button>}
      />
      {areas.length === 0 ? (
        <EmptyState icon={Compass} title="No areas yet." description="Areas like Frontend, Startup + AI, Health and Personal." action={<Button size="sm" onClick={() => setOpen(true)}><Plus /> Create area</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {areas.map((a) => {
            const s = stats.get(a.id)!;
            return (
              <Link key={a.id} href={`/areas/${a.id}`}>
                <Card className="relative h-full overflow-hidden p-4 transition-colors hover:bg-accent/30">
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: areaColorVar(a.color) }} />
                  <h2 className="font-semibold">{a.name}</h2>
                  {a.description && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{a.description}</p>}
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-sm tabular">
                    <div><dt className="text-xs text-muted-foreground">Open tasks</dt><dd className="font-medium">{s.openTasks}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Projects</dt><dd className="font-medium">{s.projects}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Goals</dt><dd className="font-medium">{s.goals}</dd></div>
                  </dl>
                  <div className="mt-3 text-xs text-muted-foreground tabular">
                    {formatHours(s.minutes30)} in the last 30 days
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(s.minutes30 / max) * 100}%`, background: areaColorVar(a.color) }} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <AreaDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
