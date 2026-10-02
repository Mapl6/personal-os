# Platform

_Prefix `PL` · Technical design: [modules and feature flags](../technical/modules-and-feature-flags.md), [storage and sync](../technical/storage-and-sync.md), [security and privacy](../technical/security-and-privacy.md), [quality](../technical/quality.md)_

A life OS has to stay small when you want it small, run on every device, never lose data and keep private things private.

## Feature toggles

Every module and optional feature can be turned on or off by the user in **Settings → Features**.

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-01 | Settings → Features page | One switch per module and per optional feature, grouped (Knowledge, Planning, Life modules, Capture, AI, Integrations), each with a one-line description | P0 | 1 | 🟡 Nav items can be hidden |
| PL-02 | Hide, never delete | Turning a feature off removes its nav items, routes (shows a "turned off" screen with a switch), Today and dashboard widgets, review prompts, analytics, notifications, Quick Add grammar and Command Center actions; its data stays and comes back when turned on | P0 | 1 | ⬜ |
| PL-03 | Dependencies | Features that need another feature say so (e.g. Nutrition needs Health for weight trends; turning off People warns that Loans lose their person links but keep the names) | P0 | 1 | ⬜ |
| PL-04 | Core features | Tasks, Today, Calendar, Settings and Inbox are core and can't be turned off | P0 | 1 | ⬜ |
| PL-05 | Sensible defaults | New installs start with the core planner plus Journal, Library, Learning and Challenges; sensitive modules (Cycle, Finance) start off | P0 | 1 | ⬜ |
| PL-06 | Presets in onboarding | "Planner only", "Student", "Health focus", "Founder", "Everything" set many switches at once; can be re-run from Settings | P1 | 1 | ⬜ |
| PL-07 | Delete a module's data | Separate, explicit action ("Delete all Finance data") with confirmation and export first | P1 | 2 | ⬜ |
| PL-08 | Toggles travel with you | Toggle state is in the JSON backup and syncs across devices | P0 | 1 | ⬜ |

**Optional features with their own switch:** Pomodoro and focus mode, XP and levels, streak counter, consistency score, mood log, day rating, priority matrix, auto-schedule, insights and correlations, canvas, graph view, flashcards, AI (and each AI feature), each integration, each notification type.

## Data safety

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-10 | Schema versions and migrations | Every stored entity and every export carries a schema version; a migration runner upgrades old data and old backups | P0 | 1 | ⬜ |
| PL-11 | Persistent storage | Ask the browser for persistent storage so data is not evicted; show storage usage and quota | P0 | 1 | ⬜ |
| PL-12 | Automatic local backups | Daily snapshot kept on device (last 7 days, last 4 weeks) | P1 | 2 | ⬜ |
| PL-13 | Backups to your cloud | Encrypted scheduled backup to Google Drive, Dropbox or a WebDAV server | P2 | 4 | ⬜ |
| PL-14 | JSON backup and restore | Full export and import | P0 | 0 | ✅ |
| PL-15 | Markdown and CSV export | Every page as markdown (with front matter and attachments), every database as CSV, in one zip | P0 | 2 | ⬜ |
| PL-16 | Imports | Notion, Obsidian (markdown vault), Logseq, Todoist, Google Keep, Anki, Daylio CSV | P1 | 4 | ⬜ |
| PL-17 | Undo everywhere | Undo for deletes, moves, bulk changes and applied proposals | P1 | 1 | 🟡 Some actions |

## App, offline and notifications

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-20 | Installable PWA | Manifest, icons, splash, offline app shell, update prompt when a new version is ready | P0 | 1 | ⬜ |
| PL-21 | Background notifications | Web Push for reminders when the app is closed (planning, review, habits, birthdays, installments, keep-in-touch) | P1 | 4 | 🟡 In-app only |
| PL-22 | Notification centre | In-app list of recent reminders and AI proposals waiting; quiet hours; per-type switches | P1 | 2 | ⬜ |
| PL-23 | Mobile polish | Swipe actions on tasks, bottom-sheet editors, haptics, large touch targets | P1 | 2 | 🟡 Responsive layout exists |
| PL-24 | Badging | App icon badge with inbox or due count | P2 | 2 | ⬜ |

