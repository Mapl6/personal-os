# Data model

_See also [architecture](architecture.md), [storage and sync](storage-and-sync.md), [ADR-0004](adr/0004-typed-modules-over-generic-records.md)_

The existing entities (`Area`, `Project`, `Task`, `ScheduleBlock`, `TimeEntry`, `Goal`, `GoalProgress`, `Habit`, `HabitEntry`, `Review`, `WeekTemplate`, `Settings`) live in `src/types/domain.ts`. This doc describes what gets added. Schemas are sketched in Zod the way the codebase writes them; field lists are the contract, exact validation limits are decided in the PR.

## Base fields

Every entity, new and existing, gets these fields (existing ones in the Phase 1 migration):

```ts
const baseFields = {
  id: z.string(),                       // createId()
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  /** Soft delete: set when moved to trash; purged after 30 days. */
  deletedAt: isoDateTime.nullable().default(null),
  /** Schema version of this row's shape, for migrations. */
  v: z.number().int().default(1),
};
```

- **Soft delete** powers the trash (KN-11), undo and sync (a delete is just another change).
- **`v`** lets the migration runner upgrade rows lazily as well as in bulk.

## References and links

One type names any linkable thing:

```ts
export const ENTITY_TYPES = [
  "page", "task", "project", "area", "goal", "habit", "record", "person",
  "inbox", "day", "attachment",
] as const;

export const entityRefSchema = z.object({
  type: z.enum(ENTITY_TYPES),
  id: z.string(),          // for "day": a dateKey
});
```

Links are derived, not authored directly: the links indexer writes them from page content, record relations and entity foreign keys.

```ts
export const linkSchema = z.object({
  id: z.string(),
  from: entityRefSchema,
  /** Block inside the source page, for context snippets and block references. */
  fromBlockId: z.string().nullable(),
  to: entityRefSchema,
  kind: z.enum(["wikilink", "mention", "relation", "embed", "tag", "blockref"]),
});
```

## Pages and content

```ts
export const PAGE_KINDS = ["page", "daily", "weekly", "monthly", "yearly", "template", "record", "canvas"] as const;

export const pageSchema = z.object({
  ...baseFields,
  title: z.string().max(300),
  icon: z.string().nullable().default(null),            // emoji or icon name
  cover: z.string().nullable().default(null),           // attachment id or URL
  kind: z.enum(PAGE_KINDS).default("page"),
  /** For daily/weekly/monthly/yearly notes: the period start (Gregorian key). */
  periodStart: dateKey.nullable().default(null),
  parentId: z.string().nullable().default(null),
  /** Fractional index string for ordering among siblings (no renumbering on insert). */
  order: z.string(),
  areaId: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  favourite: z.boolean().default(false),
  locked: z.boolean().default(false),
  /** Set when this page is the body of a database record. */
  recordId: z.string().nullable().default(null),
  privacy: z.enum(["normal", "private", "sensitive"]).default("normal"),
});
```

Page **content** is stored separately from page metadata, because it is large, changes often and syncs differently:

```ts
export const pageContentSchema = z.object({
  pageId: z.string(),
  /** Yjs document state (binary), the source of truth for the editor. */
  ydoc: z.instanceof(Uint8Array),
  /** Derived on save: plain text (for search) and outline (for TOC, block refs). */
  text: z.string(),
  blocks: z.array(z.object({ id: z.string(), type: z.string(), text: z.string() })),
  updatedAt: isoDateTime,
});

export const pageSnapshotSchema = z.object({   // KN-10 page history
  id: z.string(), pageId: z.string(), ydoc: z.instanceof(Uint8Array), createdAt: isoDateTime,
});
```

Daily notes are unique per `(kind, periodStart)`. Creation uses that pair as a natural key so two tabs can't create two notes for the same day (see [editor and links](editor-and-links.md#daily-notes)).

## Databases and records

