# Handoff V2 Architecture

## 1. Product boundary

Handoff is not a generic model leaderboard.

The user provides:

- what they want to produce
- quantity
- budget
- priority: free / best value / quality
- tools or subscriptions they already own

Handoff returns one default execution route and keeps alternatives secondary.

## 2. Request path

```text
User goal
  ↓
Task classifier
  ↓
Candidate retrieval from verified catalog
  ↓
Deterministic cost calculation
  ↓
Budget-aware baseline route
  ↓
Optional planner LLM chooses only from supplied candidates
  ↓
Server validates IDs + recalculates costs
  ↓
Human plan + agent handoff
```

The optional LLM is therefore a **selector and explainer**, not a pricing database.

## 3. Catalog

The current fast-read store is `data/catalog.snapshot.json`.

This keeps request-time planning cheap and predictable: the app does not call multiple provider pricing APIs while a user waits.

Each record includes:

- `id`
- `name`
- `provider`
- `kind`
- `tasks[]`
- normalized `pricing`
- free-tier notes
- API/web/local availability
- quality evidence
- source URL
- `lastVerified`
- search/routing tags

### Price history

The snapshot is intentionally versionable in Git. The production data path should later persist each nightly snapshot into Postgres/Supabase:

```text
catalog_items
catalog_prices
catalog_source_checks
catalog_promotions
quality_evidence
```

That enables price-change history, expiration tracking, and stale-source alerts without slowing down planning requests.

## 4. Nightly refresh

`.github/workflows/catalog-refresh.yml` runs at 18:15 UTC each day.

The refresh script:

1. loads the previous snapshot
2. fetches official sources
3. applies provider-specific adapters
4. changes a price only when a known pattern can be confidently parsed
5. preserves the last known value on parsing/fetch failure
6. records source-check results
7. writes the new snapshot
8. commits only if the file changed

This is deliberately conservative. Silent bad price updates are worse than temporarily stale data.

## 5. Planning models

The server has two modes.

### Deterministic router

No API key required. It classifies the job, creates four execution steps, computes known costs, and routes according to budget/preferences.

### Optional reasoning model

Configured with:

- `PLANNER_API_KEY`
- `PLANNER_BASE_URL`
- `PLANNER_MODEL`

or `DEEPSEEK_API_KEY`.

The prompt contains only the user's constraints and the already-filtered candidate set. Returned model/tool IDs are validated before use. Any invented ID is ignored.

This lets Handoff swap GLM, DeepSeek, OpenRouter routes, or another provider without changing product logic.

## 6. Cost semantics

Each selected route carries a cost basis:

- **verified** — stored numeric source data
- **owned** — user's existing subscription, $0 incremental
- **free** — catalog indicates an adequate free route
- **estimated** — current provider uses credits or another hard-to-normalize unit
- **unknown** — must be checked before purchase

The UI sums known costs only and explicitly counts steps that require a price re-check.

## 7. Frontend information architecture

### Home

One dominant project input plus only the constraints that materially change the route.

### Explore

Outcome-first discovery with compact filters. Users browse projects, not model names.

### Plan

Immediate answer first:

- total known spend vs budget
- Prepare → Make → Check → Publish
- one default tool/model per task
- short reason
- expected output
- optional alternatives

### Agent handoff

A compact Markdown block that carries the goal, budget, selected route, deliverables, and guardrails into another coding/chat agent.

## 8. Data quality

A recommendation may be surfaced even when it has not been directly benchmarked, but that status must remain visible.

Current evidence labels are intentionally simple:

- tested
- reviewed
- not tested

A later benchmark service can add task-specific scores without changing the planner contract.

## 9. Deployment

The Express server serves Vite's built frontend in production. The build copies the catalog snapshot into `dist/data` as a fallback.

The app can be hosted on any Node-compatible platform. No database is required for the current foundation.
