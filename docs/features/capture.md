# Capture everywhere

_Prefix `CA` · Technical design: [data model](../technical/data-model.md#inbox-and-attachments), [storage and sync](../technical/storage-and-sync.md#server-side-capture)_

A second brain only works if capturing takes under five seconds from wherever you are. Everything lands in one **Inbox**, to be sorted later.

## Inbox

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| CA-01 | Universal inbox | One list for text, tasks, links, images, files, voice memos, emails and clipped pages; newest first; count badge in the sidebar | P0 | 1 | 🟡 Tasks have an `inbox` status |
| CA-02 | Process with the keyboard | Per item: convert to task (with Quick Add parsing), file into a page, turn into a database record, link to project/area, schedule, delete, archive; `j/k` to move, one-key actions | P0 | 1 | ⬜ |
| CA-03 | Capture to inbox from `⌘K` | Anything typed in `⌘K` that isn't a command can be sent to the inbox with `⌘Enter`; Quick Add still works | P0 | 1 | 🟡 Quick Add exists |
| CA-04 | Inbox zero ritual | A daily 5-minute processing prompt that feeds the morning plan; weekly review step "clear inbox" | P1 | 2 | ⬜ |
| CA-05 | Batch processing | Multi-select items and apply one action (tag, move to project, archive) | P1 | 2 | ⬜ |
| CA-06 | AI processing proposals | Suggested action per item (e.g. "task in Startup, due Friday"), accepted one by one or all at once | P2 | 5 | ⬜ |

## Quick capture surfaces

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| CA-10 | Floating capture button | On mobile, a bottom-sheet capture with text, voice, photo and type picker (inbox, task, note, expense, mood) | P0 | 1 | ⬜ |
| CA-11 | PWA share target | Installed app appears in the phone's share sheet; shared text, links, images and files land in the inbox | P0 | 1 | ⬜ |
| CA-12 | App shortcuts | Long-press the app icon: "New task", "Log mood", "Add expense", "Start focus" | P1 | 1 | ⬜ |
| CA-13 | Global hotkey | Desktop app (PL-70) opens a capture window from anywhere | P2 | 4 | ⬜ |
| CA-14 | Drag and drop and paste | Drop files or paste images and links anywhere in the app; they are attached or go to the inbox | P1 | 1 | ⬜ |
| CA-15 | Home-screen widgets | Native widgets need the native app (PL-71); until then, app shortcuts | P2 | 4 | ⬜ |

## Channels from outside the app

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| CA-30 | Web clipper | Browser extension: save the page (cleaned article), a selection, a highlight or a screenshot with its URL, into the inbox or a chosen page/database | P1 | 4 | ⬜ |
| CA-31 | Telegram bot | Send text, voice, photos, files or forwarded messages to a private bot; they arrive in the inbox (encrypted on arrival) | P1 | 4 | ⬜ |
| CA-32 | Email-in address | A private address; forwarded emails, newsletters and receipts arrive in the inbox with attachments | P2 | 4 | ⬜ |
| CA-33 | Voice capture | Record in the app; transcribe in Persian or English; turn into a note, task or several tasks; audio kept as attachment | P1 | 5 | ⬜ |
| CA-34 | Scan and OCR | Photograph a whiteboard, receipt or book page; text is extracted and searchable; receipts can propose an expense | P2 | 5 | ⬜ |
| CA-35 | Calendar invites | Events from synced calendars can be "captured" into tasks or notes (needs PL-30) | P2 | 4 | ⬜ |

## Read-later and highlights

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| CA-20 | Read-later queue | Saved articles in a queue (part of the Library module) with estimated reading time | P1 | 2 | ⬜ |
| CA-21 | Reader view | Clean article view with adjustable font, RTL support and progress | P1 | 2 | ⬜ |
| CA-22 | Highlights | Highlight and annotate inside the reader; highlights flow into the item's notes page and the daily note | P1 | 2 | ⬜ |
| CA-23 | RSS and newsletters | Subscribe to feeds; new items appear in the reader, not the inbox | P2 | 4 | ⬜ |
| CA-24 | Highlight review | Highlights resurface in the daily review (LM-LRN-12) | P1 | 2 | ⬜ |

## Acceptance criteria for P0 features

- Opening capture and saving a text item takes at most two interactions and under one second, offline included.
- Nothing captured is ever lost: inbox items are saved before any parsing or upload, and failed processing leaves the item in the inbox with an error note.
- Shared files larger than the local quota show a clear error rather than failing silently.
