/**
 * Pure helpers over the editor's block JSON (BlockNote shape), so services,
 * search and the link indexer never need the editor itself.
 *
 *   Block = { id, type, props, content?: Inline[] | { type: "tableContent", rows }, children: Block[] }
 *   Inline = { type: "text", text, styles } | { type: "link", href, content: Inline[] }
 *          | { type: "wikilink" | "mention", props: { … } }
 */

export interface DocBlock {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: DocBlock[];
}

interface InlineNode {
  type: string;
  text?: string;
  href?: string;
  content?: InlineNode[];
  props?: Record<string, unknown>;
}

let counter = 0;
export function blockId(): string {
  counter = (counter + 1) % 1e6;
  return `b${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Plain text → paragraphs (one block per line; blank lines dropped). */
export function textToBlocks(text: string): DocBlock[] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((line) => ({
      id: blockId(),
      type: "paragraph",
      props: {},
      content: [{ type: "text", text: line, styles: {} }],
      children: [],
    }));
}

/** Text of one inline node, including the visible label of custom inline content. */
export function inlineText(node: InlineNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "link") return (node.content ?? []).map(inlineText).join("");
  if (node.type === "wikilink") return `[[${String(node.props?.title ?? "")}]]`;
  if (node.type === "mention") return `@${String(node.props?.label ?? "")}`;
  if (node.type === "tag") return `#${String(node.props?.tag ?? "")}`;
  return node.text ?? "";
}

/** Text of a block's own content (not its children). */
export function blockText(block: DocBlock): string {
  const c = block.content;
  if (Array.isArray(c)) return (c as InlineNode[]).map(inlineText).join("");
  if (c && typeof c === "object" && (c as { type?: string }).type === "tableContent") {
    const rows = ((c as { rows?: { cells?: unknown[] }[] }).rows ?? []) as { cells?: unknown[] }[];
    return rows
      .map((r) => (r.cells ?? []).map((cell) => (Array.isArray(cell) ? (cell as InlineNode[]).map(inlineText).join("") : "")).join(" | "))
      .join("\n");
  }
  return "";
}

/** Depth-first walk over blocks and their children. */
export function* walkBlocks(blocks: readonly DocBlock[]): Generator<DocBlock> {
  for (const b of blocks) {
    yield b;
    if (b.children?.length) yield* walkBlocks(b.children);
  }
}

/** Every inline node in a block's content (recursing into links). */
export function* walkInline(block: DocBlock): Generator<InlineNode> {
  const c = block.content;
  if (!Array.isArray(c)) return;
  const stack = [...(c as InlineNode[])].reverse();
  while (stack.length) {
    const n = stack.pop()!;
    yield n;
    if (n.content?.length) stack.push(...[...n.content].reverse());
  }
}

export interface DerivedContent {
  text: string;
  outline: { id: string; type: string; text: string }[];
}

/** Derived on save: full text for search and a flat outline for snippets. */
export function deriveContent(doc: readonly unknown[]): DerivedContent {
  const outline: DerivedContent["outline"] = [];
  for (const b of walkBlocks(doc as DocBlock[])) {
    const text = blockText(b);
    if (text.trim()) outline.push({ id: b.id, type: b.type, text });
  }
  return { text: outline.map((o) => o.text).join("\n"), outline };
}

/** First non-empty line, for titles of pages made from text. */
export function firstLine(text: string, max = 80): string {
  const line = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  return line.trim().slice(0, max);
}