## Calendar and integrations

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-30 | Calendar sync | Two-way Google Calendar sync, CalDAV (Apple iCloud, Fastmail) and read-only ICS subscriptions; external events as busy time | P1 | 4 | ⬜ |
| PL-31 | GitHub | Issues and pull requests into projects; commits counted as activity | P2 | 4 | ⬜ |
| PL-32 | Health data | Apple Health and Google Health Connect via the native app; manual or CSV until then | P2 | 4 | ⬜ |
| PL-33 | Readwise and Kindle | Highlights import | P2 | 4 | ⬜ |
| PL-34 | Telegram | Capture bot (CA-31) and optional reminders via Telegram | P1 | 4 | ⬜ |
| PL-35 | Attachments from Drive / Dropbox | Link or import files | P2 | 4 | ⬜ |

## Accounts, sync and security

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-40 | Accounts | Optional sign-in (email link or passkey); the app keeps working without an account | P0 | 4 | ⬜ |
| PL-41 | End-to-end encrypted sync | All data encrypted on device before upload; the server stores only ciphertext | P0 | 4 | ⬜ |
| PL-42 | Offline edits merge | Offline edits on phone and laptop both survive; field-level merge for records, character-level merge for pages | P0 | 4 | ⬜ |
| PL-43 | Devices | List devices, revoke a device, see last sync | P1 | 4 | ⬜ |
| PL-44 | Recovery | Recovery key (printable) and passphrase; clear warning that losing both means losing synced data | P0 | 4 | ⬜ |
| PL-45 | App lock | PIN or biometrics (WebAuthn) to open the app, auto-lock after idle | P1 | 4 | ⬜ |
| PL-46 | Extra lock for sensitive modules | Journal, Finance, Cycle can require unlocking separately | P1 | 4 | ⬜ |
| PL-47 | Privacy dashboard | What is stored where, what is synced, what AI may read, storage per module | P1 | 4 | ⬜ |
| PL-48 | Local-only modules | Choose modules that never sync (stay on this device) | P2 | 4 | ⬜ |

## Sharing and collaboration

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-55 | Publish a page | Read-only public link to a page (decrypted copy uploaded on purpose), with unpublish | P2 | 4 | ⬜ |
| PL-56 | Share with a person | Share a page or project with one collaborator; comments | P2 | 4 | ⬜ |

## Extensibility

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-50 | Plugin API | Plugins register blocks, views, commands, Quick Add grammar and module types through the same registry the built-in modules use; sandboxed; permissions per plugin | P2 | 4 | ⬜ |
| PL-51 | Local REST API and webhooks | For scripts and automation tools; disabled by default | P2 | 4 | ⬜ |
| PL-52 | Custom themes and CSS | Theme editor and a custom CSS snippet setting | P2 | 3 | 🟡 Accents and density exist |
| PL-53 | Keyboard shortcut editor | Rebind every shortcut | P2 | 3 | ⬜ |

## Localisation and accessibility

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-60 | Shamsi calendar everywhere | Month boundaries, pickers, recurrence, reviews, finance months, birthdays | P0 | 0 | ✅ (extend to every new module) |
| PL-61 | RTL-ready layout | All new UI uses logical CSS (`ms-`, `pe-`, `start`, `end`) so the layout mirrors correctly | P0 | 1 | ⬜ |
| PL-62 | Full Persian interface | All UI strings translated, Persian digits, Vazirmatn font, mirrored layout; English stays available | P1 | 4 | ⬜ |
| PL-63 | Persian-aware text | Search normalisation, Quick Add, voice capture and sorting work for Persian | P0 | 1 | 🟡 Quick Add understands Persian |
| PL-64 | Accessibility | WCAG 2.2 AA: keyboard for everything, screen-reader labels, focus states, reduced motion, colour contrast in both themes | P0 | all | 🟡 Existing UI follows it |

## Apps

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PL-70 | Desktop app | Tauri wrapper with global capture hotkey, menu-bar timer and native notifications | P2 | 4 | ⬜ |
| PL-71 | Native mobile app | Expo / React Native app sharing the core logic, for widgets, health data and reliable notifications | P2 | 4+ | ⬜ |