```ts
export const PROPERTY_TYPES = [
  "text", "number", "select", "multi_select", "status", "checkbox", "date",
  "url", "email", "phone", "files", "person", "rating", "progress",
  "relation", "rollup", "formula", "created_time", "updated_time", "auto_id",
] as const;

export const propertySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  type: z.enum(PROPERTY_TYPES),
  /** Type-specific config: options for selects, number format, relation target, rollup spec, formula source… */
  config: z.record(z.string(), z.unknown()).default({}),
  hidden: z.boolean().default(false),
});

export const viewSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["table", "board", "calendar", "list", "gallery", "timeline", "chart", "form"]),
  filter: filterGroupSchema.nullable(),          // nested AND/OR tree
  sorts: z.array(z.object({ propertyId: z.string(), direction: z.enum(["asc", "desc"]) })),
  groupBy: z.string().nullable(),
  visibleProperties: z.array(z.string()),
  layout: z.record(z.string(), z.unknown()).default({}),   // column widths, card size, date property…
});

export const databaseSchema = z.object({
  ...baseFields,
  name: z.string(),
  icon: z.string().nullable(),
  pageId: z.string(),                       // the page that hosts it
  /** Set for built-in databases backed by typed collections (tasks, books, transactions…). */
  builtIn: z.string().nullable().default(null),
  properties: z.array(propertySchema),
  views: z.array(viewSchema),
  templates: z.array(z.object({ id: z.string(), name: z.string(), values: z.record(z.string(), z.unknown()), pageTemplateId: z.string().nullable() })),
});

export const recordSchema = z.object({
  ...baseFields,
  databaseId: z.string(),
  /** propertyId → value; value shape depends on property type. */
  values: z.record(z.string(), z.unknown()),
  order: z.string(),
});
```

Notes:

- **Relations** store target record IDs in the source record's value; the reverse side is a property on the target database pointing back, kept consistent by the database service in one transaction.
- **Rollups and formulas** are computed, never stored. Formulas compile to a small AST evaluated in `lib/formula/` (pure, tested); results can be cached in the worker keyed by record `updatedAt`.
- **Custom fields on built-in types** (DB-10) use the same `properties` list on the built-in database, with values stored in an `extra` map on the typed entity: `extra: z.record(z.string(), z.unknown()).default({})`.

## Inbox and attachments

```ts
export const inboxItemSchema = z.object({
  ...baseFields,
  kind: z.enum(["text", "link", "image", "file", "audio", "email", "clip"]),
  text: z.string().default(""),
  url: z.string().nullable().default(null),
  attachmentIds: z.array(z.string()).default([]),
  source: z.enum(["app", "share", "telegram", "email", "clipper", "voice", "import"]),
  status: z.enum(["new", "processed", "archived"]).default("new"),
  /** Where it went when processed (task, page, record…). */
  processedTo: entityRefSchema.nullable().default(null),
});

export const attachmentSchema = z.object({
  ...baseFields,
  name: z.string(),
  mime: z.string(),
  size: z.number().int(),
  sha256: z.string(),          // dedupe and integrity
  /** Where the bytes are: OPFS on this device, and/or remote encrypted blob. */
  local: z.boolean(),
  remoteKey: z.string().nullable().default(null),
  width: z.number().nullable().default(null), height: z.number().nullable().default(null),
  /** OCR or transcript text, indexed for search. */
  extractedText: z.string().default(""),
});
```

Bytes live in OPFS under `attachments/<sha256>`, not in SQLite.

## Settings additions

```ts
features: z.record(z.string(), z.boolean()).default({}),   // featureId → enabled; missing = registry default
privacy: z.object({
  aiAllowedAreas: z.array(z.string()).default([]),
  aiAllowedModules: z.array(z.string()).default([]),
}),
units: z.enum(["metric", "imperial"]).default("metric"),
currency: z.object({ primary: z.string().default("IRT"), showPersianDigits: z.boolean().default(false) }),
finance: z.object({ monthStartDay: z.number().int().min(1).max(31).default(1) }),
gamification: z.object({ xpMode: z.enum(["task", "minute", "area_weight"]).default("minute") }),
focus: z.object({ focusMinutes: 25, shortBreak: 5, longBreak: 15, longBreakEvery: 4, autoStart: false }),
```

