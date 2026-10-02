# Technical docs

_As of 2026-10-02 · Mahdi_

How to build the features in the [feature catalogue](../features/README.md) on top of the existing codebase, in the order set by the [development plan](../DEVELOPMENT_PLAN.md). Start with the architecture, then read the design doc for the area you are working on.

| Doc | Read it when you are… |
| --- | --- |
| [Architecture](architecture.md) | New to the codebase, or adding anything that crosses layers |
| [Data model](data-model.md) | Adding or changing stored data |
| [Storage and sync](storage-and-sync.md) | Touching persistence, migrations, backups, sync or server-side capture |
| [Editor and links](editor-and-links.md) | Working on pages, blocks, wiki links, mentions, backlinks or daily notes |
| [Search and AI](search-and-ai.md) | Working on search, embeddings, the AI assistant or the MCP server |
| [Modules and feature flags](modules-and-feature-flags.md) | Adding a life module or anything that can be turned on or off |
| [Security and privacy](security-and-privacy.md) | Handling sensitive data, encryption, app lock or AI permissions |
| [Quality](quality.md) | Writing tests, checking performance budgets, accessibility, RTL and Persian support |

## Architecture decision records

Decisions that are expensive to reverse are recorded as ADRs in [`adr/`](adr/). Each has a status: _proposed_ (open for discussion, may need a spike), _accepted_ or _superseded_.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](adr/0001-sqlite-wasm-storage.md) | Move local storage from IndexedDB to SQLite (WASM, OPFS) in a worker | Proposed |
| [0002](adr/0002-block-editor.md) | Use BlockNote (TipTap/ProseMirror) with Yjs for pages | Proposed, needs RTL spike |
| [0003](adr/0003-encrypted-change-log-sync.md) | Sync as an end-to-end encrypted log of field-level changes ordered by hybrid logical clocks | Proposed |
| [0004](adr/0004-typed-modules-over-generic-records.md) | Life modules use typed schemas, exposed to the view engine as built-in databases | Proposed |
| [0005](adr/0005-ai-proposals-and-privacy.md) | AI works through typed tools that return proposals, filtered by privacy class | Proposed |

To add one, copy the structure of an existing ADR (Context, Decision, Alternatives, Consequences) and give it the next number.

## Adding a feature

A checklist for any feature in the catalogue. Not every step applies to every feature; skip the ones that don't, but decide consciously.

1. **Spec.** Find the feature's row in the catalogue. If it's missing or vague, update the catalogue first (ID, details, priority, phase).
2. **Schema.** Add or change Zod schemas in `src/types/` (see [data model](data-model.md)). Every new entity gets the [base fields](data-model.md#base-fields) and a privacy class.
3. **Migration.** If stored data changes shape, add a migration step and bump the schema version (see [storage and sync](storage-and-sync.md#migrations)). Add a test that migrates a fixture from the previous version.
4. **Repository.** Register the collection and its indexes in the `DataStore` (`src/repositories/types.ts`) and both implementations.
5. **Pure logic.** Put calculations (progress, predictions, budgets, streaks, parsing) in `src/lib/<area>/` as pure functions with unit tests. No storage or React in `lib/`.
6. **Service.** Add use-cases in `src/services/` that validate input, enforce business rules and write through the store. Bulk or AI-driven changes return proposals instead of writing.
7. **Hooks.** Add TanStack Query hooks in `src/hooks/queries.ts` with query keys that writes invalidate.
8. **Feature registry.** Register the feature or module with its toggle, nav items, routes, widgets, review prompts, analytics, notifications, Quick Add grammar and Command Center actions (see [modules and feature flags](modules-and-feature-flags.md)).
9. **UI.** Thin page in `src/app/`, components in `src/features/<feature>/`, shared UI from `src/components/`. Use logical CSS properties (`ms-*`, `pe-*`, `text-start`) so it works right-to-left.
10. **Links and search.** Make records mentionable (`@`), give them backlinks and index their text (see [editor and links](editor-and-links.md) and [search and AI](search-and-ai.md)).
11. **Built-in database.** If the feature stores records, expose them as a built-in database so table, board, calendar and chart views work (see [ADR-0004](adr/0004-typed-modules-over-generic-records.md)).
12. **Export and import.** Include the collection in JSON export/import and the markdown/CSV export.
13. **AI exposure.** Declare which AI tools can read it and its privacy class (see [ADR-0005](adr/0005-ai-proposals-and-privacy.md)).
14. **Tests.** Unit tests for `lib/` and services, component tests for tricky UI, one Playwright flow for the main path, including Shamsi and mobile where relevant (see [quality](quality.md)).
15. **Docs.** Update the catalogue status and, if behaviour changed, the README.

Before opening a PR, run:

```bash
npm run typecheck && npm run lint && npm test && npm run test:e2e
```
