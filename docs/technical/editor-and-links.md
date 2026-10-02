# Editor and links

_See also [ADR-0002](adr/0002-block-editor.md), [data model](data-model.md#pages-and-content), [features: knowledge](../features/knowledge.md)_

## Editor

The editor is BlockNote (on TipTap/ProseMirror) with Yjs as the document model, wrapped in `src/features/pages/editor/` so the rest of the app never imports the editor library directly ([ADR-0002](adr/0002-block-editor.md)).

### Responsibilities of the wrapper

| Concern | Approach |
| --- | --- |
| Loading | Load the page's `ydoc` from the data worker, create a `Y.Doc`, bind the editor to it |
| Saving | Listen to Yjs `update` events; append updates to the page content in the worker (debounced ~500 ms, flushed on `visibilitychange` and `pagehide`) |
| Derived data | On save, the worker extracts plain text, block list, links, tags, mentions and to-dos from the document and updates `pageContent.text/blocks`, the link index and the search index |
| Custom blocks | Task block (a live task), mention inline (`@`), wiki link inline (`[[`), date inline, query block (KN-28), linked database view (DB-28), flashcard block, chart block |
| Direction | Each block renders with `dir="auto"`; a per-block override attribute for edge cases (KN-17) |
| Paste | Markdown and HTML paste handlers; links to known pages become wiki links |
| Lazy loading | Editor code is loaded with `next/dynamic` only on page routes, so the planner stays fast |

### Custom inline content

- **Wiki link `[[`**: opens a search popover over pages and records; stores `{ type: "page", id }`, displays the target's current title. Missing targets render as "missing page".
- **Mention `@`**: same popover across all entity types plus dates ("tomorrow", "۱۵ مهر"), parsed with the existing Quick Add date logic. A date mention can create a reminder.
- **Tag `#`**: plain text tags recognised by the indexer; nested with `/`.
- **Block reference `((`**: points to `{ pageId, blockId }`; block IDs come from BlockNote and are stable across edits.

### Task blocks

A to-do block can be promoted to a task (KN-07). The block then stores only `{ taskId }` and renders the task live (title, status, schedule). Completing it in the page completes the task through the task service, and vice versa. The task gets a backlink to the page.

## Link index

The links indexer runs in the data worker on every change to a page, record or entity with references.

```text
on change(entity):
  newLinks = extractLinks(entity)        // wiki links, mentions, tags, block refs, relations, FKs like task.projectId
  oldLinks = links where from = entity
  delete oldLinks − newLinks; insert newLinks − oldLinks   (one transaction)
```

- `extractLinks` is a pure function per entity type in `lib/links/`, unit-tested with fixtures.
- **Backlinks** = `links where to = X`, grouped by source, with the source block's text as the context snippet.
- **Unlinked mentions** (KN-23) = FTS search for the page's title and aliases, minus pages already linking to it.
- **Graph** (KN-26) = links filtered by type and depth, laid out with a force-directed layout in a worker (e.g. `d3-force`), rendered on canvas for large graphs.
- **Rename** never rewrites other pages: links store IDs, titles are looked up on render.

## Daily notes

```ts
async function getOrCreatePeriodNote(kind: "daily" | "weekly" | "monthly" | "yearly", date: DateKey): Promise<Page>
```

- `periodStart` comes from `lib/date` using the user's calendar system and week start, so a Shamsi monthly note starts on the 1st of the Shamsi month.
- The worker enforces uniqueness on `(kind, periodStart)` and returns the existing note if another tab created it first.
- New notes are created from the user's template for that kind (KN-08), with variables filled.
- Dynamic sections (schedule, completed tasks, habits, check-in, money spent) are **live blocks**, not copied text, so they stay correct when data changes later. Only the free-writing area is plain content.

## Templates

Templates are pages with `kind: "template"`. Variables use `{{name}}` and are filled when instantiated: `date`, `title`, `weekday`, `area`, `cursor` (where the caret lands). Template application is a pure function over the Yjs document, so it is testable without the editor.
