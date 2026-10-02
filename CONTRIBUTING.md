# Contributing to Personal OS

Thanks for helping. Personal OS is a calm, local-first planner growing into a second brain, and contributions of every size are welcome: bug reports, docs fixes, Persian translations, tests and features.

> **فارسی:** مشارکت به فارسی هم خوش‌آمد است. می‌توانید issue یا discussion را به فارسی بنویسید.

## Ways to help

- **Try it and report bugs.** Use the [live demo](https://personal-os-nine-lime.vercel.app/?demo=1) and open an issue with steps to reproduce, your browser and whether you use the Shamsi calendar.
- **Pick a starter issue.** Issues labelled [good first issue](https://github.com/Mapl6/personal-os/labels/good%20first%20issue) are small, well-described and come from the [development plan](docs/DEVELOPMENT_PLAN.md).
- **Discuss ideas** in [Discussions](https://github.com/Mapl6/personal-os/discussions) before starting anything large, so we can agree on the approach first.
- **Improve Persian support.** Shamsi dates, Persian Quick Add and right-to-left layouts are core to the project; native speakers catch what tests can't.

## Getting started

Requires **Node.js 22.22+ or 24.15+**.

```bash
git clone https://github.com/Mapl6/personal-os.git
cd personal-os
npm install
npm run dev
```

Open <http://localhost:3000> and click **Try the demo** to get example data.

## Where things are

| You want to… | Read |
| --- | --- |
| Understand the code layout | [README → Architecture](README.md#-architecture) and [docs/technical/architecture.md](docs/technical/architecture.md) |
| See what's planned and in what order | [docs/ROADMAP.md](docs/ROADMAP.md), [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md), or the live [/roadmap](https://personal-os-nine-lime.vercel.app/roadmap) |
| Find the spec for a feature | [docs/features/](docs/features/README.md) (every feature has an ID such as `KN-20`) |
| Build a feature | The [adding a feature checklist](docs/technical/README.md#adding-a-feature) |

This project uses **Next.js 16**, which differs from older versions. Check the docs bundled in `node_modules/next/dist/docs/` before relying on memory (see [AGENTS.md](AGENTS.md)).

## How we write code

- **Business logic lives in pure functions** in `src/lib/` with unit tests; services in `src/services/` use them; components stay thin.
- **Plans are hypotheses.** Moving or skipping work is never shown as failure, and bulk changes are proposed for the user to confirm before they apply.
- **Dates** are stored as Gregorian `yyyy-MM-dd` keys; use `src/lib/date` for display and for "this week/month" so the Shamsi calendar keeps working.
- **Right-to-left ready:** use logical Tailwind classes (`ms-*`, `pe-*`, `text-start`) instead of left/right.
- **Accessible:** everything works with the keyboard, has labels, and respects reduced motion.
- Match the style of the code around you.

## Pull requests

1. Fork the repo and create a branch from `main` (e.g. `inbox-page` or `fix-reschedule-dialog`).
2. Keep the PR focused on one thing; mention the feature ID or issue it addresses.
3. Add or update tests: unit tests for logic, a Playwright flow for user-facing changes.
4. Run everything before pushing:

   ```bash
   npm run typecheck && npm run lint && npm test && npm run test:e2e
   ```

5. Describe what changed and how you tested it; include a screenshot or GIF for UI changes.

If you change what the app can do, update the feature's status in `docs/features/`, and the public roadmap page will pick it up on the next deploy.

## Code of conduct

Be kind and assume good intent. Harassment or discrimination of any kind isn't tolerated.
