# ADR-0005: AI through client-executed tools that return proposals

_Status: Proposed · Date: 2026-10-02 · Applies from: Phase 5_

## Context

The AI needs to read the user's data and help change it (plan the week, process the inbox, log expenses from text). But data lives on the device (and only as ciphertext on the server), the app's rule is that bulk changes are proposed before they apply, and some data (cycle, finance, journal) must not reach a model unless the user explicitly allows it.

## Decision

1. **Model on the server, data on the client.** A Next.js route handler streams model responses with the AI SDK through AI Gateway (or the user's own key). Tools are declared on the server and **executed on the client** against the data worker.
2. **One privacy filter.** Every tool result passes through the data worker's privacy filter (privacy class, allowed areas, allowed modules) before leaving the device.
3. **Proposals only.** The only write tool is `propose_changes`, returning a `ChangeProposal` (the generalised `PlanChange`). The user reviews and applies it through the normal services, with undo.
4. **Numbers from the app's own functions.** Data questions use `query_database` and `get_analytics`, which call the same `lib/analytics` functions the UI uses, so answers match what the app shows.
5. **Transparency.** Each request's outgoing data is logged locally and viewable.

## Alternatives

| Option | Why not |
| --- | --- |
| Send a big context dump with every request | Leaks more data than needed, costly, and numbers computed by the model can be wrong |
| Run the agent on the server with database access | The server can't read end-to-end encrypted data, and it would break the privacy model |
| Let the AI write directly with undo | Breaks the "propose, then apply" principle the planner already uses |
| On-device model only | Not yet good enough for planning and Persian writing; kept as an option for private questions |

## Consequences

- Tool latency includes a client round-trip; acceptable for interactive use.
- The same tools power the MCP server in the desktop app.
- Prompt and tool changes are checked against an eval set before release.
