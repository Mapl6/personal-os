"use client";

import { FileText, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader, SectionTitle } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePages } from "@/hooks/queries";
import type { Page } from "@/types/domain";
import { pageActions, pageTitle } from "./actions";
import { PageTree } from "./page-tree";

export function PagesIndex() {
  const pages = usePages();
  const router = useRouter();
  const all = pages.data ?? [];
  const favourites = all.filter((p) => p.favourite);
  const recent = [...all]
    .filter((p) => p.kind !== "template")
    .sort((a, b) => (b.lastOpenedAt ?? b.updatedAt).localeCompare(a.lastOpenedAt ?? a.updatedAt))
    .slice(0, 8);
  const create = async () => {
    const p = await pageActions.create();
    if (p) router.push(`/pages/${p.id}`);
  };

  return (
    <>
      <PageHeader
        title="Pages"
        description="Notes, docs and wikis. Type [[ to link pages, @ to mention tasks and projects, # to tag."
        actions={
          <Button size="sm" onClick={create}>
            <Plus /> New page
          </Button>
        }
      />
      {pages.isLoading ? (
        <Skeleton className="h-64" />
      ) : all.length === 0 ? (
        <EmptyState icon={FileText} title="No pages yet." description="Pages hold anything longer than a task: notes, plans, research." action={<Button onClick={create}><Plus /> Create your first page</Button>} />
      ) : (
        <div className="space-y-6">
          <div className="md:hidden">
            <PageTree pages={all} />
          </div>
          {favourites.length > 0 && <PageList title="Favourites" icon={<Star className="size-4" />} pages={favourites} />}
          <PageList title="Recently opened" pages={recent} />
        </div>
      )}
    </>
  );
}

function PageList({ title, pages, icon }: { title: string; pages: Page[]; icon?: React.ReactNode }) {
  return (
    <section>
      <SectionTitle>
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
      </SectionTitle>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {pages.map((p) => (
            <li key={p.id}>
              <Link href={p.kind === "page" || p.kind === "template" ? `/pages/${p.id}` : `/daily/${p.periodStart}`} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent">
                {p.icon ? <span>{p.icon}</span> : <FileText className="size-4 text-muted-foreground" />}
                <span className="flex-1 truncate">{pageTitle(p)}</span>
                <span className="text-xs text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
