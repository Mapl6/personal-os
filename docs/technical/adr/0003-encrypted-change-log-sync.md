# ADR-0003: Sync as an end-to-end encrypted change log

_Status: Proposed · Date: 2026-10-02 · Applies from: Phase 4_

## Context

Sync must let a phone and a laptop edit offline and merge without losing work, and the server must not be able to read the data (journal, health, money, cycle). Most sync engines (PowerSync, Zero, ElectricSQL, InstantDB, Triplit) work by letting the server read rows to decide what each client gets, which conflicts with end-to-end encryption. CRDT-first systems (Automerge, Jazz) handle merging well but ask the whole app to think in CRDT terms. Actual Budget has used a simpler model for years: field-level changes ordered by hybrid logical clocks (HLC), encrypted on the client, relayed by a server that never reads them.

This is a single-user app (one person, several devices), so we don't need server-side permissions per row or multi-user queries.

## Decision

- **Records:** every write becomes field-level messages `{hlc, dataset, row, column, value}`; merge by last-writer-wins per field using the HLC.
- **Pages:** Yjs updates travel as messages on the same log and merge as CRDTs.
- **Encryption:** each message is encrypted on device with the data key; the server stores `{seq, hlc, ciphertext}` only.
- **Server:** a thin relay (Next.js route handlers + Postgres + blob storage): push, pull since a sequence number, snapshots, blobs. Clients do all merging.
- **Compaction:** encrypted snapshots let new devices start without replaying all history and let the server drop old messages.

The protocol is described in [storage and sync](../storage-and-sync.md#phase-4-sync).

## Alternatives

| Option | Why not |
| --- | --- |
| PowerSync / ElectricSQL / Zero against Postgres | Server must read rows for sync rules; encrypting payloads reduces merging to whole-row last-writer-wins and loses most of the benefit |
| Automerge or Jazz for everything | Strong merging, but the whole data model becomes CRDT documents; harder to query with SQL; larger storage |
| Plain REST with server as source of truth | Breaks offline edits on two devices and requires the server to read data |
| File sync (Dropbox/iCloud) of the database file | Simple, but concurrent edits on two devices overwrite each other |

## Consequences

- Merging rules are ours to test: property-based convergence tests are required (see [quality](../quality.md)).
- Server-side features that need to read data (search, AI over synced data, server-side reminders with content) aren't possible; they run on devices instead. Push notifications use content-free payloads; captures use sealed boxes.
- Per-field last-writer-wins can produce odd combinations in rare cases (e.g. two devices editing related fields); acceptable for a single user, and visible in history.
- The server is small and cheap to run, and could be self-hosted.
