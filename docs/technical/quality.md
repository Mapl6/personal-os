# Quality

_Testing, performance budgets, accessibility, and Persian/RTL support_

## Testing

The existing setup stays: Vitest + Testing Library for unit and component tests, Playwright for end-to-end flows on desktop and mobile, `fake-indexeddb` for persistence tests.

| Layer | What to test | Tool |
| --- | --- | --- |
| `lib/` pure logic | Every calculation, parser and normaliser, including Shamsi edge cases (month lengths, leap years, Nowruz boundaries) | Vitest |
| Services | Business rules and proposals, with an injected `now()` and the in-memory store | Vitest |
| `DataStore` contract | One shared suite run against memory, IndexedDB and SQLite implementations | Vitest |
| Migrations | Each migration against a fixture from the previous version, plus old backup files | Vitest |
| Sync merge | Property-based tests: random concurrent edits on N simulated devices, delivered in random orders, must converge to the same state | Vitest + `fast-check` |
| Formula language | Parser and evaluator with fixtures and fuzzing | Vitest + `fast-check` |
| Editor | Wrapper behaviour (save, derived data, custom inline content) in jsdom where possible; the rest in Playwright | Vitest, Playwright |
| Flows | Main path per feature, offline mode (`context.setOffline(true)`), mobile viewport, Shamsi + Persian, feature toggle on/off | Playwright |
| AI | Tool wiring against a mocked model; eval set against real models before changing defaults | Vitest, eval script |

Fixtures: extend `services/seed.ts` into a deterministic **large seed** (10k pages, 50k records, 2 years of tasks, check-ins and transactions) used by performance tests.

## Performance budgets

Measured on a mid-range laptop and a mid-range Android phone, with the large seed:

| Interaction | Budget |
| --- | --- |
| Cold start to interactive Today | < 1.5 s laptop, < 2.5 s phone |
| `⌘K` search results | < 100 ms |
| Open a page | < 200 ms to editable |
| Typing latency in a 5,000-block page | < 50 ms |
| Database view (50k records) filter, sort or group | < 200 ms |
| Drag a block on the timeline | 60 fps |
| Capture save | < 100 ms, offline included |
| JS on the Today route | Editor, charts and module code not loaded until needed |

Techniques: virtualised lists and tables (TanStack Virtual), all heavy queries in the data worker, lazy routes and `next/dynamic` for the editor, charts and canvas, background indexing when idle (`requestIdleCallback`, `scheduler.postTask`).

## Accessibility

Target WCAG 2.2 AA, as the current UI does:

- Everything works with the keyboard, including drag and drop (dnd-kit keyboard sensors), the editor, database views and canvas.
- Visible focus states; correct roles and labels; live regions for timers, toasts and saved states.
- Colour is never the only signal (mood colours also have faces or labels; charts have patterns or labels).
- `prefers-reduced-motion` respected; no flashing celebrations.
- Both themes meet contrast ratios; checked with axe in Playwright.

## Persian, RTL and Shamsi

Rules for every new feature:

- Use logical CSS (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) instead of left/right, so the layout mirrors when the UI is Persian.
- User text gets `dir="auto"`; numbers, dates and money use the formatting helpers (Persian digits when chosen).
- Icons that imply direction (arrows, chevrons) flip in RTL; icons that don't (play, checkmarks) don't.
- All dates go through `lib/date`: Shamsi months for "this month", Shamsi pickers, Shamsi-aware recurrence and birthdays.
- Every Playwright flow for a new feature has a Shamsi + Persian variant for its main path.
- Fonts: Vazirmatn for Persian text, loaded with `next/font`, subset to the characters needed.
