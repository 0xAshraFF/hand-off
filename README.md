# Handoff

Handoff turns a plain-language project goal into a practical execution route:

**goal → budget/resources → verified candidates → task-level routing → concise human plan → agent handoff**

The product is deliberately provider-neutral. A plan can mix Chinese models, Western frontier models, open-source/local tools, SaaS subscriptions, and free tiers when that produces the best outcome for the user's budget.

## Current V2

- Dark, task-first home experience
- Explore page with compact categories/sections/styles and a command-palette-style filter
- Budget, quantity, priority, and owned-subscription inputs
- Provider-neutral catalog with source URLs and verification timestamps
- Deterministic budget router that works with no AI API key
- Optional planner-model refinement through an OpenAI-compatible API
- Human-readable plan: **Prepare → Make → Check → Publish**
- Per-step lower-cost / higher-quality alternatives
- Agent-ready Markdown handoff with copy + download
- Nightly catalog verification workflow
- CI typecheck + production build

## Tech stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 + a custom dark design system
- Express API server
- JSON catalog snapshot for zero-latency planning reads
- GitHub Actions for nightly source/price verification and CI
- Optional DeepSeek / GLM / OpenRouter / other OpenAI-compatible planner model

The planner model never acts as the price source. Prices and free-tier conditions are loaded from the catalog snapshot and the model may only choose from supplied candidates.

## Run locally

```bash
bun install
cp .env.example .env
bun run dev
```

Open `http://localhost:3000`.

The app works without API credentials. In that mode it uses the deterministic budget router.

## Optional planner model

### DeepSeek

```env
DEEPSEEK_API_KEY=...
PLANNER_MODEL=deepseek-flash
```

### Generic OpenAI-compatible provider

```env
PLANNER_API_KEY=...
PLANNER_BASE_URL=https://your-provider.example/v1
PLANNER_MODEL=your-model-id
```

This can be pointed at a GLM, OpenRouter, DeepSeek, or another compatible route. The server validates returned selections against the catalog candidate set before using them.

## Catalog

Runtime catalog:

```
data/catalog.snapshot.json
```

Refresh it manually:

```bash
bun run catalog:refresh
```

The scheduled workflow runs nightly and currently has explicit price parsers for selected volatile providers plus reachability checks for additional official sources. If a parser fails, the previous known value is retained and the failure is recorded instead of silently replacing a price.

Every catalog item can carry:

- provider and model/tool name
- task capability tags
- API / web / local availability
- price unit
- free-tier conditions
- quality evidence status
- official source
- last verification time

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Planning contract

Handoff follows four rules:

1. **Do not invent prices.**
2. **Owned subscriptions count as zero incremental spend when adequate.**
3. **A more expensive model must earn the upgrade.**
4. **Unknown or credit-based prices are visibly marked for re-checking.**

The resulting handoff is intentionally short enough to paste into Claude Code, Codex, ChatGPT, Cursor, ZCode, or another agent.

## Scripts

```bash
bun run dev
bun run lint
bun run build
bun run catalog:refresh
bun run start
```

## Status

V2 foundation. The next data-layer upgrade is moving historical catalog snapshots and price changes into Postgres/Supabase while retaining the generated snapshot as the fast read path.
