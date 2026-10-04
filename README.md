# Handoff

Handoff turns a goal, budget, quantity and existing tools into a practical task route and agent handoff. The existing React/Vite/Express V2 design is preserved. Catalog facts supply capabilities and pricing; the optional planner can select only validated candidates.

## Run locally

Requires Node.js 24 and pnpm 11.25.0.

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm dev
```

Open http://localhost:3000. Credentials are optional. Planning, previews, filters, clipboard copy and Markdown export work without an LLM key.

```text
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm catalog:refresh
pnpm catalog:export ../../outputs/catalog.sql
```

For production set NODE_ENV=production, then run `pnpm start`; supply PORT if needed. Static hosting alone cannot run the Express API. Deploy the built server, its installed dependencies and dist directory on a Node host.

## Planning and catalog

The router filters capability, access mode, privacy, hardware and region before estimating costs. It reserves the total budget across tasks, accounts for recurring subscriptions once, reuses owned chat subscriptions at zero incremental cost, and keeps API billing separate. Unknown and stale costs never mean zero. Free/value choose the least costly adequate route; quality can spend selectively on important work. Output quality is untested unless linked evidence exists.

Set PLANNER_API_KEY, PLANNER_BASE_URL and the endpoint's exact PLANNER_MODEL to enable optional OpenAI-compatible refinement. DEEPSEEK_API_KEY is supported as an alternative key/base configuration; an explicit model ID remains required. No model default is invented. Privacy/local requests never call the planner. Invalid, expensive or unavailable refinements fall back to the deterministic route.

Nightly refresh remains at 18:15 UTC. Official parsers cover Qwen Image 2.0, Gemini 3.1 Flash Image standard pricing, and both DeepSeek model columns. Failed or changed markup retains old prices/dates and appends failed checks. Reachability is not price verification. Every successful price observation and conditional quota observation is retained. Current offers require fresh source evidence and valid date windows; account eligibility must be checked independently. The CLI workflow needs no application secret; the HTTP refresh endpoint separately requires CATALOG_ADMIN_TOKEN.

The runtime currently reads the validated JSON snapshot. [DATA.md](docs/DATA.md) describes the Postgres/Supabase migration and repeatable SQL import bridge, tested with real Postgres via PGlite. No hosted database or live planner credentials were provisioned. [EVALUATION.md](docs/EVALUATION.md) records the six requested scenarios and validation limits; [ARCHITECTURE.md](docs/ARCHITECTURE.md) explains the boundaries.
