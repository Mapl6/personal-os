"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { filterSuggestionItems } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote, type DefaultReactSuggestionItem } from "@blocknote/react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckSquare, FilePlus, FileText, Folder, Layers, Target } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { getServices } from "@/services";
import type { Page } from "@/types/domain";
import { editorNav, schema, type PosEditor } from "./schema";

type Item = DefaultReactSuggestionItem;
const SAVE_DELAY = 600;

function matches(title: string, q: string) {
  return title.toLocaleLowerCase().includes(q.toLocaleLowerCase());
}

/**
 * The block editor for a page. Owns the document while mounted: changes are
 * saved (debounced) through the page service, which also re-indexes links.
 */
export default function PageEditor({ page, initial, editable = true }: { page: Page; initial: unknown[]; editable?: boolean }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote(
    {
      schema,
      initialContent: initial.length ? (initial as PosEditor["document"]) : undefined,
      placeholders: { default: "Write, or press / for blocks, [[ to link a page, @ to mention" },
    },
    [page.id],
  ) as PosEditor;

  React.useEffect(() => {
    editorNav.go = (href) => router.push(href);
  }, [router]);

  // Debounced save, flushed on unmount and when the tab is hidden.
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = React.useRef(false);
  const flush = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;
    dirty.current = false;
    getServices()
      .pages.saveContent(page.id, editor.document)
      .catch((e: Error) => toast.error(`Couldn’t save “${page.title || "Untitled"}”: ${e.message}`));
  }, [editor, page.id, page.title]);
  React.useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  const onChange = () => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY);
  };

  const insertRef = (type: "wikilink" | "mention", props: Record<string, string>) => {
    editor.insertInlineContent([{ type, props } as never, " "]);
  };

  const pageItems = async (query: string): Promise<Item[]> => {
    const pages = await getServices().store.pages.list();
    const q = query.trim();
    const hits = pages
      .filter((p) => p.id !== page.id && p.kind !== "template" && matches(p.title || "Untitled", q))
      .sort((a, b) => (b.lastOpenedAt ?? b.updatedAt).localeCompare(a.lastOpenedAt ?? a.updatedAt))
      .slice(0, 8)
      .map<Item>((p) => ({
        title: p.title || "Untitled",
        subtext: p.kind !== "page" ? `${p.kind} note` : undefined,
        icon: <FileText size={16} />,
        onItemClick: () => insertRef("wikilink", { type: "page", id: p.id, title: p.title || "Untitled" }),
      }));
    if (q && !pages.some((p) => p.title.toLocaleLowerCase() === q.toLocaleLowerCase())) {
      hits.push({
        title: `Create “${q}”`,
        subtext: "New page",
        icon: <FilePlus size={16} />,
        onItemClick: async () => {
          const created = await getServices().pages.create({ title: q });
          qc.invalidateQueries({ queryKey: ["pages"] });
          insertRef("wikilink", { type: "page", id: created.id, title: created.title });
        },
      });
    }
    return hits;
  };

  const mentionItems = async (query: string): Promise<Item[]> => {
    const { store } = getServices();
    const [tasks, projects, areas, goals] = await Promise.all([store.tasks.list(), store.projects.list(), store.areas.list(), store.goals.list()]);
    const q = query.trim();
    const all: (Item & { rank: number })[] = [
      ...tasks.filter((t) => t.status !== "cancelled" && matches(t.title, q)).map((t) => ({
        rank: t.status === "completed" || t.status === "skipped" ? 3 : 1,
        title: t.title,
        subtext: "Task",
        icon: <CheckSquare size={16} />,
        onItemClick: () => insertRef("mention", { type: "task", id: t.id, label: t.title }),
      })),
      ...projects.filter((p) => matches(p.name, q)).map((p) => ({
        rank: 0,
        title: p.name,
        subtext: "Project",
        icon: <Folder size={16} />,
        onItemClick: () => insertRef("mention", { type: "project", id: p.id, label: p.name }),
      })),
      ...areas.filter((a) => matches(a.name, q)).map((a) => ({
        rank: 0,
        title: a.name,
        subtext: "Area",
        icon: <Layers size={16} />,
        onItemClick: () => insertRef("mention", { type: "area", id: a.id, label: a.name }),
      })),
      ...goals.filter((g) => matches(g.title, q)).map((g) => ({
        rank: 2,
        title: g.title,
        subtext: "Goal",
        icon: <Target size={16} />,
        onItemClick: () => insertRef("mention", { type: "goal", id: g.id, label: g.title }),
      })),
    ];
    return all.sort((a, b) => a.rank - b.rank).slice(0, 10);
  };

  return (
    <div className="pos-editor -mx-2 md:-mx-12">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={resolvedTheme === "light" ? "light" : "dark"}
        onChange={onChange}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => filterSuggestionItems(getDefaultReactSlashMenuItems(editor), query)}
        />
        <SuggestionMenuController triggerCharacter="[[" getItems={pageItems} />
        <SuggestionMenuController triggerCharacter="@" getItems={mentionItems} />
      </BlockNoteView>
    </div>
  );
}
