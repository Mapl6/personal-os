# Competitive analysis

_As of 2026-10-02 · Mahdi_

This note lists what the leading second-brain, planning and life-tracking apps do best, and what Personal OS adopts from each. Feature IDs link into the [feature catalogue](../features/README.md).

## The landscape in one picture

No single app covers all four pillars (Capture, Know, Do, Reflect) and the life-tracking modules. Each leader is excellent at one or two:

| Pillar | Best in class | What makes them strong |
| --- | --- | --- |
| Know: pages and databases | Notion | Blocks, nested pages, databases with relations, rollups, formulas and many views; agents and AI autofill on databases |
| Know: linked notes | Obsidian, Logseq, Roam | Local markdown files, `[[links]]`, backlinks, graph, plugins; Obsidian Bases adds database views over notes |
| Know: typed objects | Tana, Capacities, Anytype | Any note can become a typed object (Tana "supertags", Capacities "object types") with fields; Anytype is local-first and end-to-end encrypted |
| Know: visual thinking | Heptabase | Infinite whiteboards of cards, sections and arrows for learning and research |
| Capture and reading | Readwise Reader | Read-later queue, highlights from everywhere, daily spaced-repetition review of highlights, AI "Ghostreader" |
| Do: daily planning | Sunsama, Akiflow, Motion | Sunsama: guided planning and shutdown rituals; Akiflow: universal inbox and command bar; Motion: automatic rescheduling |
| Do: tasks | Todoist, Things, TickTick | Natural-language quick add, projects, recurring tasks; TickTick adds a Pomodoro timer and habits |
| Reflect: self-tracking | Exist.io, Bearable, Daylio | Two-tap mood logging, custom tags, and **correlations** ("what makes me happiest?") across mood, sleep, habits and activity |
| Life: money | YNAB, Actual Budget | Envelope budgeting ("give every dollar a job"); Actual is open-source, local-first and end-to-end encrypted |
| Life: people | Dex, Clay | Keep-in-touch reminders, interaction timeline, birthdays, contact import |
| Learning | Anki | Spaced repetition; the FSRS algorithm is now the open standard |
| Iranian all-in-one planner | Yasiplann | Daily/weekly/monthly planner with habits, mood, weight and body measurements, calorie counter, library, learning roadmap, finance with loans and installments, cycle tracking, Pomodoro, XP and levels |

**The opportunity:** one local-first, private app where notes, plans and life records live in the same graph, with Shamsi dates and Persian text treated as first-class, and an AI that can read all of it (only with permission) and only ever proposes changes.

## What we adopt from each

