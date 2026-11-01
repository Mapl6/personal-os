"use client";

import { ChevronRight, FileText, MoreHorizontal, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { usePages } from "@/hooks/queries";
import { ancestors, pageActions, pageTitle } from "./actions";
import { PageDocument } from "./page-document";

export function PageView({ id }: { id: string }) {
  const pages = usePages();
  const router = useRouter();
  if (pages.isLoading) return <Skeleton className="h-96" />;
  const all = pages.data ?? [];
  const page = all.find((p) => p.id === id);
  if (!page) {
    return (
      <EmptyState
        icon={FileText}
        title="This page doesn’t exist."
        description="It may have been deleted — check the trash."
        action={<Button variant="secondary" asChild><Link href="/trash">Open trash</Link></Button>}
      />
    );
  }
  const trail = ancestors(all, id);
  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-2">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <Link href="/pages" className="hover:text-foreground">Pages</Link>
          {trail.map((p) => (
            <span key={p.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0" />
              <Link href={`/pages/${p.id}`} className="truncate hover:text-foreground">{pageTitle(p)}</Link>
            </span>
          ))}
        </nav>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" onClick={() => pageActions.favourite(page)} aria-label={page.favourite ? "Remove from favourites" : "Add to favourites"} aria-pressed={page.favourite}>
            <Star className={page.favourite ? "fill-warning text-warning" : ""} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Page options">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                destructive
                onSelect={async () => {
                  const done = await pageActions.remove(page);
                  if (done) router.push(page.parentId ? `/pages/${page.parentId}` : "/pages");
                }}
              >
                <Trash2 /> Delete page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <PageDocument page={page} />
    </>
  );
}
