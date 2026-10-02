# Modules and feature flags

_See also [features: platform → feature toggles](../features/platform.md#feature-toggles), [ADR-0004](adr/0004-typed-modules-over-generic-records.md)_

Every module and optional feature is described once in a registry. The app shell, Settings → Features, the dashboard, reviews, analytics, notifications, Quick Add and the Command Center all read from it. Turning a feature off hides it everywhere and keeps its data.

## What exists today

`settings.customization.hiddenNav` hides sidebar items and `dashboardWidgets` toggles widgets. Both are kept and become per-user overrides on top of the registry: a feature can be on but its nav item hidden.

## Feature definition

```ts
// src/modules/types.ts
export interface FeatureDefinition {
  id: FeatureId;                         // "finance", "pomodoro", "xp", "ai.semantic_search"…
  label: string;                         // translated via i18n key
  description: string;
  group: "knowledge" | "planning" | "modules" | "capture" | "ai" | "integrations";
  core?: boolean;                        // can't be turned off (tasks, today, calendar, inbox, settings)
  defaultEnabled: boolean;
  dependsOn?: FeatureId[];               // turning this on turns these on; turning those off warns
  privacy: "normal" | "private" | "sensitive";
  confirmOnEnable?: string;              // e.g. cycle tracking explains where data is stored

  // What the feature contributes. All optional.
  collections?: CollectionName[];        // for export, delete-module-data and storage stats
  routes?: { href: string; label: string; icon: LucideIcon; shortcut?: string }[];
  widgets?: WidgetDefinition[];          // dashboard and Today
  reviewPrompts?: ReviewPromptDefinition[];   // e.g. "How was your sleep this week?" with data
  analytics?: AnalyticsSectionDefinition[];
  notifications?: NotificationDefinition[];
  quickAdd?: QuickAddGrammar[];          // e.g. expense syntax "ناهار ۲۵۰ هزار تومان"
  commands?: CommandDefinition[];        // Command Center actions
  builtInDatabases?: BuiltInDatabaseDefinition[];   // see ADR-0004
  dailyNoteSections?: DailyNoteSectionDefinition[];
  insightsSeries?: SeriesDefinition[];   // daily numbers offered to correlations (RV-20)
  aiTools?: AiToolDefinition[];          // read tools exposed to the AI, filtered by privacy
}
```

```ts
// src/modules/registry.ts
export const FEATURES: FeatureDefinition[] = [tasks, today, calendar, inbox, pages, journal, library, learning,
  challenges, health, nutrition, cycle, finance, people, /* … */ pomodoro, xp, streakCounter, insights, ai];
```

Each module lives in its own folder (`src/modules/finance/index.ts` exporting its definition), so adding a module means adding a folder and one line in the registry.

## Reading flags

```ts
export function useFeature(id: FeatureId): boolean          // reactive, from settings + registry defaults
export function isFeatureEnabled(settings: Settings, id: FeatureId): boolean   // pure, for services and tests
export function enabledFeatures(settings: Settings): FeatureDefinition[]
```

`isFeatureEnabled` resolves: explicit setting → registry default → `false` for unknown IDs. A feature whose dependency is off is treated as off.

## What "off" means

| Surface | Behaviour when off |
| --- | --- |
| Sidebar, bottom nav | Item not shown |
| Route | Renders a "This feature is turned off" screen with a switch to turn it on (no 404, so bookmarks keep working) |
| Dashboard and Today widgets | Not rendered; widget order preserved for when it's back |
| Reviews | Its prompts and data panels are skipped |
| Analytics and insights | Its sections and series are hidden |
| Notifications | Its reminders are not scheduled |
| Quick Add and Command Center | Its grammar and commands are not registered |
| Mentions and search | Its records are hidden from results; existing links render as a muted chip "(Finance is off)" |
| AI | Its tools are not offered |
| Data | Untouched; included in export; still synced (unless local-only) |

## Settings → Features UI

- Grouped list with a switch, description and privacy badge per feature.
- Turning on a feature with dependencies shows "This also turns on: …".
- Turning off a feature others depend on lists them and asks for confirmation.
- Sensitive features show `confirmOnEnable` text first.
- "Delete this module's data" sits under an expandable "Danger zone" per module, exports first, and uses the `collections` list.
- Presets (PL-06) are just maps of feature ID → enabled, applied as a proposal you confirm.

## Built-in databases

A module exposes its typed collection to the view engine with an adapter:

```ts
export interface BuiltInDatabaseDefinition {
  id: string;                               // "finance.transactions"
  collection: CollectionName;
  properties: PropertyDefinition[];         // how typed fields appear as properties (read-only or editable)
  toRecord(entity: unknown): RecordView;    // typed entity → generic values map (+ extra fields)
  applyEdit(entity: unknown, propertyId: string, value: unknown): Change[];   // edits go through the module's service rules
  defaultViews: ViewDefinition[];
}
```

So a transactions table, a books board and a workouts calendar share one view engine, while each module keeps its own validation and calculations (see [ADR-0004](adr/0004-typed-modules-over-generic-records.md)).

## Testing a module

- Registry test: every feature has a unique ID, valid dependencies (no cycles), and every collection it lists exists in the `DataStore`.
- Toggle test (Playwright, once per module): turn it on, create a record, turn it off, check nav, widgets, search and Command Center no longer show it, turn it on again and the record is still there.
