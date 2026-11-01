"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAction } from "@/hooks/use-action";
import { useTrash } from "@/hooks/queries";
import { useNow } from "@/hooks/use-now";
import { getServices } from "@/services";
import { TRASH_RETENTION_DAYS, type EntityType, type TrashItem } from "@/types/domain";

const TYPE_LABEL: Partial<Record<EntityType, string>> = {
  task: "Task",
  project: "Project",
  area: "Area",
  goal: "Goal",
  habit: "Habit",
  page: "Page",
  inbox: "Inbox item",
  review: "Review",
  template: "Template",
};

/** Deleted items with everything that went with them; restored as a whole. */
export function TrashView() {
  const trash = useTrash();
  const now = useNow();
  const [confirmEmpty, setConfirmEmpty] = React.useState(false);
  const empty = useAction(() => getServices().trash.empty(), { invalidate: ["trash"], success: (n) => `Deleted ${n} item${n === 1 ? "" : "s"} forever` });

  if (trash.isLoading || !now) return <Skeleton className="h-96" />;
  const items = trash.data ?? [];

  return (
    <>
      <PageHeader
        title="Trash"
        description={`Deleted things stay here for ${TRASH_RETENTION_DAYS} days. Restoring brings back everything that was deleted with them.`}
        actions={
          items.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setConfirmEmpty(true)}>
              <Trash2 /> Empty trash
            </Button>
          )
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={Trash2} title="Trash is empty." description="Deleted tasks, projects, pages and more show up here." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border" aria-label="Deleted items">
            {items.map((item) => (
              <TrashRow key={item.id} item={item} now={now} />
            ))}
          </ul>
        </Card>
      )}
      <ConfirmDialog
        open={confirmEmpty}
        onOpenChange={setConfirmEmpty}
        title="Empty the trash?"
        description={`${items.length} item${items.length === 1 ? "" : "s"} will be deleted forever. This can’t be undone.`}
        confirmLabel="Delete forever"
        destructive
        onConfirm={() => empty.mutate()}
      />
    </>
  );
}

function TrashRow({ item, now }: { item: TrashItem; now: Date }) {
  const restore = useAction(() => getServices().trash.restore(item.id), { invalidate: ["all"], success: `Restored “${item.title}”` });
  const remove = useAction(() => getServices().trash.deleteForever(item.id), { invalidate: ["trash"], success: "Deleted forever" });
  const ageDays = Math.floor((now.getTime() - new Date(item.deletedAt).getTime()) / 864e5);
  const left = Math.max(0, TRASH_RETENTION_DAYS - ageDays);
  const extra = item.rows.length - 1;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TYPE_LABEL[item.type] ?? item.type}</Badge>
          <span className="truncate font-medium">{item.title}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Deleted {ageDays === 0 ? "today" : `${ageDays} day${ageDays === 1 ? "" : "s"} ago`} · {left} day{left === 1 ? "" : "s"} left
          {extra > 0 && ` · with ${extra} related item${extra === 1 ? "" : "s"}`}
          {item.relinks.length > 0 && ` · ${item.relinks.length} link${item.relinks.length === 1 ? "" : "s"} to restore`}
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={() => restore.mutate()} disabled={restore.isPending}>
        <RotateCcw /> Restore
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={() => remove.mutate()} aria-label={`Delete ${item.title} forever`}>
        <Trash2 />
      </Button>
    </li>
  );
}
