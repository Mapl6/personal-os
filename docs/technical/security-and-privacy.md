# Security and privacy

_See also [storage and sync](storage-and-sync.md), [ADR-0003](adr/0003-encrypted-change-log-sync.md), [ADR-0005](adr/0005-ai-proposals-and-privacy.md)_

A life OS holds journals, health data, money and relationships. The rules:

1. **Local by default.** Without an account, nothing leaves the device.
2. **Ciphertext only on servers.** Synced data, backups and captures are encrypted on device; the server can't read them.
3. **Least exposure to AI.** AI only sees what the privacy filter allows, and you can see what was sent.
4. **Sensitive means sensitive.** Cycle, finance and journal data get extra protection by default.

## Privacy classes

Every collection (and every page, via `page.privacy`) has a class:

| Class | Examples | App lock | AI | Sync | Shared pages |
| --- | --- | --- | --- | --- | --- |
| `normal` | Tasks, projects, library, learning | App lock | Allowed if its area is allowed | Yes | Allowed |
| `private` | Journal, health, nutrition, people | App lock + optional module lock | Off by default; allow per module | Yes | Never included in linked views on shared pages |
| `sensitive` | Cycle, finance | Module lock recommended | Never, unless explicitly allowed per module with a warning | Optional (cycle: off by default) | Never |

The class is declared in the feature registry and enforced in one place: the data worker's privacy filter, used by search results shown to AI, AI tools, sharing, and sync.

## Keys

| Key | What it is | Where it lives |
| --- | --- | --- |
| Data key | Random 256-bit key that encrypts all synced data | On each device, wrapped by the device key; on the server, wrapped by the passphrase key and by the recovery key |
| Passphrase key | Derived from your passphrase with Argon2id (WASM) | Never stored; derived when needed |
| Recovery key | Random key shown once as words or a QR code to print | With you; a wrapped copy of the data key is on the server |
| Device key | Non-extractable WebCrypto key per device, stored in IndexedDB | On the device |
| Capture key pair | X25519 pair for server-side capture (sealed boxes) | Public on server; private wrapped by the data key |

- New device: sign in, enter passphrase (or recovery key) → unwrap the data key → wrap it with the new device key.
- Changing the passphrase re-wraps the data key; data is not re-encrypted.
- Losing the passphrase **and** the recovery key means synced data can't be recovered. Devices that still have the data key keep working and can set a new passphrase. The UI says this plainly during setup.
- Libraries: WebCrypto for AES-GCM and key wrapping; libsodium (WASM) for sealed boxes, XChaCha20 and Argon2id.

## App lock (PL-45, PL-46)

- PIN or platform biometrics via WebAuthn (passkey with user verification) to unlock the app; auto-lock after idle time.
- Honest scope: on the web, app lock protects against someone picking up an unlocked device. It is not encryption at rest unless the local database is also encrypted. **Encrypted local storage** for sensitive modules (values encrypted with a key unlocked by the module lock) is offered as an option, with the trade-off that those values can't be searched while locked.

## AI privacy

- The privacy filter runs on the client before any tool result is sent (see [search and AI](search-and-ai.md#where-things-run)).
- Each AI request is logged locally with what was sent (AI-51).
- Use providers and settings with no training on user data and short retention; a hosted gateway with zero data retention where available.
- On-device embeddings and an optional on-device model for the most private questions.

## Web security

- Strict Content Security Policy: no inline scripts except Next.js nonces, no third-party scripts, `connect-src` limited to our API and chosen AI and sync endpoints.
- Pasted and clipped HTML is sanitised (DOMPurify) before it reaches the editor; embeds are sandboxed iframes from an allow-list.
- Attachments are served from OPFS via object URLs, never executed; SVG uploads are sanitised or rasterised.
- Plugins (PL-50) run in sandboxed iframes or workers with explicit permissions per plugin.
- Server: authenticated route handlers, rate limits, request size limits, per-user isolation in Postgres (row-level security), audit log of sign-ins and device changes.

## Threat model (summary)

| Threat | Mitigation |
| --- | --- |
| Server breach | Only ciphertext and minimal metadata (user ID, device IDs, message sizes and times) |
| Lost or stolen unlocked device | App lock, module lock, remote device revoke (stops future sync; can't wipe a browser) |
| Malicious pasted content or clip | Sanitisation, CSP, sandboxed embeds |
| Malicious plugin | Sandbox and permissions; plugins off by default |
| Over-sharing with AI | Privacy classes, per-area permissions, request preview and log |
| Data loss | Persistent storage, local snapshots, cloud backups, export; migrations back up first |
