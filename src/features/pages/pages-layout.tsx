"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePages } from "@/hooks/queries";
import { PageTree } from "./page-tree";

/** Page tree beside the open page (desktop). */
export function PagesLayout({ children }: { children: React.ReactNode }) {
  const pages = usePages();
  return (
    <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden md:block">
        <div className="sticky top-6 max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-thin">
          <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pages</p>
          {pages.isLoading ? <Skeleton className="h-40" /> : <PageTree pages={pages.data ?? []} />}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
