# Feature catalogue

_As of 2026-10-02 · Mahdi_

Every feature planned for Personal OS, with an ID, priority, phase and status. The [roadmap](../ROADMAP.md) and [development plan](../DEVELOPMENT_PLAN.md) say _when_ and _in what order_; this catalogue says _what_; the [technical docs](../technical/README.md) say _how_.

## Domains

| File | Prefix | Covers |
| --- | --- | --- |
| [Knowledge](knowledge.md) | `KN` | Pages, block editor, links and backlinks, daily notes, canvas, second-brain methods |
| [Databases](databases.md) | `DB` | Custom databases, properties, relations, rollups, formulas, views, automations, forms |
| [Planning and execution](planning.md) | `PE`, `RV` | Planning, scheduling, focus mode, habits, gamification, reviews, insights |
| [Life modules](life-modules.md) | `LM-…` | Journal, health, nutrition, cycle, library, learning, challenges, finance, people and more |
| [Capture](capture.md) | `CA` | Universal inbox, quick capture, web clipper, share sheet, voice, email-in, OCR, read-later |
| [AI](ai.md) | `AI` | Ask your second brain, semantic search, planning assistant, writing, MCP server, privacy |
| [Platform](platform.md) | `PL` | Feature toggles, PWA, sync, security, notifications, integrations, import/export, localisation, accessibility |

## Conventions

**IDs** are stable: `KN-21` keeps its ID even if it moves phase or is renamed. Module features use `LM-<MODULE>-<n>`, e.g. `LM-FIN-13`. Gaps in numbering leave room to add features.

**Priority**

| Priority | Meaning |
| --- | --- |
| P0 | The phase is not done without it |
| P1 | Expected in the phase; may slip to the next |
| P2 | Nice to have; build when there is time or demand |

**Phase** follows the [roadmap](../ROADMAP.md#phases): `0` shipped · `1` foundation · `2` databases and first modules · `3` life modules · `4` sync and platform · `5` AI second brain.

**Status:** ✅ shipped · 🟡 partly shipped · ⬜ planned.

**Toggle:** every module and optional feature has a switch in **Settings → Features** (see [PL-01…PL-08](platform.md#feature-toggles)). Turning one off hides it everywhere but keeps its data. Rows marked _core_ can't be switched off.

## Definition of done for any feature

A feature is done when:

1. Its schema, service and pure logic are tested (see [quality](../technical/quality.md)).
2. It is included in JSON export and import, and has a migration if it changes stored data.
3. It is registered in the feature registry with its toggle, nav items, widgets, review prompts, analytics and notifications (see [modules and feature flags](../technical/modules-and-feature-flags.md)).
4. It works offline, on a phone, with keyboard only, in dark and light themes, and with Persian text and the Shamsi calendar.
5. Its records are linkable (mentions, backlinks) and searchable.
6. Its data has a privacy class so the AI layer knows whether it may read it (see [security and privacy](../technical/security-and-privacy.md)).
7. Its Command Center actions and Quick Add grammar, if any, exist.
8. This catalogue's status column is updated.

The full step-by-step checklist is in [technical/README.md](../technical/README.md#adding-a-feature).

## Summary by phase

| Phase | Theme | Headline features |
| --- | --- | --- |
| 0 ✅ | Planner | Today, calendar, week, month, tasks, projects, areas, goals, habits, time tracking, reviews, analytics, Quick Add, Shamsi calendar, JSON backup |
| 1 | Foundation | Feature toggles, schema migrations, trash, PWA, universal inbox, pages and block editor, daily notes, links and backlinks, full-text search, daily check-in (mood, day rating) |
| 2 | Databases and first modules | SQLite storage, database engine and views, templates, Journal, Library, Learning with flashcards, Challenges, Focus mode with Pomodoro, habit upgrades |
| 3 | Life modules | Health, Nutrition, Cycle, Finance, People, Startup, Career, Home, Travel, Recipes, Ideas; life dashboard, area homes, review wizard, insights, gamification |
| 4 | Sync and platform | Accounts, end-to-end encrypted sync, background push, calendar sync, web clipper, Telegram and email capture, imports, app lock, Persian UI, sharing, desktop app |
| 5 | AI second brain | Semantic search, ask your notes, planning assistant, summaries, flashcard generation, voice and OCR capture, MCP server, insights letters |
