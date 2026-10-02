# ADR-0004: Typed module schemas, exposed as built-in databases

_Status: Proposed · Date: 2026-10-02 · Applies from: Phase 2_

## Context

There are two ways to build life modules:

1. **Generic:** every module is just a custom database (records with a property map), like Notion templates.
2. **Typed:** every module has its own Zod schema, service and pure logic, like tasks and goals today.

Generic is fast to build and fully customisable, but logic-heavy modules (finance balances, installments, loans, FSRS scheduling, cycle predictions, calorie totals, sleep durations) become fragile when their fields are user-editable properties that can be renamed, deleted or retyped. Typed modules are robust but would each need their own table, board and calendar UI.

## Decision

- Modules with real logic use **typed collections** with Zod schemas, services and pure functions in `lib/`: Journal check-ins, Library and reading sessions, Learning and flashcards, Health, Nutrition, Cycle, Finance, People.
- Each typed collection is exposed to the view engine as a **built-in database** through an adapter (`toRecord`, `applyEdit`, property definitions, default views), so it gets table, board, calendar, gallery and chart views, linked views, filters, and **custom properties** stored in an `extra` field.
- Modules without special logic (Startup, Career, Home, Travel, Recipes, Ideas) ship as **database templates** on the generic engine and can be promoted to typed collections later.
- **Challenges reuse goals** (`Goal.kind = "challenge"`) instead of a new collection.

## Consequences

- Business rules stay in services; edits made in a table view go through `applyEdit`, which returns changes the service validates.
- One view engine to build and optimise.
- Users can still extend modules with their own properties without breaking calculations.
- Promoting a template module to a typed one needs a data migration from records to the typed collection.
