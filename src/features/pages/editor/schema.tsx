"use client";

import { BlockNoteSchema, defaultInlineContentSpecs } from "@blocknote/core";
import { createReactInlineContentSpec } from "@blocknote/react";
import { CheckSquare, FileText, Folder, Layers, Target } from "lucide-react";
import { useLookups } from "@/features/tasks/use-lookups";
import { useGoals, usePages } from "@/hooks/queries";
import { ui } from "@/store/ui-store";
import type { EntityType } from "@/types/domain";

/** Set by the editor host so inline links can navigate without a router inside node views. */
export const editorNav = { go: (href: string) => window.location.assign(href) };

export function hrefFor(type: string, id: string): string {
  switch (type) {
    case "page":
      return `/pages/${id}`;
    case "project":
      return `/projects/${id}`;
    case "area":
      return `/areas/${id}`;
    case "goal":
      return "/goals";
    case "task":
      return "/tasks";
    case "tag":
      return `/search?q=${encodeURIComponent(`#${id}`)}`;
    default:
      return "/";
  }
}

const ICON: Partial<Record<EntityType, typeof FileText>> = { page: FileText, task: CheckSquare, project: Folder, area: Layers, goal: Target };

/** Live title for a reference, so renamed pages/tasks show their current name. */
function useLiveTitle(type: string, id: string, fallback: string): { title: string; missing: boolean } {
  const pages = usePages();
  const lookups = useLookups();
  const goals = useGoals();
  if (type === "page") {
    if (!pages.data) return { title: fallback, missing: false };
    const p = pages.data.find((x) => x.id === id);
    return { title: p ? p.title || "Untitled" : fallback, missing: !p };
  }
  if (type === "task") {
    const t = lookups.taskById.get(id);
    return { title: t?.title ?? fallback, missing: lookups.tasks.length > 0 && !t };
  }
  if (type === "project") return { title: lookups.projectById.get(id)?.name ?? fallback, missing: false };
  if (type === "area") return { title: lookups.areaById.get(id)?.name ?? fallback, missing: false };
  if (type === "goal") return { title: goals.data?.find((g) => g.id === id)?.title ?? fallback, missing: false };
  return { title: fallback, missing: false };
}

function RefChip({ type, id, label, prefix }: { type: string; id: string; label: string; prefix: string }) {
  const { title, missing } = useLiveTitle(type, id, label);
  const Icon = ICON[type as EntityType];
  return (
    <span
      role="link"
      tabIndex={0}
      contentEditable={false}
      data-ref={`${type}:${id}`}
      title={missing ? "This item was deleted" : `Open ${title}`}
      onClick={(e) => {
        e.preventDefault();
        if (type === "task") ui.editTask(id);
        else editorNav.go(hrefFor(type, id));
      }}
      className={`pos-ref ${missing ? "pos-ref-missing" : ""}`}
    >
      {Icon ? <Icon className="pos-ref-icon" aria-hidden /> : <span aria-hidden>{prefix}</span>}
      {title}
    </span>
  );
}

const refProps = {
  type: { default: "page" },
  id: { default: "" },
  title: { default: "" },
} as const;

export const WikiLink = createReactInlineContentSpec(
  { type: "wikilink", propSchema: refProps, content: "none" },
  {
    render: ({ inlineContent }) => (
      <RefChip type={inlineContent.props.type} id={inlineContent.props.id} label={inlineContent.props.title} prefix="[[" />
    ),
  },
);

export const Mention = createReactInlineContentSpec(
  { type: "mention", propSchema: { type: { default: "task" }, id: { default: "" }, label: { default: "" } }, content: "none" },
  {
    render: ({ inlineContent }) => (
      <RefChip type={inlineContent.props.type} id={inlineContent.props.id} label={inlineContent.props.label} prefix="@" />
    ),
  },
);

export const schema = BlockNoteSchema.create({
  inlineContentSpecs: { ...defaultInlineContentSpecs, wikilink: WikiLink, mention: Mention },
});
export type PosEditor = typeof schema.BlockNoteEditor;
