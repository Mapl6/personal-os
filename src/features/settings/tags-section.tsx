"use client";

import { Check, Pencil, Tag, Trash2 } from "lucide-react";
import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { useTasks } from "@/hooks/queries";
import { getServices } from "@/services";

/** Rename, merge (rename onto an existing tag) or delete tags across all tasks. */
export function TagsSection() {
  const tasks = useTasks();
  const counts = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tasks.data ?? []) for (const tag of t.tags) m.set(tag, (m.get(tag) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [tasks.data]);
  if (counts.length === 0) return <EmptyState compact icon={Tag} title="No tags yet." description="Add tags in the task editor or with #tag in quick add." />;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {counts.map(([tag, n]) => (
        <TagRow key={tag} tag={tag} count={n} />
      ))}
    </ul>
  );
}

function TagRow({ tag, count }: { tag: string; count: number }) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(tag);
  const rename = useAction(() => getServices().tasks.renameTag(tag, name), {
    invalidate: ["work"],
    success: (n) => `Renamed #${tag} → #${name.trim().toLowerCase()} on ${n} task${n === 1 ? "" : "s"}`,
    onSuccess: () => setEditing(false),
  });
  const remove = useAction(() => getServices().tasks.deleteTag(tag), { invalidate: ["work"], success: (n) => `Removed #${tag} from ${n} task${n === 1 ? "" : "s"}` });
  return (
    <li className="flex items-center gap-2 px-3 py-1.5 text-sm">
      {editing ? (
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && name !== tag) rename.mutate();
            else setEditing(false);
          }}
        >
          <Input className="h-8" autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label={`New name for #${tag}`} />
          <Button type="submit" size="icon-sm" variant="secondary" aria-label="Save tag"><Check /></Button>
        </form>
      ) : (
        <>
          <span className="flex-1">#{tag}</span>
          <span className="text-xs text-muted-foreground tabular">{count} task{count === 1 ? "" : "s"}</span>
          <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} aria-label={`Rename #${tag}`}><Pencil /></Button>
          <Button size="icon-xs" variant="ghost" onClick={() => remove.mutate()} aria-label={`Delete #${tag}`}><Trash2 /></Button>
        </>
      )}
    </li>
  );
}
