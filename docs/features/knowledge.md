# Knowledge: pages, notes and links

_Prefix `KN` · Technical design: [editor and links](../technical/editor-and-links.md), [data model](../technical/data-model.md#pages-and-content)_

The knowledge layer turns Personal OS from a planner into a second brain: free-form pages built from blocks, linked to each other and to every task, goal, person and record.

## Pages and the block editor

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| KN-01 | Pages | Create, rename, delete (to trash) and restore pages; each page has a title, icon (emoji or Lucide), optional cover, area and tags | P0 | 1 | ⬜ |
| KN-02 | Page tree | Nested pages in a sidebar tree; drag to reorder or re-parent; collapse state remembered | P0 | 1 | ⬜ |
| KN-03 | Core blocks | Paragraph, heading 1–3, bullet, numbered, to-do, toggle, quote, callout, divider, code (with syntax highlighting), image, table | P0 | 1 | ⬜ |
| KN-04 | Slash menu and shortcuts | `/` opens a filterable block menu; markdown shortcuts (`#`, `-`, `1.`, `[]`, `>`, ` ``` `); `⌘B/I/U/E/K` formatting | P0 | 1 | ⬜ |
| KN-05 | Drag handles | Drag any block to move it within or between pages; multi-select blocks with Shift and drag | P0 | 1 | ⬜ |
| KN-06 | Rich blocks | File attachments, audio (with player), video, bookmark (link preview), embed (YouTube and others), math (KaTeX), Mermaid diagram, columns | P1 | 2 | ⬜ |
| KN-07 | To-do blocks become tasks | A to-do block can be promoted to a real task (keeps a live link both ways); tasks mentioned on a page show their status inline | P0 | 1 | ⬜ |
| KN-08 | Page templates | Templates with variables (`{{date}}`, `{{title}}`, `{{area}}`), e.g. meeting notes, book notes, project brief, decision record, weekly plan | P1 | 2 | ⬜ |
| KN-09 | Favourites and recents | Star pages; a recently-viewed list in the sidebar and `⌘K` | P1 | 1 | ⬜ |
| KN-10 | Page history | Automatic snapshots on idle, view and restore an older version, show what changed | P1 | 2 | ⬜ |
| KN-11 | Trash | Deleted pages, tasks and records go to a trash for 30 days, with restore and empty | P0 | 1 | ⬜ |
| KN-12 | Page properties | Every page can carry properties (date, status, URL…) the same way database records do | P1 | 2 | ⬜ |
| KN-13 | Block references and transclusion | Copy a link to a block; `((` searches blocks; embed a live copy of a block or page section elsewhere | P1 | 2 | ⬜ |
| KN-14 | Outliner mode | A page can switch to outliner layout (every block is a bullet, Tab/Shift-Tab to indent, zoom into a bullet), Logseq-style | P2 | 3 | ⬜ |
| KN-15 | Synced blocks | Edit the same block in two places | P2 | 3 | ⬜ |
| KN-16 | Writing tools | Word and character count, reading time, focus/typewriter mode, full-width toggle, table of contents block, footnotes | P1 | 2 | ⬜ |
| KN-17 | Mixed-direction text | Each block picks its direction from its first strong character, so Persian and English paragraphs sit together correctly; manual override per block | P0 | 1 | ⬜ |
| KN-18 | Page lock | Lock a page against accidental edits | P2 | 2 | ⬜ |
| KN-19 | Copy and paste fidelity | Paste from web, Notion, Google Docs and markdown keeps structure; copy out as markdown or rich text | P1 | 1 | ⬜ |

## Linking and discovery

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| KN-20 | Wiki links | `[[` searches pages and records; creates a new page if none matches; aliases supported | P0 | 1 | ⬜ |
| KN-21 | Mentions | `@` mentions pages, tasks, projects, goals, people, records and dates; a date mention can set a reminder | P0 | 1 | ⬜ |
| KN-22 | Backlinks | Every page, task, project, goal, habit, person and record shows "Linked from" with context snippets | P0 | 1 | ⬜ |
| KN-23 | Unlinked mentions | Pages that contain a title or alias as plain text, with one click to link | P1 | 2 | ⬜ |
| KN-24 | Tags | `#tags` in text share the tag namespace with tasks; nested tags (`#learning/react`); tag pages list everything tagged | P0 | 1 | 🟡 Tags exist on tasks |
| KN-25 | Full-text search | Search all pages, blocks, tasks, records and inbox items; filters by type, area, tag and date; results ranked with snippets; Persian-aware matching | P0 | 1 | 🟡 `⌘K` searches tasks and navigation |
| KN-26 | Graph view | Interactive graph of pages and records with filters (area, tag, type, depth) and a local graph per page | P1 | 2 | ⬜ |
| KN-27 | Related pages | "Related" panel from shared links and tags (later from semantic similarity, AI-02) | P2 | 2 | ⬜ |
| KN-28 | Inline queries | A query block that lists pages, tasks or records matching filters, kept live (e.g. "open tasks tagged #mvp") | P1 | 2 | ⬜ |
| KN-29 | Random and "on this day" | Resurface a random note, and notes and journal entries from this day in past years | P2 | 2 | ⬜ |

## Daily, weekly and monthly notes

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| KN-30 | Daily note | Created on first open each day from a template; shows the day's schedule, completed tasks, habits, check-in, time tracked and money spent, plus free writing space; opened from Today and every calendar day | P0 | 1 | ⬜ |
| KN-31 | Weekly and monthly notes | Roll up the daily notes, highlights and stats; Shamsi or Gregorian periods by setting | P1 | 2 | ⬜ |
| KN-32 | Yearly note and year view | Year theme, yearly goals, month-by-month highlights; feeds the annual review | P2 | 3 | ⬜ |
| KN-33 | Journal-style navigation | Previous/next day, jump to date (Shamsi picker), calendar heatmap of days with notes | P1 | 1 | ⬜ |

## Visual thinking

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| KN-40 | Canvas | Infinite whiteboard of page cards, record cards, text, images and arrows; sections; zoom; a canvas is itself a page | P2 | 3 | ⬜ |
| KN-41 | Mind map view | Show a page outline or a page's links as a mind map | P2 | 3 | ⬜ |

## Second-brain methods

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| KN-50 | PARA structure | Projects and Areas exist; add Resources (topics you collect for) and Archive, with one-click "archive" for projects and pages | P1 | 1 | 🟡 Projects and areas exist |
| KN-51 | Zettelkasten notes | Optional atomic notes with an ID, a "next idea" link and "notes without links" list | P2 | 3 | ⬜ |
| KN-52 | Progressive summarisation | Highlight layers (highlight → bold → summary callout at top), and a filter for pages by summarisation stage | P2 | 3 | ⬜ |
| KN-53 | Maps of content | A page type that collects links on a topic, with a prompt to add newly tagged notes | P2 | 3 | ⬜ |
| KN-54 | Citations | Store sources (book, article, URL) and cite them in notes; import from Zotero / BibTeX | P2 | 4 | ⬜ |

## Acceptance criteria for P0 features

**Pages and editor (KN-01…KN-05)**
- Typing never loses input, including when offline or when the tab is closed mid-edit; saves are debounced but flushed on `visibilitychange`.
- A 5,000-block page stays responsive (typing latency under 50 ms on a mid-range laptop).
- Undo/redo works across block moves and formatting.
- Everything works with the keyboard alone, and screen readers announce block types.

**Links and backlinks (KN-20…KN-22)**
- Renaming a page updates the display of every link to it without rewriting other pages (links store IDs, not titles).
- Backlinks update within one second of saving the linking page.
- Deleting a page shows its links as "missing page" and restoring it heals them.

**Daily note (KN-30)**
- Opening Today on a new day creates at most one daily note per date, even with two tabs open.
- The date in the title follows the calendar setting (Shamsi or Gregorian) but the note is stored by its Gregorian date key, like the rest of the app.

**Search (KN-25)**
- Results in under 100 ms for 10,000 pages on a mid-range laptop.
- Persian matching ignores differences between Arabic and Persian `ی/ي` and `ک/ك`, zero-width non-joiners, diacritics, and Persian vs Latin digits.
