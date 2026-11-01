import type { EntityRef, EntityType } from "@/types/domain";
import { blockText, walkBlocks, walkInline, type DocBlock } from "./blocks";

export interface ExtractedLink {
  to: EntityRef;
  kind: "wikilink" | "mention" | "tag";
  blockId: string;
  context: string;
}

/** #tags in text: letters (any script), digits, - _ / ; not inside URLs or after word chars. */
const TAG_RE = /(^|[\s(])#([\p{L}\p{N}][\p{L}\p{N}_\-/]*)/gu;

export function extractTags(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(TAG_RE)) out.add(m[2].toLowerCase());
  return [...out];
}

/** Every outgoing reference in a document, one per (target, block). */
export function extractLinks(doc: readonly unknown[]): ExtractedLink[] {
  const out: ExtractedLink[] = [];
  const seen = new Set<string>();
  const add = (l: ExtractedLink) => {
    const k = `${l.kind}|${l.to.type}:${l.to.id}|${l.blockId}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(l);
  };
  for (const block of walkBlocks(doc as DocBlock[])) {
    const context = blockText(block).slice(0, 240);
    for (const node of walkInline(block)) {
      if ((node.type === "wikilink" || node.type === "mention") && node.props?.id) {
        add({
          to: { type: (node.props.type as EntityType) ?? "page", id: String(node.props.id) },
          kind: node.type,
          blockId: block.id,
          context,
        });
      }
    }
    for (const tag of extractTags(context)) add({ to: { type: "tag", id: tag }, kind: "tag", blockId: block.id, context });
  }
  return out;
}
