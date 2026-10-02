# ADR-0001: SQLite (WASM, OPFS) in a worker for local storage

_Status: Proposed · Date: 2026-10-02 · Applies from: Phase 2_

## Context

Today all data is in IndexedDB through `idb`, behind the `DataStore` interface. That works for the planner, but Phase 2 adds custom databases with multi-property filters, sorts, grouping, relations and rollups, plus full-text search across everything, and later vector search. IndexedDB has only single-field indexes, so these queries become full scans in JavaScript on the main thread.

SQLite compiled to WebAssembly can persist to the Origin Private File System (OPFS) with good performance; Notion runs WASM SQLite in its web app, and libraries like wa-sqlite and the official sqlite-wasm build are mature.

## Decision

From Phase 2, store all data in **SQLite (WASM) on OPFS, inside a dedicated data worker**, behind the existing `DataStore` interface plus a query API for database views.

- FTS5 for full-text search; JSON functions for nested fields; vectors as BLOBs (sqlite-vec later if needed).
- One tab owns the database (Web Locks leader election); other tabs go through it.
- Attachments stay as files in OPFS, not in SQLite.
- Phase 1 stays on IndexedDB and adds migrations, soft delete and the search index there.

## Alternatives

| Option | Why not (now) |
| --- | --- |
| Stay on IndexedDB (+ MiniSearch, in-memory filtering) | Fine for Phase 1; won't scale to 50k-record views, relations and rollups within budgets |
| PGlite (Postgres in WASM) | Very capable and matches a Postgres server, but larger download and, per its own benchmarks, slower than SQLite for many reads; revisit if we want the same SQL on client and server |
| RxDB / Dexie | Nicer IndexedDB APIs, same underlying limits for complex queries |
| A sync engine's client DB (PowerSync, Zero, InstantDB) | Couples storage to a sync service that doesn't fit end-to-end encryption (see ADR-0003) |

## Consequences

- A spike must confirm Safari (macOS and iOS) behaviour, OPFS durability, multi-tab handling and download size before committing.
- All queries move off the main thread, which also helps the planner's performance.
- The `DataStore` contract test suite must run against SQLite (WASM in Node).
- A one-time IndexedDB → SQLite migration is needed, with IndexedDB kept as a fallback for one release.
- Database files can be exported directly as a backup format.