| App | Signature feature | What Personal OS adopts | Feature IDs |
| --- | --- | --- | --- |
| Notion | Block pages, databases with relations, rollups and formulas, many views, templates, automations, AI autofill | The whole block-and-database model, linked views inside pages, database automations and AI autofill as proposals | KN-01…KN-12, DB-01…DB-30 |
| Obsidian | Local files, wiki links, backlinks, graph, canvas, plugins, Bases | Wiki links, backlinks, unlinked mentions, graph, canvas, markdown export, plugin API | KN-20…KN-29, PL-50 |
| Logseq / Roam | Outliner, block references, daily journal as the default entry point | Block references and transclusion, outliner mode, daily note as home | KN-13, KN-14, KN-30 |
| Tana | Supertags: any node becomes a typed record; AI over structure; local API and MCP server | "Turn into…" any block or page into a database record; MCP server over your data | DB-05, AI-40 |
| Capacities | Object types (Book, Person, Meeting) with daily notes as the hub | Built-in object types per module, with everything also reachable from the daily note | LM-…, KN-30 |
| Anytype | Local-first, end-to-end encrypted, open data model | Local-first storage, end-to-end encrypted sync, recovery phrase | PL-40…PL-48 |
| Heptabase | Whiteboards of cards for learning | Canvas view of pages and records | KN-40 |
| Readwise Reader | Read-later, highlights, daily review with spaced repetition | Read-later queue, highlights flowing into notes, daily highlight review | CA-20…CA-24, LM-LRN-… |
| Sunsama | Daily planning and shutdown rituals, workload warnings | Guided morning plan and evening shutdown, "you planned more than your day" warning | PE-01, PE-02, PE-05 |
| Akiflow | Universal inbox, command bar, keyboard speed | Universal inbox, `⌘K` capture to inbox, keyboard processing | CA-01…CA-05 |
| Motion | Auto-scheduling that reshuffles the day | Auto-scheduling, but always as a proposal you confirm | PE-10, AI-20 |
| TickTick | Pomodoro and habits inside the task app | Focus mode with Pomodoro tied to tasks and time tracking | PE-30…PE-33 |
| Exist.io / Bearable | Correlations across mood, sleep, habits and activity | Insights engine finding correlations across all daily data, with careful wording | RV-20…RV-24 |
| Daylio | Two-tap mood with activities | Daily check-in: mood, emotions, activities, day rating in a few taps | LM-JRN-01…05 |
| YNAB / Actual | Envelope budgets, accounts, transfers, reconciliation, local-first with E2EE | Finance module with accounts, transfers, budgets, loans, installments, CSV import | LM-FIN-… |
| Dex / Clay | Keep-in-touch reminders, interaction timeline | People module with "reach out every N weeks" and interaction log | LM-PPL-… |
| Anki | Spaced repetition | Flashcards scheduled with FSRS (via `ts-fsrs`) | LM-LRN-10…13 |
| Yasiplann | Life trackers built for Iranian users: body, calories, cycle, loans, installments, XP | Every Yasiplann tracker is covered as an optional module | See the [Yasiplann coverage](#yasiplann-coverage) table |

## Where Personal OS can lead

1. **Plan + knowledge + life data in one graph.** Notion has pages and databases but weak planning and no life tracking. Sunsama plans well but has no knowledge. Exist correlates data but you can't write in it. Here one daily note shows your plan, what you did, how you felt, what you spent and what you learned, and each piece links to the rest.
2. **Persian-first.** Shamsi dates everywhere, Persian quick add, RTL text that works inside the same note as English, Persian-aware search (letter and digit normalisation), Persian voice capture, and Iranian finance details (toman, bank SMS import).
3. **Private by design.** Local-first storage, end-to-end encrypted sync, per-area AI permissions, and sensitive modules (journal, finance, cycle) locked separately.
4. **Calm planning.** Plans are hypotheses: moves are counted but never punished, streaks have a forgiving alternative, and AI proposes but never silently reshuffles (unlike Motion).
5. **Only what you use.** Every module and feature can be switched off in Settings, so the app can be as small as a planner or as large as a full life OS.

## Yasiplann coverage

Every Yasiplann feature, mapped to where it lives in our catalogue:

| Yasiplann | Personal OS | Status |
| --- | --- | --- |
| Today / week / month dashboard | Dashboard, Today, Week, Month | ✅ Shipped |
| Tasks, recurring tasks, priorities, time estimates | Tasks | ✅ Shipped |
| Goals with sub-stages, linked to tasks | Goals with milestones | ✅ Shipped |
| Habits with streaks | Habits | ✅ Shipped (upgrades in PE-40…PE-46) |
| Moving unfinished tasks forward | Rollover proposals | ✅ Shipped |
| Statistics | Analytics | ✅ Shipped (insights in RV-20…RV-24) |
| JSON backup and restore | Settings → Data | ✅ Shipped |
| Reminders | Notifications | 🟡 While the app is open; background push in PL-21 |
| Mood log and mood calendar | LM-JRN-01, LM-JRN-04 | ⬜ Phase 1–2 |
| Day rating (5 stars) | LM-JRN-02 | ⬜ Phase 1 |
| Daily notes / notebook | KN-30, LM-JRN-… | ⬜ Phase 1 |
| Weekly journal, month summary | KN-31, RV-01…RV-03 | ⬜ Phase 1–3 |
| Brain dump | CA-01 Universal inbox, LM-JRN-07 | ⬜ Phase 1 |
| Monthly challenges | LM-CHL-… | ⬜ Phase 2 |
| Library (books, podcasts, films) | LM-LIB-… | ⬜ Phase 2 |
| Learning roadmap | LM-LRN-01…05 | ⬜ Phase 2 |
| Pomodoro timer | PE-30…PE-33 | ⬜ Phase 2 |
| Sleep logging | LM-HLT-01 | ⬜ Phase 3 |
| Weight and body measurements | LM-HLT-03, LM-HLT-04 | ⬜ Phase 3 |
| Calorie counter | LM-NUT-… | ⬜ Phase 3 |
| Women's health cycle | LM-CYC-… | ⬜ Phase 3 |
| Finance: accounts, income and expenses, categories, budgets, transfers, history, financial month | LM-FIN-01…LM-FIN-12 | ⬜ Phase 3 |
| Loans (borrowed and lent) | LM-FIN-13 | ⬜ Phase 3 |
| Installments | LM-FIN-14 | ⬜ Phase 3 |
| XP, levels, XP calculation modes | PE-50…PE-53 | ⬜ Phase 3 |
| Streak counter on the dashboard | PE-54 | ⬜ Phase 3 |

## Technology findings that shaped the technical docs

- **Local-first sync has matured but is fragmented.** Zero, PowerSync, ElectricSQL, InstantDB, Triplit, Jazz and Automerge each solve part of the problem; few support end-to-end encryption. Actual Budget shows a simpler route that fits a single-user, encrypted app: an encrypted log of field-level changes ordered by hybrid logical clocks. See [ADR-0003](../technical/adr/0003-encrypted-change-log-sync.md).
- **SQLite in the browser is production-ready.** Notion runs WASM SQLite in the browser. OPFS-backed VFSs (wa-sqlite, the official sqlite-wasm build) give fast, durable storage, and FTS5 gives full-text search. See [ADR-0001](../technical/adr/0001-sqlite-wasm-storage.md).
- **Block editors:** BlockNote (built on TipTap/ProseMirror) gives a Notion-like editor with Yjs collaboration out of the box; TipTap and Lexical are more flexible but need more work. RTL behaviour has to be checked in a spike. See [ADR-0002](../technical/adr/0002-block-editor.md).
- **On-device AI is practical for embeddings.** Transformers.js on WebGPU/WASM can create embeddings in the browser, so semantic search can work offline and privately; chat still needs a hosted model.
- **Spaced repetition:** `ts-fsrs` implements FSRS v6 in TypeScript.
- **Persian speech recognition:** fine-tuned Whisper models reach about 14–26% word error rate on Persian benchmarks; hosted services report lower. Voice capture should always show the transcript for editing.

## Sources

- Tana: [supertags guide](https://aiproductivity.ai/guides/tana-supertags-guide/), [Tana and AI](https://fisletter.beehiiv.com/p/tana-and-ai), [Tana reviews 2026](https://subscribed.fyi/tana/reviews/)
- Capacities, Anytype, Heptabase: [Capacities vs Heptabase](https://capacities.io/compare/heptabase), [Capacities vs Anytype](https://capacities.io/compare/anytype), [Heptabase alternatives 2026](https://tana.inc/blog/best-heptabase-alternatives-2026)
- Notion: [releases](https://www.notion.com/es/releases), [Notion AI review 2026](https://eesel.ai/blog/notion-ai-review), [Notion agents launch](https://techcrunch.com/2025/09/18/notion-launches-agents-for-data-analysis-and-task-automation/), [WASM SQLite in Notion](https://www.notion.com/ja/blog/how-we-sped-up-notion-in-the-browser-with-wasm-sqlite)
- Obsidian: [v1.9.0 changelog (Bases)](https://obsidian.md/bn/changelog/2025-05-21-desktop-v1.9.0/), [v1.12.0 changelog](https://obsidian.md/zh/changelog/2026-02-10-desktop-v1.12.0/), [Canvas Bases](https://community.obsidian.md/plugins/canvas-bases)
- Planning apps: [Sunsama vs Akiflow](https://www.morgen.so/blog-posts/sunsama-vs-akiflow), [Sunsama vs Motion](https://www.morgen.so/blog-posts/sunsama-vs-motion), [Sunsama compare](https://sunsama.com/compare)
- Self-tracking: [Exist custom tags](https://exist.io/about/custom-tags/), [Exist mood](https://exist.io/about/mood/), [Exist use cases](https://exist.io/blog/use-cases/)
- Reading: [Readwise Reader](https://readwise.io/read)
- Finance: [Actual Budget overview](https://selfhostyourself.com/services/actual-budget), [YNAB alternatives](https://selfhostyourself.com/alternative-to/ynab)
- People: [Dex vs Clay](https://getdex.com/blog/dex-vs-clay), [Dex product](https://getdex.com/product/)
- Sync engines: [local-first databases analysis](https://www.letsdatascience.com/news/developers-adopt-local-first-databases-for-performance-94cb2640), [offline-first sync deep dive 2026](https://www.youngju.dev/transcribe/culture/2026-05-16-pwa-offline-first-sync-2026-workbox-replicache-rxdb-yjs-automerge-livestore-electric-zero-ground-deep-dive), [Electric alternatives](https://electric.ax/docs/sync/reference/alternatives.md)
- Browser storage: [SQLite persistence on the web](https://powersync.com/blog/sqlite-persistence-on-the-web), [PGlite benchmarks](https://pglite.dev/benchmarks)
- Editors: [Which rich text editor in 2025](https://development.liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025), [Best rich text editors 2026](https://velt.dev/blog/best-rich-text-editors-react-2026)
- On-device AI: [In-browser semantic search with PGlite and Transformers.js](https://supabase.com/blog/in-browser-semantic-search-pglite), [Transformers.js + WebGPU in Next.js](https://noqta.tn/en/tutorials/transformers-js-webgpu-browser-ai-nextjs-2026), [RxDB vector database](https://rxdb.info/articles/javascript-vector-database.html)
- Spaced repetition: [ts-fsrs](https://npmjs.com/package/ts-fsrs)
- Persian speech: [whisper-large-fa-v1](https://huggingface.co/vhdm/whisper-large-fa-v1), [Spontaneous Persian Speech dataset (2026)](https://aclanthology.org/2026.sigul-1.26/), [ElevenLabs Persian STT](https://elevenlabs.io/speech-to-text/persian)
- Yasiplann: [demo](https://yasiplann.ir/demo/)
