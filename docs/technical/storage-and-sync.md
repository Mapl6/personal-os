# Storage and sync

_See also [ADR-0001](adr/0001-sqlite-wasm-storage.md), [ADR-0003](adr/0003-encrypted-change-log-sync.md), [security and privacy](security-and-privacy.md)_

## Storage today

`src/repositories/indexeddb-store.ts` opens the `personal-os` IndexedDB database (version 1) with one object store per collection and secondary indexes from `COLLECTION_INDEXES`. Services only see the `DataStore` interface, and tests use the in-memory store.

## Phase 1: make the current storage safe to evolve

Before adding pages and modules, add the plumbing every later phase relies on.

### Migrations

Two kinds of migration, both in `src/repositories/migrations/`:

| Kind | When | Example |
| --- | --- | --- |
| **Structural** | Store or table shape changes | New object store `pages`, new index `pages.parentId` |
| **Data** | Row shape changes | Add `deletedAt` and `v` to every row; move `Review.energy` into `checkIn` |

```ts
export interface Migration {
  /** Target schema version after this step. */
  to: number;
  description: string;
  structural?: (db: UpgradeDb) => void;          // runs inside the IndexedDB upgrade transaction
  data?: (tx: MigrationTx) => Promise<void>;     // runs after open, in batches, resumable
}
```

Rules:

- The schema version is stored in the `meta` store, separate from the IndexedDB version (which only covers structure).
- Data migrations are **idempotent and resumable**: they record progress in `meta` and can be re-run after a crash.
- **Backups are migrated too.** `importAll` reads `version` from the file and runs the same data migrations on the parsed payload before validating with the current schema. `EXPORT_VERSION` becomes the schema version.
- Every migration has a test that loads a fixture from the previous version and checks the result.
- Before a data migration runs, the app writes an automatic local backup (PL-12) so a bad migration can be rolled back.

### Persistent storage and quotas

- Call `navigator.storage.persist()` after onboarding and show the result in Settings → Data; Safari may evict non-persisted data after periods of no use.
- Show `navigator.storage.estimate()` usage, per module where possible.
- Attachments are stored in OPFS (`navigator.storage.getDirectory()`), named by SHA-256, so duplicates are free and the database stays small.

### Trash

`deletedAt` replaces hard deletes in services. Queries exclude deleted rows by default. A daily job purges rows deleted more than 30 days ago (and attachments no longer referenced).

## Phase 2: SQLite in a worker

[ADR-0001](adr/0001-sqlite-wasm-storage.md) moves storage to SQLite (WASM) on OPFS inside a dedicated worker, when databases and views arrive and IndexedDB stops being enough (multi-property filters, sorts, joins for relations and rollups, full-text search).

- **Implementation:** the official `@sqlite.org/sqlite-wasm` build or `wa-sqlite` with an OPFS VFS (`OPFSCoopSyncVFS` / `AccessHandlePoolVFS`). Pick in a spike based on Safari behaviour and multi-tab support.
- **Multiple tabs:** only one tab can hold the OPFS access handles. Use a leader election (Web Locks API) so one tab's worker owns the database and other tabs talk to it through a `BroadcastChannel` or a `SharedWorker` where supported.
- **Schema:** typed tables for built-in entities with JSON columns for nested arrays (subtasks, milestones, exercises) and `extra`; generic `records(id, database_id, values JSON, …)` for custom databases with generated columns or an EAV side table for indexed properties.
- **Moving data across:** on first run of the new version, read everything from IndexedDB, write it into SQLite in one transaction, verify row counts, then mark IndexedDB as migrated (keep it for one release as a fallback, then delete).
- **Tests:** the same `DataStore` contract test suite runs against the memory store, IndexedDB (via `fake-indexeddb`) and SQLite (WASM in Node).

## Backups and export

