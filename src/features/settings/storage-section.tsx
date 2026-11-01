"use client";

import { useQuery } from "@tanstack/react-query";
import { HardDrive, History, ShieldCheck } from "lucide-react";
import * as React from "react";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { getServices } from "@/services";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

/** Storage health: persistence, usage, and the safety snapshots taken before risky operations. */
export function StorageSection() {
  const storage = useQuery({
    queryKey: ["meta", "storage"],
    queryFn: async () => {
      const s = typeof navigator !== "undefined" ? navigator.storage : undefined;
      const [persisted, estimate] = await Promise.all([
        s?.persisted ? s.persisted() : Promise.resolve(null),
        s?.estimate ? s.estimate() : Promise.resolve(null),
      ]);
      return { persisted, usage: estimate?.usage ?? null, quota: estimate?.quota ?? null };
    },
  });
  const snapshots = useQuery({ queryKey: ["meta", "snapshots"], queryFn: () => getServices().data.snapshots() });
  const persist = useAction(
    async () => {
      const ok = await navigator.storage.persist();
      await storage.refetch();
      return ok;
    },
    { invalidate: [], success: (ok) => (ok ? "Your browser will keep this data" : "The browser declined — installing the app usually helps") },
  );
  const [restoreId, setRestoreId] = React.useState<string | null>(null);
  const restore = useAction((id: string) => getServices().data.restoreSnapshot(id), {
    invalidate: ["all"],
    success: "Snapshot restored",
    onSuccess: () => setTimeout(() => window.location.reload(), 600),
  });

  const s = storage.data;
  return (
    <div className="space-y-3 rounded-lg border border-border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className={s?.persisted ? "size-4 text-success" : "size-4 text-warning"} />
          {s?.persisted === null || s === undefined
            ? "Persistence unknown"
            : s.persisted
              ? "Protected from automatic clean-up"
              : "Not protected: the browser may clear it when space runs low"}
        </span>
        {s && !s.persisted && s.persisted !== null && (
          <Button size="xs" variant="secondary" onClick={() => persist.mutate()}>
            Protect my data
          </Button>
        )}
        {s?.usage != null && (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <HardDrive className="size-4" />
            {formatBytes(s.usage)} used{s.quota ? ` of ${formatBytes(s.quota)}` : ""}
          </span>
        )}
      </div>
      <div>
        <div className="mb-1 flex items-center gap-1.5 font-medium">
          <History className="size-4" /> Safety snapshots
        </div>
        <p className="mb-2 text-xs text-muted-foreground">Taken automatically before data upgrades, imports and restores. The last 3 are kept.</p>
        {(snapshots.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">None yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {snapshots.data!.map((snap) => (
              <li key={snap.id} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{snap.reason}</span>
                  <span className="text-xs text-muted-foreground tabular">
                    {new Date(snap.createdAt).toLocaleString()} · {snap.tasks} tasks
                  </span>
                </span>
                <Button size="xs" variant="ghost" onClick={() => setRestoreId(snap.id)}>
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={restoreId !== null}
        onOpenChange={(o) => !o && setRestoreId(null)}
        title="Restore this snapshot?"
        description="Your current data is replaced by the snapshot. A snapshot of the current data is taken first, so you can switch back."
        confirmLabel="Restore"
        onConfirm={() => restoreId && restore.mutate(restoreId)}
      />
    </div>
  );
}
