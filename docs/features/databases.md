# Databases and views

_Prefix `DB` · Technical design: [data model](../technical/data-model.md#databases-and-records), [ADR-0004](../technical/adr/0004-typed-modules-over-generic-records.md)_

Custom databases make Personal OS work like Notion: define a collection (books, workouts, ideas, job applications), its properties, and as many views as you like. Tasks, projects, goals, habits and every life module are exposed through the same view engine as **built-in databases**, so a finance table and a reading board feel the same.

## Databases and properties

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| DB-01 | Custom databases | Create a database with a name, icon and description; it lives as a page (full page) or inline block inside another page | P0 | 2 | ⬜ |
| DB-02 | Basic properties | Text, number (with format: plain, percent, currency, unit), select, multi-select, status (groups: not started / in progress / done), checkbox, date and date range (with optional time), URL, email, phone | P0 | 2 | ⬜ |
| DB-03 | Rich properties | Files and media, person (People module), rating (1–5 stars), progress bar, colour, icon | P1 | 2 | ⬜ |
| DB-04 | Records have pages | Every record opens as a page with its properties on top and a block body below | P0 | 2 | ⬜ |
| DB-05 | Turn into record | Turn any page, block or inbox item into a record of a chosen database (Tana-style supertags) | P1 | 2 | ⬜ |
| DB-06 | Relations | Link records across databases, two-way by default (book ↔ author, workout ↔ goal, expense ↔ trip) | P0 | 2 | ⬜ |
| DB-07 | Rollups | Count, sum, average, min, max, earliest, latest, percent checked, or list through a relation | P0 | 2 | ⬜ |
| DB-08 | Formulas | A typed formula language: arithmetic, text, dates (Shamsi-aware `formatDate`), conditionals, property references, relation functions (`map`, `filter`, `sum`); errors shown inline | P1 | 2 | ⬜ |
| DB-09 | System properties | Created and edited time, auto-number ID with prefix, "last linked from daily note" | P1 | 2 | ⬜ |
| DB-10 | Custom fields on built-ins | Add properties to tasks, projects, goals, habits and module records (e.g. "energy" on tasks, "ISBN" on books) | P1 | 2 | ⬜ |
| DB-11 | Sub-items | Records can have child records (sub-tasks, sub-goals), shown nested in table and list views | P2 | 3 | ⬜ |
| DB-12 | Property validation | Required properties, number ranges, unique values | P2 | 3 | ⬜ |

## Views

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| DB-20 | Table view | Inline edit, resize and reorder columns, freeze first column, column calculations (sum, average, count, % empty) | P0 | 2 | ⬜ |
| DB-21 | Board view | Group by select/status/person; drag cards between columns; card previews with chosen properties and cover | P0 | 2 | ⬜ |
| DB-22 | Calendar view | Records placed by a date property, reusing the existing Shamsi/Gregorian calendar with drag to reschedule | P0 | 2 | 🟡 Calendar exists for blocks |
| DB-23 | List view | Compact, mobile-first list | P0 | 2 | ⬜ |
| DB-24 | Gallery view | Cards with cover images (book covers, recipes, mood boards) | P1 | 2 | ⬜ |
| DB-25 | Timeline view | Gantt-style bars from date ranges, dependencies drawn as arrows, drag to move or resize | P1 | 3 | ⬜ |
| DB-26 | Chart view | Bar, line, pie and heatmap of record counts or sums by property and over time | P1 | 3 | ⬜ |
| DB-27 | Filters, sorts and groups | Nested AND/OR filter groups, relative dates ("this Shamsi month", "last 7 days"), multi-level sorting, grouping with sub-groups and hidden groups; saved per view | P0 | 2 | ⬜ |
| DB-28 | Linked views | Embed any view of any database inside any page with its own filters (e.g. "books tagged #ai" inside the AI learning page) | P0 | 2 | ⬜ |
| DB-29 | Personal default view | Remember the last-used view and scroll position per database | P2 | 2 | ⬜ |
| DB-30 | Search inside a view | Quick filter box on every view | P1 | 2 | ⬜ |

## Templates, automation and entry

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| DB-40 | Record templates | A new record can start from a template (properties and body), with a default template per database | P1 | 2 | ⬜ |
| DB-41 | Recurring records | Create a record on a schedule (e.g. a "monthly finance check" record every 1st of the Shamsi month) | P2 | 3 | ⬜ |
| DB-42 | Automations | When a record is created, or a property changes, or on a schedule → set properties, create a task, add to daily note, send a notification; shown in a log | P1 | 3 | ⬜ |
| DB-43 | Buttons | A button block or property that runs a set of actions (e.g. "Start reading session") | P2 | 3 | ⬜ |
| DB-44 | Forms | A form view for quick, focused entry into a database (good on phones); later, shareable forms that write into your inbox | P1 | 3 | ⬜ |
| DB-45 | AI autofill | A property whose value an AI fills from the record body (summary, category, sentiment), shown as a proposal | P2 | 5 | ⬜ |

## Import and export

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| DB-50 | CSV import | Map CSV columns to properties, guess types, preview before import | P0 | 2 | ⬜ |
| DB-51 | CSV and markdown export | Export any view as CSV; export record pages as markdown with front matter | P0 | 2 | ⬜ |
| DB-52 | Notion import | Import Notion's export (markdown + CSV) including relations where possible | P1 | 4 | ⬜ |

## Acceptance criteria for P0 features

- A database with 50,000 records filters, sorts and groups in under 200 ms; tables are virtualised.
- Deleting a property asks first and moves its values into the trash (restorable for 30 days).
- Changing a property's type converts values where possible (text → number, select → multi-select) and shows how many values could not be converted before applying.
- Relations stay consistent both ways after edits, deletes and restores.
- Built-in databases (tasks, projects, goals, habits, module records) respect their own business rules: e.g. the table view can't put a task into a state the task service would reject.
