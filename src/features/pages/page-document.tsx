"use client";

import { Link2, Smile } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useBacklinks, useFeatures, usePageContent, usePages } from "@/hooks/queries";
import { getServices } from "@/services";
import type { Link as LinkRow, Page } from "@/types/domain";
import { pageActions, pageTitle } from "./actions";
import { hrefFor } from "./editor/schema";

const PageEditor = dynamic(() => import("./editor/page-editor"), {
  ssr: false,
  loading: () => <Skeleton className="h-48" />,
});

const ICONS = ["📄", "📝", "📚", "💡", "🎯", "🧠", "📌", "🗂️", "🚀", "🌱", "💼", "🏠", "❤️", "🧪", "🎨", "🎵", "✈️", "💰", "🏃", "🍳", "📅", "⭐", "🔥", "✅"];

/** Title, icon, editor and backlinks for one page. Shared by /pages/[id] and daily notes. */
export function PageDocument({ page, titlePlaceholder = "Untitled", fixedTitle }: { page: Page; titlePlaceholder?: string; fixedTitle?: string }) {
  const content = usePageContent(page.id);
  const features = useFeatures();
  React.useEffect(() => {
    getServices().pages.touch(page.id).catch(() => {});
  }, [page.id]);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-2 flex items-start gap-2">
        {!fixedTitle && <IconPicker page={page} />}
        {fixedTitle ? (
          <h1 className="text-3xl font-bold tracking-tight">{fixedTitle}</h1>
        ) : (
          <TitleInput key={page.id} page={page} placeholder={titlePlaceholder} />
        )}
      </div>
      {content.isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <PageEditor key={page.id} page={page} initial={(content.data?.doc as unknown[]) ?? []} />
      )}
      {features.isOn("links") && <Backlinks page={page} />}
    </article>
  );
}

function TitleInput({ page, placeholder }: { page: Page; placeholder: string }) {
  const [value, setValue] = React.useState(page.title);
  const save = () => {
    if (value.trim() !== page.title) pageActions.rename(page.id, value.trim());
  };
  return (
    <textarea
      value={value}
      rows={1}
      onChange={(e) => setValue(e.target.value.replace(/\n/g, ""))}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          save();
          (document.querySelector(".pos-editor [contenteditable=true]") as HTMLElement | null)?.focus();
        }
      }}
      placeholder={placeholder}
      aria-label="Page title"
      dir="auto"
      className="field-sizing-content w-full resize-none bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"
    />
  );
}

function IconPicker({ page }: { page: Page }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="mt-0.5 text-2xl" aria-label="Page icon">
          {page.icon ?? <Smile className="text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className="grid size-7 place-items-center rounded hover:bg-accent"
              onClick={() => {
                pageActions.setIcon(page.id, i);
                setOpen(false);
              }}
            >
              {i}
            </button>
          ))}
        </div>
        {page.icon && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              pageActions.setIcon(page.id, null);
              setOpen(false);
            }}
          >
            Remove icon
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Backlinks({ page }: { page: Page }) {
  const links = useBacklinks({ type: "page", id: page.id });
  const pages = usePages();
  const groups = React.useMemo(() => {
    const byFrom = new Map<string, LinkRow[]>();
    for (const l of links.data ?? []) {
      if (!byFrom.has(l.fromKey)) byFrom.set(l.fromKey, []);
      byFrom.get(l.fromKey)!.push(l);
    }
    return [...byFrom.values()];
  }, [links.data]);
  if (!groups.length) return null;
  const byId = new Map((pages.data ?? []).map((p) => [p.id, p]));
  return (
    <section className="mt-12 border-t border-border pt-4" aria-label="Backlinks">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Link2 className="size-4" /> {groups.length} linked reference{groups.length === 1 ? "" : "s"}
      </h2>
      <ul className="space-y-2">
        {groups.map((g) => {
          const from = g[0].from;
          const src = from.type === "page" ? byId.get(from.id) : undefined;
          return (
            <li key={g[0].fromKey} className="rounded-lg border border-border bg-card p-3">
              <Link href={hrefFor(from.type, from.id)} className="text-sm font-medium hover:underline">
                {src ? `${src.icon ?? ""} ${pageTitle(src)}`.trim() : from.type}
              </Link>
              {g.map((l) => (
                <p key={l.id} dir="auto" className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {l.context}
                </p>
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
