# Personal OS

A private, local-first operating system for planning, executing, tracking and reviewing a full-time
personal development routine — frontend learning, startup + AI work, health, books, rest.

> **Plan → Execute → Track → Review → Adjust.** Plans are hypotheses. Moving a task is normal,
> never a failure.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

On first launch an onboarding flow asks for your name, working days, hours, areas and weekly goals,
then creates a default **Normal Week** template. Tick *Include example data* to explore with realistic
projects, tasks, habits and three weeks of history (all dates are relative to today).

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next + React Compiler rules) |
| `npm test` | Vitest unit + React Testing Library component tests |
| `npm run test:e2e` | Playwright end-to-end flows (desktop + mobile). Starts its own dev server on :3100 |

Data lives in **IndexedDB** in your browser. Export/import JSON and reset from **Settings → Data**.

## What's in the MVP

- **Dashboard** — today's progress (planned / completed / remaining / tracked), schedule timeline,
  unscheduled pool, weekly goals, current focus + next task, weekly quick stats.
- **Today** — timeline (desktop) or large-target list (phone) on the left, unscheduled tasks on the
  right; drag tasks in, drag blocks around or back out. Day navigation to plan tomorrow.
- **Calendar** — day / week / month. Drag blocks between times and dates, drag the bottom edge to
  resize, click an empty slot to create, `←/→`, `D/W/M`, `T` shortcuts.
- **Week** — seven day columns with planned / completed hours and %, weekly goal progress, a week
  summary, **apply template** (proposal → review → apply) and **carry over**.
- **Month** — monthly goals, weekly summaries, projects, milestones, time distribution, daily heatmap.
- **Tasks / Projects / Areas** — full CRUD, filters, detail pages with progress and time spent.
- **Goals** — daily / weekly / monthly / long-term; hours, tasks, sessions, pages or custom metrics;
  automatic (from completed work) or manual tracking; milestones with linked tasks.
- **Time tracking** — optional start / pause / resume / stop timer, manual entries, editable history.
  Planning and tracking stay separate.
- **Habits**, **Reviews** (daily / weekly / monthly with data context), **Analytics** (planned vs
  completed, focused hours, where did my time go, weekly trend, consistency, estimate variance).
- **Command Center** (`⌘/Ctrl+K`) with **Quick Add**: `React 2h tomorrow`, `Gym Thursday 18:00`,
  `Startup 3h Saturday #mvp !high`, `Weekly Review every sunday 18:00`. Ambiguous input opens the
  pre-filled editor for confirmation. No AI needed.
- **Rescheduling** — Tomorrow / Next available slot / Later this week / Next week / Custom, each
  showing the concrete target before you confirm. Split a block into sessions; merge them back.
- **Recurring tasks** — daily / weekly (custom days) / monthly; instances are materialised a few weeks
  ahead, idempotently, never back-filled into the past.
- **Notifications** — optional reminders (upcoming, starting, still-open, daily planning/review,
  weekly review) while the app is open.
- **Settings** — week start, hours, time zone, date format, durations, working days, daily target,
  notifications, theme (dark-first), accent, density, week templates, export / import / reset.

## Architecture

```
src/
  app/                     Next.js App Router. Pages are thin Server Components that render features.
  features/<feature>/      Client UI per feature (dashboard, today, calendar, week, month, tasks, …)
  components/ui/           shadcn/ui-style primitives on Radix
  components/layout/       Shell: sidebar, bottom nav, shortcuts, theme sync
  components/shared/       Small shared pieces (area dot, stat, empty state, duration input…)
  services/                Use-cases (task, schedule, time, goals, habits, reviews, templates, data)
  repositories/            Storage abstraction: IndexedDB + in-memory implementations
  lib/                     Pure logic: date, analytics, goals, recurrence, scheduling, quick-add
  hooks/                   TanStack Query hooks, mutation helpers, clock
  store/                   Tiny selector-based UI store (global dialogs) — no giant context
  types/domain.ts          Zod schemas + types for every entity
  tests/                   Vitest unit + RTL component tests
e2e/                       Playwright flows
```

**Layers.** Components call *services*; services depend only on the `DataStore` interface
(`repositories/types.ts`); all calculations live in pure functions under `lib/`. Swapping IndexedDB for
PostgreSQL + an API means writing one new `DataStore` implementation (or a service layer that calls
HTTP) — no component changes.

**Task vs. block.** A `Task` is the work. A `ScheduleBlock` (task instance) is *when* it's planned.
One task can have many blocks (1h today + 1h tomorrow). Moving, splitting, merging and recurring
instances all operate on blocks, so the task is never duplicated. Blocks keep `originalDate` and a
`rescheduleCount` for insight, shown neutrally.

**Time.** "Actual time" is computed once (`lib/analytics/work.ts`): completed blocks contribute their
recorded actual duration; timer/manual entries contribute only when not attached to a completed block.
Analytics and goals share it, so nothing is double counted.

**Proposals, not silent changes.** Bulk operations (carry-over, applying a template) produce a list of
`PlanChange`s (`lib/planning/changes.ts`) that the user reviews before `schedule.applyChanges` runs.
A future AI planning assistant plugs into exactly this: *propose → confirm → apply*.

**State.** Server state via TanStack Query (per-collection and per-date-range keys, optimistic updates
for drag & drop, invalidation by group). UI state (which dialog is open) in a small external store with
selectors. Date-dependent rendering happens only on the client to avoid hydration mismatches.

**Errors.** Every mutation goes through `useAction` / `perform`, which provide pending state, success
toasts (often with **Undo**) and an error toast. Nothing fails silently.

## Roadmap

- **Phase 2** (largely included): habits, reviews, notifications, recurring tasks, deeper analytics.
- **Phase 3:** backend + auth, PostgreSQL `DataStore`, cloud sync, installable PWA with a service
  worker for background notifications.
- **Phase 4:** AI assistant ("Plan my week", "I only have 4 hours today") producing `PlanChange`
  proposals through the existing confirm/apply flow.