| Backup | Format | Where | When |
| --- | --- | --- | --- |
| JSON backup | One JSON file, versioned | Download | Manual (exists) |
| Local snapshots | JSON or SQLite file, compressed | OPFS | Daily, before migrations; keep 7 daily + 4 weekly |
| Cloud backup (PL-13) | Encrypted archive | Google Drive / Dropbox / WebDAV | Scheduled |
| Portable export (PL-15) | Zip of markdown pages, CSV per database, attachments | Download | Manual |

## Phase 4: sync

[ADR-0003](adr/0003-encrypted-change-log-sync.md) explains the choice; this section is the protocol.

### Changes and clocks

Every write already produces a `Change` in the change feed (see [architecture](architecture.md#change-feed)). For sync, each change is split into **field-level messages**:

```ts
type SyncMessage = {
  hlc: string;          // hybrid logical clock: "<wall time ms>-<counter>-<deviceId>", sortable as a string
  dataset: string;      // collection name, e.g. "tasks"
  row: string;          // entity id
  column: string;       // field name, or "$content" for page Yjs updates
  value: unknown;       // new value (JSON) or Yjs update (bytes)
};
```

- **Records merge per field with last-writer-wins by HLC.** If you rename a task on your phone and change its priority on your laptop while both are offline, both changes survive. If both rename it, the later rename wins.
- **Page content merges with Yjs.** A page's Yjs updates are messages with `column: "$content"`; every device applies all updates, so concurrent edits merge character by character.
- **Deletes** are a `deletedAt` field change, so they merge like any other field; a delete followed by an edit elsewhere leaves the item in the trash with the edit applied.
- **Derived data never syncs**: indexes, embeddings, caches and computed values are rebuilt on each device.

### Encryption

Each message is serialised and encrypted on device with the user's data key (XChaCha20-Poly1305 or AES-256-GCM via WebCrypto), with the HLC as associated data. The server sees only `{ hlc, ciphertext }` plus the user and device IDs. Keys are described in [security and privacy](security-and-privacy.md#keys).

### Server API

Implemented as Next.js route handlers backed by Postgres:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/sync/push` | Append a batch of encrypted messages; server assigns a monotonic sequence number per user |
| `GET /api/sync/pull?since=<seq>` | Return messages after a sequence number, paginated |
| `POST /api/sync/snapshot` | Upload an encrypted compacted snapshot so new devices don't replay all history |
| `PUT /api/blobs/<sha256>` / `GET …` | Encrypted attachment bytes in object storage |

The server never merges anything; clients do. A Merkle-style hash of HLC ranges (as in Actual Budget) lets a client detect divergence and re-request missing ranges.

### Compaction

The message log grows forever unless compacted. Periodically a device uploads an encrypted snapshot of the current state with the HLC it covers; the server can then drop messages older than the oldest snapshot all active devices have confirmed. Yjs documents are compacted with `Y.encodeStateAsUpdate` into one update per page.

### Local-only data

Modules marked local-only (PL-48), and the cycle module unless explicitly allowed, never produce sync messages.

## Server-side capture

Telegram (CA-31), email-in (CA-32) and the web clipper (CA-30) deliver content to the server while your devices may be offline, and the server must not be able to read it later.

1. Each account has a **capture key pair**. The public key is stored on the server; the private key is only on devices (encrypted with the data key).
2. When a capture arrives, the server immediately encrypts it with the public key (libsodium sealed box), stores the ciphertext in a capture queue and discards the plaintext.
3. Devices pull the queue, decrypt, and create inbox items through the normal write path (so they sync like everything else), then acknowledge so the server deletes the queued item.

The plaintext exists on the server only in memory while being encrypted. This is stated plainly in the privacy dashboard.

## Notifications

- **Phase 1–3:** reminders are computed on device and shown while the app is open, plus a service-worker notification when a tab is in the background.
- **Phase 4:** Web Push with VAPID. Devices upload an encrypted **reminder schedule** (only times and a generic payload like "You have a reminder"); the server sends pushes at those times, and the device shows the real text after decrypting locally. The server never learns what the reminder is about.