## Planning extensions

```ts
// Task additions
energy: z.enum(["deep", "shallow", "admin"]).nullable().default(null),
context: z.array(z.string()).default([]),            // @home, @laptop
someday: z.boolean().default(false),
waitingOn: z.object({ personId: z.string().nullable(), followUp: dateKey.nullable() }).nullable().default(null),

// Habit additions (PE-40…PE-46)
kind: z.enum(["build", "avoid"]).default("build"),
target: z.object({ amount: z.number().positive(), unit: z.string() }).nullable().default(null),
frequency: z.discriminatedUnion("type", [
  z.object({ type: z.literal("weekdays"), weekdays: z.array(weekday).min(1) }),   // existing behaviour
  z.object({ type: z.literal("per_period"), times: z.number().int().min(1), period: z.enum(["week", "month"]) }),
]),
timeOfDay: z.enum(["morning", "afternoon", "evening", "any"]).default("any"),

// HabitEntry additions
amount: z.number().nullable().default(null),
skipped: z.boolean().default(false),
note: z.string().default(""),

// Goal additions
kind: z.enum(["goal", "challenge", "key_result"]).default("goal"),
parentGoalId: z.string().nullable().default(null),   // hierarchy and OKRs
startDate: dateKey.nullable().default(null),         // challenges: explicit period
```

**Challenges reuse goals.** A challenge (LM-CHL-01) is a `Goal` with `kind: "challenge"`, a start and end date, and `GoalProgress` entries; automatic progress reuses the goal tracking filters. This avoids a parallel progress system.

**XP is derived.** XP and levels (PE-50) are computed from completed blocks, time entries, habit entries, reviews and module logs by `lib/gamification/xp.ts`, using the selected XP mode. Changing the mode recomputes history; nothing is stored.

## Life modules

Typed collections per module ([ADR-0004](adr/0004-typed-modules-over-generic-records.md)). All include `baseFields` and `extra` for custom properties.

### Journal (`JRN`)

```ts
checkIn: {            // many per day allowed; the daily summary uses the latest or the average
  date: dateKey, at: isoDateTime,
  mood: z.number().int().min(1).max(5).nullable(),
  emotions: z.array(z.string()), activities: z.array(z.string()),
  energy: z.number().int().min(1).max(5).nullable(),
  stress: z.number().int().min(1).max(5).nullable(),
  note: z.string(),
}
dayRating: { date: dateKey, rating: z.number().int().min(1).max(5) }   // one per date
```

Migration: `Review.energy` moves into a `checkIn` for that date; the review form reads and writes the check-in.

### Library and learning (`LIB`, `LRN`)

```ts
libraryItem: { type, status, title, creator, coverAttachmentId, totalPages, totalMinutes,
               startedOn, finishedOn, rating, isbn, url, tags }
readingSession: { itemId, date, pages, minutes }       // feeds "pages" goals
highlight: { itemId, text, note, location, color, remember: boolean }
roadmap: { title, areaId }
roadmapNode: { roadmapId, title, status: "todo"|"learning"|"done", prerequisites: string[], order, resources: entityRef[] }
flashcard: { deckId, front, back, cloze: boolean, source: entityRef | null,
             // FSRS card state (ts-fsrs Card): due, stability, difficulty, elapsedDays, scheduledDays, reps, lapses, state, lastReview
             fsrs: fsrsCardSchema }
flashcardReview: { cardId, rating: 1|2|3|4, reviewedAt, elapsedDays, scheduledDays }   // review log, for re-optimising FSRS parameters
```

### Health and nutrition (`HLT`, `NUT`)

