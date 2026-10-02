# Planning, execution and review

_Prefixes `PE` (plan and execute) and `RV` (review and insight) · Technical design: [architecture](../technical/architecture.md), [data model](../technical/data-model.md#planning-extensions)_

The execution loop (Plan → Execute → Track → Review → Adjust) is what the app already does well. This file lists what exists, so the catalogue is complete, and what makes it deeper without making it heavier. The rule stays: **plans are hypotheses**, moves are counted but never punished, and bulk changes are proposed before they apply.

## Already shipped (Phase 0)

| ID | Feature | Status |
| --- | --- | --- |
| PE-A1 | Tasks with status, priority (low, medium, high, critical, with custom labels), area, project, goal, milestone, tags, estimate, due date, subtasks, dependencies, notes | ✅ |
| PE-A2 | Schedule blocks: drag onto timeline, move between days, resize, split and merge, "anytime" blocks; the task is never duplicated | ✅ |
| PE-A3 | Today (timeline and mobile list), Calendar (day, week, month), Week board, Month view | ✅ |
| PE-A4 | Recurring tasks: daily, weekly on chosen days, monthly; each occurrence can move or skip; nothing back-filled | ✅ |
| PE-A5 | Time tracking: start, pause, resume, stop, manual entries, editable history | ✅ |
| PE-A6 | Goals: daily, weekly, monthly and long-term; hours, tasks, sessions, pages or custom units; auto or manual tracking; milestones | ✅ |
| PE-A7 | Week templates with propose → review → apply | ✅ |
| PE-A8 | Rollover of unfinished work as proposals | ✅ |
| PE-A9 | Quick Add in English and Persian (`React 2h tomorrow`, `ورزش ۲ ساعت فردا ۱۸:۰۰`) | ✅ |
| PE-A10 | Command Center (`⌘K`): search, navigate, timers, reschedule | ✅ |
| PE-A11 | Habits with weekdays and streaks | ✅ |
| PE-A12 | Daily, weekly and monthly reviews with editable questions and a 1–5 energy rating | ✅ |
| PE-A13 | Analytics: planned vs completed, focus hours, time by area, weekly trend, consistency, estimate variance, most-moved tasks | ✅ |
| PE-A14 | In-app notifications: upcoming, start, overdue, planning and review reminders (while the app is open) | ✅ |

## Planning

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PE-01 | Morning planning ritual | Guided: review yesterday's leftovers, pick today's tasks from inbox/backlog/goals, timebox them, see workload vs available hours, set an intention | P0 | 2 | 🟡 Rollover exists |
| PE-02 | Evening shutdown ritual | Mark what got done, move or drop the rest (as proposals), write a line in the daily note, check-in mood and day rating, see tomorrow | P0 | 2 | 🟡 Daily review exists |
| PE-03 | Backlog and someday/maybe | Separate "someday" list that never shows in daily planning until promoted; monthly prompt to review it | P1 | 2 | ⬜ |
| PE-04 | Priority matrix | Eisenhower board (urgent × important) for inbox and backlog, drag to set priority and due date | P2 | 2 | ⬜ |
| PE-05 | Workload warnings | While planning, show planned vs available hours per day (working hours minus fixed events and breaks) and warn when over | P0 | 2 | 🟡 Planned vs completed in analytics |
| PE-06 | Time budgets per area | "Frontend 8h this week" shown as a filling bar while planning, not only after | P1 | 2 | ⬜ |
| PE-07 | Energy-aware planning | Tag tasks by energy (deep, shallow, admin); learn your high-energy hours from check-ins and focus data; suggest placement | P1 | 3 | ⬜ |
| PE-08 | Contexts | GTD contexts (`@home`, `@laptop`, `@errands`) as a filter in Today and the mobile list | P2 | 2 | ⬜ |
| PE-09 | Waiting-for and delegated | Tasks waiting on someone (linked to People), with follow-up dates | P1 | 3 | ⬜ |
| PE-10 | Auto-schedule proposal | One click: fit unscheduled tasks into free slots by priority, due date, energy and dependencies; result shown as a proposal | P1 | 2 | ⬜ |
| PE-11 | Dependencies on the timeline | Blocked tasks greyed out until prerequisites are done; warn when scheduling before a prerequisite | P1 | 2 | 🟡 Dependencies stored |
| PE-12 | Buffer and focus days | Protected blocks and days the auto-scheduler never fills | P2 | 2 | ⬜ |
| PE-13 | Project templates | E.g. "Learn a new library" creates the standard tasks, milestones and a notes page | P1 | 2 | ⬜ |
| PE-14 | Goal hierarchy and OKRs | Vision → yearly → quarterly → monthly → weekly goals, and objectives with measurable key results rolling up | P1 | 3 | 🟡 Goal periods exist |
| PE-15 | Life calendar and year view | Weeks-of-your-life grid, year themes, yearly goals | P2 | 3 | ⬜ |
| PE-16 | Recurrence upgrades | Every weekday, last Friday of the month, every N days after completion, Shamsi-month-aware rules, end after N times | P1 | 2 | 🟡 Basic rules exist |
| PE-17 | External events as busy time | Synced calendar events shown on the timeline and subtracted from available hours (needs PL-30) | P1 | 4 | ⬜ |
| PE-18 | Meeting notes from events | Open a calendar event → a notes page from the meeting template, linked to attendees in People | P2 | 4 | ⬜ |

## Doing

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PE-30 | Focus mode | Full-screen current task with its notes and subtasks, a distraction list for stray thoughts (goes to inbox), optional ambient sound | P0 | 2 | 🟡 Timer widget exists |
| PE-31 | Pomodoro timer | Focus / short break / long break with configurable lengths and long-break interval; auto-start option; sound and notification at each switch; focus time written as time entries | P0 | 2 | ⬜ |
| PE-32 | Focus stats | Pomodoros per day, focus hours by area, longest focus streak, interruption count | P1 | 2 | ⬜ |
| PE-33 | Now / next / later strip | On mobile: current block, next block and later list | P1 | 2 | ⬜ |
| PE-34 | Routines | Morning and evening routine checklists (ordered steps with durations) that tick habits when done | P1 | 2 | ⬜ |
| PE-35 | Checklists in blocks | Tick subtasks directly on a timeline block | P2 | 2 | ⬜ |

## Habits

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PE-40 | Measurable habits | Count or amount targets ("8 glasses", "20 pages") with partial progress | P0 | 2 | ⬜ |
| PE-41 | Flexible frequency | "3 times a week" or "10 times a month" without fixed days | P0 | 2 | ⬜ |
| PE-42 | Negative habits | Habits to avoid ("no sugar"); log slips, show days since | P1 | 2 | ⬜ |
| PE-43 | Skip and rest days | Mark a day as skipped (sick, travel) without breaking the streak or consistency | P0 | 2 | ⬜ |
| PE-44 | Consistency score | A forgiving score (weighted recent completion rate) shown next to, or instead of, the streak | P0 | 2 | ⬜ |
| PE-45 | Habit time of day and reminders | Morning/afternoon/evening grouping and per-habit reminders | P1 | 2 | ⬜ |
| PE-46 | Habit stacking and notes | "After coffee → read 10 pages"; a note per check-in | P2 | 3 | ⬜ |

## Gamification (opt-in, gentle)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| PE-50 | XP and levels | XP from completed work, habits, reviews and module logs; levels with a curve; XP per area | P1 | 3 | ⬜ |
| PE-51 | XP calculation modes | Per task, per focused minute, or weighted by area; changing mode recomputes history (XP is derived, never stored) | P1 | 3 | ⬜ |
| PE-52 | Milestones and badges | Quiet badges for long-term milestones (100 focus hours in Frontend, 12 books); no daily pressure | P2 | 3 | ⬜ |
| PE-53 | Monthly highlights card | A shareable card of the month's best moments and numbers | P2 | 3 | ⬜ |
| PE-54 | Streak counter on Today | Optional counter for chosen habits or categories, shown next to the consistency score | P1 | 3 | ⬜ |

No feature punishes a missed day: no lost XP, no broken-streak alarms, no red badges.

## Reviews

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| RV-01 | Guided weekly review wizard | Steps: clear inbox → review each area → check goals → look at insights → plan next week from a template; data shown beside each question | P0 | 3 | 🟡 Weekly review form exists |
| RV-02 | Monthly review | Month summary journal, goal results, challenge results, budget vs actual, books finished, mood and sleep trends | P0 | 3 | 🟡 Monthly review form exists |
| RV-03 | Quarterly and annual reviews | Charts pulled automatically; wheel of life comparison; year highlights; next year's themes | P1 | 3 | ⬜ |
| RV-04 | Review history | Browse and search past reviews; compare answers across weeks | P1 | 2 | 🟡 |
| RV-05 | Review templates | Multiple review templates (e.g. "light weekly", "deep monthly") selectable per period | P2 | 3 | 🟡 Custom questions exist |

## Insights and analytics

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| RV-20 | Correlations | Find relationships between daily series (mood, day rating, sleep, energy, focus hours, habits, workouts, spending, calories) with sample size and strength; worded as "noticed", not "proven" | P1 | 3 | ⬜ |
| RV-21 | Personal patterns | Best hours of the day, most-postponed task types, estimate accuracy by area, which weekday you plan too much | P1 | 3 | 🟡 Some analytics exist |
| RV-22 | Life dashboard | Wheel of life (score per area), time balance across areas, each module's key number | P1 | 3 | ⬜ |
| RV-23 | Area home pages | An area page gathering its projects, notes, goals, habits, module records and stats | P0 | 3 | 🟡 Area detail exists |
| RV-24 | Custom charts on any page | Chart blocks fed by database views (DB-26) | P2 | 3 | ⬜ |
| RV-25 | Year in pixels | A heatmap of the year coloured by mood, day rating or any metric | P1 | 2 | ⬜ |
