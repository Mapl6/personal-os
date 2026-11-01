"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  FileText,
  IndentDecrease,
  IndentIncrease,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import type { Page } from "@/types/domain";
import { buildTree, pageActions, pageTitle } from "./actions";

const OPEN_KEY = "pos-page-tree-open";

function useOpenSet() {
  const [open, setOpen] = React.useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(OPEN_KEY) ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const toggle = (id: string, value?: boolean) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (value ?? !next.has(id)) next.add(id);
      else next.delete(id);
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  return { open, toggle };
}

/** Nested page tree with keyboard-free reordering (move up/down, indent/outdent). */
export function PageTree({ pages }: { pages: Page[] }) {
  const tree = React.useMemo(() => buildTree(pages), [pages]);
  const { open, toggle } = useOpenSet();
  const router = useRouter();
  const roots = tree.get(null) ?? [];

  const addChild = async (parentId: string | null) => {
    const p = await pageActions.create(parentId);
    if (!p) return;
    if (parentId) toggle(parentId, true);
    router.push(`/pages/${p.id}`);
  };

  return (
    <nav aria-label="Pages">
      <ul role="tree" className="space-y-px">
        {roots.map((p, i) => (
          <TreeNode key={p.id} page={p} depth={0} tree={tree} siblings={roots} index={i} open={open} toggle={toggle} onAdd={addChild} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => addChild(null)}
        className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Plus className="size-4" /> New page
      </button>
    </nav>
  );
}

function TreeNode({
  page,
  depth,
  tree,
  siblings,
  index,
  open,
  toggle,
  onAdd,
}: {
  page: Page;
  depth: number;
  tree: Map<string | null, Page[]>;
  siblings: Page[];
  index: number;
  open: Set<string>;
  toggle: (id: string, v?: boolean) => void;
  onAdd: (parentId: string | null) => void;
}) {
  const pathname = usePathname();
  const children = tree.get(page.id) ?? [];
  const isOpen = open.has(page.id);
  const active = pathname === `/pages/${page.id}`;
  const prev = siblings[index - 1];
  const next = siblings[index + 1];

  return (
    <li role="treeitem" aria-expanded={children.length ? isOpen : undefined} aria-selected={active}>
      <div
        className={cn("group flex items-center gap-0.5 rounded-md pr-1 text-sm hover:bg-accent", active && "bg-accent font-medium")}
        style={{ paddingLeft: depth * 14 + 2 }}
      >
        <button
          type="button"
          onClick={() => toggle(page.id)}
          aria-label={isOpen ? "Collapse" : "Expand"}
          className={cn("grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted", !children.length && "invisible")}
        >
          <ChevronRight className={cn("size-3.5 transition-transform", isOpen && "rotate-90")} />
        </button>
        <Link href={`/pages/${page.id}`} className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5">
          {page.icon ? <span className="w-4 text-center leading-none">{page.icon}</span> : <FileText className="size-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{pageTitle(page)}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100" aria-label={`Options for ${pageTitle(page)}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onAdd(page.id)}>
              <Plus /> Add sub-page
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => pageActions.favourite(page)}>
              <Star /> {page.favourite ? "Remove from favourites" : "Add to favourites"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!prev} onSelect={() => prev && pageActions.move(page.id, { parentId: page.parentId, before: prev.id })}>
              <ArrowUp /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!next} onSelect={() => next && pageActions.move(page.id, { parentId: page.parentId, after: next.id })}>
              <ArrowDown /> Move down
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!prev}
              onSelect={() => {
                if (!prev) return;
                pageActions.move(page.id, { parentId: prev.id });
                toggle(prev.id, true);
              }}
            >
              <IndentIncrease /> Nest under “{prev ? pageTitle(prev) : "…"}”
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!page.parentId}
              onSelect={() => page.parentId && pageActions.move(page.id, { parentId: findParent(tree, page.parentId), after: page.parentId })}
            >
              <IndentDecrease /> Move out one level
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => pageActions.remove(page)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="icon-sm" variant="ghost" className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onAdd(page.id)} aria-label={`Add page inside ${pageTitle(page)}`}>
          <Plus />
        </Button>
      </div>
      {isOpen && children.length > 0 && (
        <ul role="group" className="space-y-px">
          {children.map((c, i) => (
            <TreeNode key={c.id} page={c} depth={depth + 1} tree={tree} siblings={children} index={i} open={open} toggle={toggle} onAdd={onAdd} />
          ))}
        </ul>
      )}
    </li>
  );
}

function findParent(tree: Map<string | null, Page[]>, id: string): string | null {
  for (const [parent, list] of tree) if (list.some((p) => p.id === id)) return parent;
  return null;
}