```ts
sleepLog: { date /* wake date */, bedAt: isoDateTime, wakeAt: isoDateTime, quality: 1..5 | null, naps: number }
workout: { date, type, durationMinutes, rpe: 1..10 | null, exercises: [{ name, sets: [{ reps, weightKg, durationSec }] }], note }
bodyMeasurement: { date, weightKg, bodyFatPct, musclePct, waistCm, chestCm, hipsCm, armCm, thighCm, neckCm,
                   custom: Record<string, number>, photoAttachmentIds: string[] }   // all optional except date
waterLog: { date, ml }
medication: { name, dose, schedule: recurrence, active }      medicationLog: { medicationId, date, at, taken }
food: { name, nameFa, kcal, proteinG, carbsG, fatG, per: { amount, unit: "g"|"ml"|"serving" }, starter: boolean }
foodLog: { date, meal: "breakfast"|"lunch"|"dinner"|"snack", foodId, quantity,
           // snapshot so editing a food later doesn't rewrite history:
           kcal, proteinG, carbsG, fatG }
```

Weight entries stay in `bodyMeasurement` so one collection drives the weight chart and body chart.

### Cycle (`CYC`)

```ts
cycleDay: { date, flow: "none"|"spotting"|"light"|"medium"|"heavy", symptoms: string[], note }
```

Cycles and predictions are derived in `lib/cycle/` from period-start days (first day with flow after at least N days of none). Privacy class `sensitive`.

### Finance (`FIN`)

```ts
account: { name, type: "cash"|"bank"|"card"|"savings"|"wallet"|"investment", currency, openingBalance: Money, archived }
category: { name, kind: "income"|"expense", parentId, icon, color }
transaction: { date, accountId, amount: Money /* signed: income +, expense − */, categoryId, payee, note, tags,
               splits: [{ categoryId, amount }],         // optional
               transferId: string | null,               // both legs share it
               loanId: string | null, installmentPlanId: string | null,
               importHash: string | null }               // duplicate detection for SMS/CSV imports
budget: { periodStart: dateKey /* financial month start */, categoryId, amount: Money, rollover: boolean }
exchangeRate: { date, from, to, rate }
loan: { direction: "lent"|"borrowed", personId, personName, principal: Money, date, dueDate, note, closedAt }
installmentPlan: { title, total: Money, count, amountPer: Money, firstDue: dateKey, interval: "month"|"week",
                   accountId, categoryId, loanId: string | null }
recurringTransaction: { template: transaction fields, recurrence }
```

- **Balances are derived**: opening balance + sum of transactions.
- **Loan balance** = principal − repayments (transactions with that `loanId`).
- **Installments**: the schedule (due dates and amounts) is derived from the plan; a payment is a transaction with `installmentPlanId`; "paid" means a matching transaction exists for that due date. Reminders come from the derived schedule.
- **Financial month** boundaries come from `lib/date` (Shamsi or Gregorian) shifted by `settings.finance.monthStartDay`.

### People (`PPL`)

```ts
person: { name, photoAttachmentId, relationship, howWeMet, birthday: { date: dateKey, calendar: "gregorian"|"jalali", yearKnown: boolean } | null,
          contact: { phone, email, telegram, ... }, reachOutEveryDays: number | null, tags, pageId }
interaction: { personId, date, kind: "call"|"meeting"|"message"|"other", note }
```

"Last contact" is derived from interactions and from daily notes that mention the person. Birthdays stored with their calendar recur on the right Shamsi or Gregorian date.

### Other modules

Startup, Career, Home, Travel, Recipes and Ideas start as **built-in database templates** (a generic `database` + `record` with predefined properties and views) rather than typed collections, because they need no special calculations. They can be promoted to typed collections later if they grow logic.

## Money

```ts
export const moneySchema = z.object({
  /** Integer amount in the currency's smallest unit. */
  amount: z.number().int(),
  /** ISO 4217 code, plus "IRT" for toman (0 decimals, = 10 IRR). */
  currency: z.string().length(3),
});
```

Never store money as floating point. `lib/money/` handles formatting (Persian digits, thousands separators, "هزار تومان" style), conversion and sums per currency.
