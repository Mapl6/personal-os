# AI layer

_Prefix `AI` · Technical design: [search and AI](../technical/search-and-ai.md), [ADR-0005](../technical/adr/0005-ai-proposals-and-privacy.md)_

AI is a thinking partner over your own data. It follows three rules everywhere:

1. **Propose, then apply.** The AI never changes data directly. It returns proposals (the same `PlanChange` flow used by rollover and templates, extended to all entities) that you confirm.
2. **Only what you allow.** It reads only areas and modules you have allowed; sensitive modules are never sent.
3. **Show the sources.** Answers cite the pages and records they came from.

The AI layer is switched off by default and can be turned on per feature in Settings → Features.

## Search and discovery

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| AI-01 | Semantic search | Find notes by meaning ("that idea about onboarding friction"), merged with keyword results; works in Persian and English | P0 | 5 | ⬜ |
| AI-02 | Related notes | While writing, a side panel suggests related pages and records | P1 | 5 | ⬜ |
| AI-03 | Link and tag suggestions | Suggest `[[links]]` and tags for the current page, accepted one by one | P1 | 5 | ⬜ |
| AI-04 | Duplicate detection | Notice near-duplicate notes and offer to merge | P2 | 5 | ⬜ |

## Ask your second brain

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| AI-10 | Chat over your data | Ask questions about notes, tasks, reviews, journal and module records; answers cite sources; follow-up questions keep context | P0 | 5 | ⬜ |
| AI-11 | Data questions | Questions answered by running real queries, not guessing: "How many hours on Frontend in Mehr?", "What did I spend on food last month?", "Which habits did I keep best?" | P0 | 5 | ⬜ |
| AI-12 | Page actions | Ask about the current page: summarise, explain, translate, find action items | P0 | 5 | ⬜ |
| AI-13 | Daily brief | Morning summary: today's plan, due items, people to contact, one resurfaced note | P1 | 5 | ⬜ |

## Planning assistant

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| AI-20 | Plan my week | Proposal built from goals, deadlines, energy patterns, time budgets and last week's actuals | P0 | 5 | ⬜ |
| AI-21 | Re-plan today | "I only have 4 hours today": re-prioritise and move the rest, as a proposal | P0 | 5 | ⬜ |
| AI-22 | Break down a task | Split a big task into subtasks with estimates | P1 | 5 | ⬜ |
| AI-23 | Goal coach | For a goal: what's blocking it, what pace is needed, suggested next actions | P2 | 5 | ⬜ |

## Writing and learning

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| AI-30 | Summaries | Summarise a long note, article, meeting, book highlights or a week of journal entries | P0 | 5 | ⬜ |
| AI-31 | Structured extraction | Turn text, voice transcripts, receipts or meal descriptions into proposed tasks, expenses, food logs or records | P1 | 5 | ⬜ |
| AI-32 | Flashcard generation | Generate cards from a note or highlights, reviewed before saving | P1 | 5 | ⬜ |
| AI-33 | Review drafts | Draft the weekly or monthly review from the period's data, for you to edit | P1 | 5 | ⬜ |
| AI-34 | Monthly letter | "Letter to yourself": what went well, patterns, suggestions, based on insights (RV-20) | P2 | 5 | ⬜ |
| AI-35 | Translate | Persian ↔ English inside notes, keeping formatting | P1 | 5 | ⬜ |
| AI-36 | Writing help | Continue, rewrite, shorten, fix grammar, change tone, on a selection | P2 | 5 | ⬜ |
| AI-37 | Journaling prompts | Prompts adapted to recent entries and mood | P2 | 5 | ⬜ |

## Agents and external access

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| AI-40 | MCP server | A local MCP server so assistants like Claude Code or Claude Desktop can search and read your data, and propose changes that you confirm in the app | P1 | 5 | ⬜ |
| AI-41 | Scheduled AI jobs | E.g. every Sunday draft the weekly review; every night tag the inbox (proposals waiting in the morning) | P2 | 5 | ⬜ |
| AI-42 | Database AI autofill | See DB-45 | P2 | 5 | ⬜ |

## Privacy and control

| ID | Feature | Details | Priority | Phase | Status |
| --- | --- | --- | --- | --- | --- |
| AI-50 | Per-area and per-module permissions | Choose what AI may read; sensitive modules (cycle, finance by default) are always excluded unless explicitly allowed | P0 | 5 | ⬜ |
| AI-51 | Request preview and log | See exactly what was sent for each request; a history of AI requests | P0 | 5 | ⬜ |
| AI-52 | Provider and model choice | Bring your own API key or use the hosted gateway; model is a setting | P1 | 5 | ⬜ |
| AI-53 | On-device options | Embeddings always on device; small on-device chat model later (WebGPU) for private questions | P1 | 5 | ⬜ |
| AI-54 | Usage limits | Monthly budget and per-request token cap, visible usage | P1 | 5 | ⬜ |
| AI-55 | No training | Use providers and settings that do not train on your data; state this in the UI | P0 | 5 | ⬜ |
