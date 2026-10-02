# ADR-0002: BlockNote with Yjs for pages

_Status: Proposed, needs an RTL spike · Date: 2026-10-02 · Applies from: Phase 1_

## Context

Pages need a Notion-style block editor: slash menu, drag handles, nested blocks, markdown shortcuts, custom blocks (live tasks, mentions, database views), and later real-time merging of edits made on different devices. Building one from scratch is a multi-month project. Persian and English must mix in the same document, block by block.

## Decision

Use **BlockNote** (built on TipTap/ProseMirror) with **Yjs** as the document model, wrapped in our own `features/pages/editor` module so no other code imports BlockNote.

- BlockNote gives the block UI (slash menu, drag handles, side menu) out of the box and supports custom blocks and inline content.
- Yjs gives conflict-free merging, which sync (ADR-0003) needs for page content, and works offline.
- Because BlockNote sits on TipTap/ProseMirror, we can drop down to TipTap extensions for anything BlockNote doesn't support, or replace BlockNote with plain TipTap later while keeping the Yjs document (the ProseMirror Yjs binding is shared).

## Spike before accepting

1. Mixed Persian/English paragraphs with `dir="auto"` per block: caret movement, selection, bullets and drag handles on the correct side.
2. Persian IME input on macOS, Windows, Android and iOS (no dropped or doubled characters).
3. Custom inline content: wiki link, mention, date.
4. Performance with a 5,000-block document.
5. Bundle size, loaded lazily on page routes.

If BlockNote fails 1 or 2 and can't be fixed with reasonable effort, use **TipTap** directly with our own block UI.

## Alternatives

| Option | Trade-off |
| --- | --- |
| TipTap directly | Most flexible, same Yjs story, but we build the block UI ourselves |
| Lexical | Fast and flexible; Yjs binding exists; fewer ready-made block UIs; different ecosystem from TipTap |
| Markdown files (Obsidian-style) with CodeMirror | Simple, portable; but rich blocks, database views and live task blocks are much harder |
| Build our own | Not worth it |

## Consequences

- Page content is stored as Yjs state, with derived plain text and block lists for search and links.
- Markdown export goes through BlockNote's markdown serialiser plus our custom blocks.
- Editor upgrades are contained in one folder.
