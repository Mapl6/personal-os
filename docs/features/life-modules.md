# Life modules

_Prefix `LM-<MODULE>` · Technical design: [modules and feature flags](../technical/modules-and-feature-flags.md), [data model](../technical/data-model.md#life-modules), [ADR-0004](../technical/adr/0004-typed-modules-over-generic-records.md)_

Each module is a set of typed records, page templates, a dashboard widget, review prompts and optional analytics. Every module:

- can be **turned on or off in Settings → Features**; turning it off hides it everywhere and keeps its data;
- appears as a **built-in database**, so its records get table, board, calendar and chart views, custom properties and linked views;
- **links** to areas, goals, tasks, people and the daily note, so a workout counts toward a Health goal and a book shows up in the weekly review;
- has a **privacy class** (normal, private or sensitive) that controls app-lock and AI access.

| Module | Code | Default | Privacy | Phase |
| --- | --- | --- | --- | --- |
| Journal and check-in | `JRN` | On | Private | 1–2 |
| Library (books, podcasts, films, articles) | `LIB` | On | Normal | 2 |
| Learning | `LRN` | On | Normal | 2 |
| Challenges | `CHL` | On | Normal | 2 |
| Health and fitness | `HLT` | Off | Private | 3 |
| Nutrition | `NUT` | Off | Private | 3 |
| Cycle tracking | `CYC` | Off | Sensitive | 3 |
| Finance | `FIN` | Off | Sensitive | 3 |
| People (personal CRM) | `PPL` | Off | Private | 3 |
| Startup and work | `STU` | Off | Normal | 3 |
| Career | `CAR` | Off | Normal | 3 |
| Home and life admin | `HOM` | Off | Normal | 3 |
| Travel | `TRV` | Off | Normal | 3 |
| Recipes and meals | `RCP` | Off | Normal | 3 |
| Ideas and wishlist | `IDE` | Off | Normal | 3 |

Defaults are what a new install gets; onboarding presets can change them (see [PL-06](platform.md#feature-toggles)).

## Journal and daily check-in (`JRN`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-JRN-01 | Mood log | Log mood in two taps (5-point scale with faces) as often as you like; optional emotions (multi-select: calm, anxious, grateful…) and activities/tags | P0 | 1 | ⬜ |
| LM-JRN-02 | Day rating | 1–5 star rating of the day, asked in the evening shutdown and daily review | P0 | 1 | ⬜ |
| LM-JRN-03 | Energy and stress | Energy (already in daily review) and optional stress, 1–5 | P1 | 1 | 🟡 Energy exists |
| LM-JRN-04 | Mood calendar | Month grid and year-in-pixels coloured by mood or day rating, Shamsi-aware | P0 | 2 | ⬜ |
| LM-JRN-05 | Mood and energy charts | Trends, averages by weekday, and correlations (RV-20) | P1 | 2 | ⬜ |
| LM-JRN-06 | Journal entries | Free writing in the daily note or separate entries with prompts (rotating, editable prompt lists), gratitude list (3 things), wins of the day | P0 | 2 | ⬜ |
| LM-JRN-07 | Brain dump | A dedicated page (and widget) for dumping thoughts; each line can be sent to the inbox, a task or a note | P0 | 1 | ⬜ |
| LM-JRN-08 | Month summary | A monthly journal entry pre-filled with the month's highlights, mood average and best days | P1 | 2 | ⬜ |
| LM-JRN-09 | On this day | Entries from the same Shamsi or Gregorian date in earlier years | P2 | 2 | ⬜ |
| LM-JRN-10 | Private lock | Journal can require the app-lock PIN or biometrics even when the app is unlocked | P1 | 4 | ⬜ |

## Library: books, podcasts, films, articles (`LIB`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-LIB-01 | Library database | Items with type (book, audiobook, podcast, film, series, article, course, game), status (want, in progress, done, dropped), rating, author/creator, cover, dates, tags | P0 | 2 | ⬜ |
| LM-LIB-02 | Reading progress | Pages or percent progress, reading sessions (pages and minutes), pages-per-day, estimated finish date; feeds the "pages" goal metric automatically | P0 | 2 | ⬜ |
| LM-LIB-03 | Reading board | Board by status, gallery of covers, yearly shelf | P0 | 2 | ⬜ |
| LM-LIB-04 | Book lookup | Fill title, author, cover and page count from ISBN or search (Open Library); Persian books by manual entry or barcode | P1 | 2 | ⬜ |
| LM-LIB-05 | Highlights and quotes | Highlights per item with page/location; quotes collection; daily highlight review (LM-LRN-12) | P1 | 2 | ⬜ |
| LM-LIB-06 | Notes page per item | Book notes template (summary, key ideas, quotes, actions) | P0 | 2 | ⬜ |
| LM-LIB-07 | Yearly reading challenge | "24 books in 1405" via Challenges or a goal | P1 | 2 | ⬜ |
| LM-LIB-08 | Kindle / Readwise import | Import highlights (Phase 4 integrations) | P2 | 4 | ⬜ |

## Learning (`LRN`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-LRN-01 | Learning roadmap | A skill tree / roadmap per subject (e.g. JavaScript → TypeScript → React → Next.js → AI SDK) with nodes, prerequisites and status | P0 | 2 | ⬜ |
| LM-LRN-02 | Resources per node | Link courses, books, articles and notes to each node | P0 | 2 | ⬜ |
| LM-LRN-03 | Study sessions | Time tracked against a node or course counts toward learning goals and area hours | P0 | 2 | 🟡 Time tracking exists |
| LM-LRN-04 | Courses | Courses with lessons as checklist, progress percent, certificate link | P1 | 2 | ⬜ |
| LM-LRN-05 | Roadmap templates | Starter roadmaps (frontend, AI engineering) importable as JSON | P2 | 3 | ⬜ |
| LM-LRN-10 | Flashcards | Front/back and cloze cards; cards can be created from any block (`::` or "Make flashcard") and keep a link to their source | P0 | 2 | ⬜ |
| LM-LRN-11 | Spaced repetition | FSRS scheduling (ts-fsrs), daily review queue with again/hard/good/easy, limits per day, decks per subject | P0 | 2 | ⬜ |
| LM-LRN-12 | Highlight and note resurfacing | Daily review mixes due flashcards with highlights and notes marked "remember" | P1 | 2 | ⬜ |
| LM-LRN-13 | Anki import/export | `.apkg` or CSV import and export | P2 | 4 | ⬜ |

## Challenges (`CHL`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-CHL-01 | Time-boxed challenges | A challenge has a title, unit, numeric target, start and end (default: this Shamsi or Gregorian month), and optional link to an area or habit | P0 | 2 | ⬜ |
| LM-CHL-02 | Daily progress entries | Log amounts per day or let progress come automatically (from habits, workouts, pages read, focus hours) | P0 | 2 | ⬜ |
| LM-CHL-03 | Progress and pace | Progress bar, "on pace / behind by N" calculation, calendar of logged days | P0 | 2 | ⬜ |
| LM-CHL-04 | Results | End-of-period result card, saved to the monthly review; option to repeat next month | P1 | 2 | ⬜ |
| LM-CHL-05 | Challenge templates | "30 days of yoga", "no-spend week", "read 300 pages" | P2 | 3 | ⬜ |

## Health and fitness (`HLT`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-HLT-01 | Sleep log | Bedtime, wake time, duration, quality 1–5, naps; sleep vs energy and mood charts; average and consistency | P0 | 3 | ⬜ |
| LM-HLT-02 | Workout logger | Workouts with type (strength, cardio, yoga, sport…), duration, intensity (RPE), exercises with sets, reps and weight; personal records; routines to start from | P0 | 3 | ⬜ |
| LM-HLT-03 | Weight tracking | Weight entries with trend line (moving average), target weight, rate of change | P0 | 3 | ⬜ |
| LM-HLT-04 | Body measurements | Waist, chest, hips, arms, thighs, neck, body fat %, muscle %, and custom measurements; progress photos (private) | P0 | 3 | ⬜ |
| LM-HLT-05 | Water | Glasses or ml per day toward a target, quick +1 widget | P1 | 3 | ⬜ |
| LM-HLT-06 | Steps and activity | Manual entry now; Apple Health / Google Fit / Health Connect later | P2 | 4 | ⬜ |
| LM-HLT-07 | Medications and supplements | Schedule, reminders, taken/missed log | P1 | 3 | ⬜ |
| LM-HLT-08 | Symptoms | Symptom log with severity, linked to mood and cycle | P2 | 3 | ⬜ |
| LM-HLT-09 | Health dashboard | Key numbers, trends and streaks; links to Health area goals | P1 | 3 | ⬜ |
| LM-HLT-10 | Units | Metric or imperial per setting; stored in metric | P0 | 3 | ⬜ |

## Nutrition (`NUT`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-NUT-01 | Calorie counter | Log foods per meal (breakfast, lunch, dinner, snacks) with quantity; daily calorie target and remaining | P0 | 3 | ⬜ |
| LM-NUT-02 | Food library | Saved foods with calories and macros per serving or 100 g; a starter list of common Iranian foods (نان سنگک، برنج، خورش قورمه‌سبزی…) | P0 | 3 | ⬜ |
| LM-NUT-03 | Macros | Protein, carbs, fat (and optional fibre, sugar) with targets | P1 | 3 | ⬜ |
| LM-NUT-04 | Calorie history | Daily/weekly charts, average intake, intake vs weight trend | P0 | 3 | ⬜ |
| LM-NUT-05 | Quick log | Recent and frequent foods, copy yesterday's meal, saved meals | P1 | 3 | ⬜ |
| LM-NUT-06 | Target calculator | Suggest a target from weight, height, age, activity and goal (Mifflin-St Jeor), clearly marked as an estimate | P2 | 3 | ⬜ |
| LM-NUT-07 | Photo and voice logging | Describe or photograph a meal; AI proposes entries for confirmation (AI-31) | P2 | 5 | ⬜ |

## Cycle tracking (`CYC`)

Off by default; enabling it asks for confirmation and explains where the data is stored.

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-CYC-01 | Period log | Start and end dates, flow level per day | P0 | 3 | ⬜ |
| LM-CYC-02 | Cycle calendar | Calendar showing logged periods, predicted next period and fertile window (clearly labelled as estimates, not contraception) | P0 | 3 | ⬜ |
| LM-CYC-03 | Symptoms and notes | Cramps, headache, mood, energy, discharge, notes; linked to the daily check-in | P1 | 3 | ⬜ |
| LM-CYC-04 | Cycle stats | Average cycle and period length, variation, history | P1 | 3 | ⬜ |
| LM-CYC-05 | Reminders | Optional "period may start soon" reminder with neutral wording | P2 | 3 | ⬜ |
| LM-CYC-06 | Extra protection | Sensitive privacy class: never sent to AI, excluded from shared pages and from sync unless explicitly allowed, optional separate lock | P0 | 3 | ⬜ |

## Finance (`FIN`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-FIN-01 | Accounts | Cash, bank, card, savings, digital wallet and investment accounts with currency and opening balance; archive accounts | P0 | 3 | ⬜ |
| LM-FIN-02 | Transactions | Income and expense with date, amount, account, category, payee, note, tags; split a transaction across categories | P0 | 3 | ⬜ |
| LM-FIN-03 | Transfers | Move money between accounts (one transfer, two linked entries); cross-currency transfers with rate | P0 | 3 | ⬜ |
| LM-FIN-04 | Categories | Custom income and expense categories with icons, sub-categories | P0 | 3 | ⬜ |
| LM-FIN-05 | Budgets | Monthly budget per category, budget vs actual, rollover of unspent amounts (envelope style optional) | P0 | 3 | ⬜ |
| LM-FIN-06 | Financial month | Custom start day of the financial month (e.g. salary on the 25th) and Shamsi or Gregorian months | P0 | 3 | ⬜ |
| LM-FIN-07 | Transaction history | Searchable, filterable list; edit and delete with undo | P0 | 3 | ⬜ |
| LM-FIN-08 | Reports | Spending by category, cash flow, income vs expense by month, net worth over time | P1 | 3 | ⬜ |
| LM-FIN-09 | Currencies | Toman, rial, dollar, euro and others; display in toman with Persian digits; manual exchange rates with history | P0 | 3 | ⬜ |
| LM-FIN-10 | Recurring transactions and subscriptions | Rent, salary, subscriptions with renewal reminders and yearly cost | P1 | 3 | ⬜ |
| LM-FIN-11 | Savings goals | Target amount and date, contributions, linked to Goals | P1 | 3 | ⬜ |
| LM-FIN-12 | Quick entry | Quick Add (`ناهار ۲۵۰ هزار تومان`, `coffee 3$`), a form view, and a home-screen shortcut | P0 | 3 | ⬜ |
| LM-FIN-13 | Loans | Money lent and borrowed, with person (People), amount, date, due date, repayments and remaining balance; reminders before due date | P0 | 3 | ⬜ |
| LM-FIN-14 | Installments | An installment plan (title, total, number of installments, amount, start, interval, account) generates scheduled payments; mark paid; remaining balance and next due shown; reminders | P0 | 3 | ⬜ |
| LM-FIN-15 | Bank SMS import | Paste or share Iranian bank SMS messages; a parser proposes transactions for confirmation | P1 | 3 | ⬜ |
| LM-FIN-16 | CSV / OFX import | Import bank exports with column mapping and duplicate detection | P1 | 3 | ⬜ |
| LM-FIN-17 | Reconciliation | Compare an account's balance with the real balance and record the difference | P2 | 3 | ⬜ |
| LM-FIN-18 | Investments | Holdings (gold, currency, stocks, crypto) with manual prices and value over time | P2 | 4 | ⬜ |

## People: personal CRM (`PPL`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-PPL-01 | People | Name, photo, relationship, how you met, contact info, tags, notes page | P0 | 3 | ⬜ |
| LM-PPL-02 | Interactions | Log calls, meetings and messages; mentions of a person in daily notes appear in their timeline automatically | P0 | 3 | ⬜ |
| LM-PPL-03 | Keep in touch | "Reach out every N weeks"; a due list on Today and in the weekly review | P0 | 3 | ⬜ |
| LM-PPL-04 | Birthdays and dates | Birthdays and anniversaries in Shamsi or Gregorian, with reminders and age | P0 | 3 | ⬜ |
| LM-PPL-05 | Gift ideas and notes | Per-person ideas list and important facts | P2 | 3 | ⬜ |
| LM-PPL-06 | Contact import | vCard / Google Contacts import | P2 | 4 | ⬜ |

## Startup and work (`STU`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-STU-01 | Idea inbox with scoring | Ideas scored on impact, confidence and ease (ICE), sorted; promote an idea to a project | P1 | 3 | ⬜ |
| LM-STU-02 | Experiment log | Hypothesis, metric, result, learning | P1 | 3 | ⬜ |
| LM-STU-03 | Decision records | Context, options, decision, consequences, review date | P1 | 3 | ⬜ |
| LM-STU-04 | Customers and interviews | Customer records and interview notes linked to People | P2 | 3 | ⬜ |
| LM-STU-05 | KPI tracking | Manual metrics over time with charts | P2 | 3 | ⬜ |

## Career (`CAR`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-CAR-01 | Job pipeline | Applications board (wishlist → applied → interview → offer → closed) with company, role, links, dates | P1 | 3 | ⬜ |
| LM-CAR-02 | Interview prep | Prep notes, questions, follow-ups linked to People | P2 | 3 | ⬜ |
| LM-CAR-03 | Portfolio and resume versions | Projects, achievements log ("brag document"), resume files per version | P2 | 3 | ⬜ |
| LM-CAR-04 | Skill gaps | Skills required vs current level, linked to the learning roadmap | P2 | 3 | ⬜ |

## Home and life admin (`HOM`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-HOM-01 | Recurring chores | Chores with frequency and "last done", shown when due | P1 | 3 | ⬜ |
| LM-HOM-02 | Document vault | Passport, ID, insurance, warranties with expiry reminders and encrypted attachments | P1 | 3 | ⬜ |
| LM-HOM-03 | Shopping lists | Lists by store, shared with Recipes | P1 | 3 | ⬜ |
| LM-HOM-04 | Inventory | Things you own, where they are, warranty and price | P2 | 3 | ⬜ |
| LM-HOM-05 | Vehicles and maintenance | Service history and reminders | P2 | 3 | ⬜ |

## Travel (`TRV`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-TRV-01 | Trips | Trip pages with dates, places, bookings and budget (linked to Finance) | P2 | 3 | ⬜ |
| LM-TRV-02 | Packing lists | Reusable packing templates | P2 | 3 | ⬜ |
| LM-TRV-03 | Itinerary | Day-by-day plan on the calendar | P2 | 3 | ⬜ |

## Recipes and meals (`RCP`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-RCP-01 | Recipes | Ingredients, steps, servings, time, photos, tags; nutrition from Nutrition foods | P2 | 3 | ⬜ |
| LM-RCP-02 | Meal plan | Weekly meal plan that generates a shopping list and can log to Nutrition | P2 | 3 | ⬜ |

## Ideas and wishlist (`IDE`)

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| LM-IDE-01 | Ideas | Future projects and ideas, reviewed monthly; promote to project | P1 | 3 | ⬜ |
| LM-IDE-02 | Wishlist | Things to buy with price and priority; links to savings goals | P2 | 3 | ⬜ |
| LM-IDE-03 | Bucket list | Life goals and experiences, with "done" date and photo | P2 | 3 | ⬜ |
