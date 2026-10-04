# Handoff architecture

The existing React/Vite UI calls a testable Express application. `lib/catalog.ts` validates and caches snapshot facts; `lib/planner.ts` normalizes requests, decomposes tasks, filters constraints, estimates costs, ranks eligible candidates, validates optional planner choices, and creates the human route and Markdown handoff.

The planning path is request validation → task decomposition → capability/access/privacy/hardware/region filtering → cost estimates → total-budget selection → optional compatible planner → exact task/ID/budget validation → human plan and agent handoff. Pricing never comes from the LLM. Unknown prices are excluded from the known subtotal and prevent a confirmed budget. Workload estimates exclude retries; recurring subscription charges are counted once. Displayed subtotals round conservatively to cents. Quality preference applies to core work, with untested evidence and informational alternatives made explicit.

Owned web subscriptions are zero incremental through supported interfaces; API pricing is separate. Catalogued API rates cannot become verified web-interface prices. CPU/GPU routes require declared hardware. Private/local plans skip all external planner calls. Manual recording, editing and visual QA can use free software, with human time excluded and checks stated.

Optional refinement requires HTTPS, an explicit endpoint model ID and a server-side key. The model receives only eligible catalog candidates. Exact task coverage, duplicates, unknown IDs, total spend, unknown-for-known swaps, loss of owned-tool savings, and unjustified spend increases are checked. A missing key, timeout, network failure or invalid response uses the deterministic route. No vendor's model name or provider brand changes ranking.

The snapshot remains the runtime read path. Official scoped HTML adapters parse Qwen international image rates/quota, Google's exact standard image section (including input rates), and DeepSeek model-specific peak/cache columns. Other sources record reachability, preserve their old dates and retain unverified price labels. Refresh preserves every price/offer observation and source check; parser/fetch failures preserve old values. Catalog SQL migration and export are implemented and tested, but hosted DB synchronization is not configured. See DATA.md.

API routes:

- GET `/api/health`, `/api/catalog`, `/api/catalog/status`, `/api/catalog/search`, `/api/tools/:id`, `/api/prices/:id`, `/api/offers`.
- POST `/api/plan`, `/api/plan-v2`, `/api/plan/refine`: optionally refined full routes.
- POST `/api/plan/preview`: deterministic route calculations, with no model call.
- POST `/api/handoff/export`: a Markdown HTTP attachment with a sanitized filename; no stored user content.
- POST `/api/catalog/refresh`: constant-time bearer-secret validation and one refresh at a time.

JSON requests are limited to 32 KB; the Markdown form attachment allows 256 KB of percent-encoded text, bounded to 24,000 handoff characters. Planning rate limits are per IP per server process. Production serves a portable Vite/esbuild output and its snapshot. Both Ubuntu and Windows CI run frozen installs, typechecking, tests and build. Nightly refresh at 18:15 UTC runs checks before and after refresh, then commits tracked data only; it requires no HTTP admin secret.

The UI includes project details, working outcome/category/section/style/difficulty/budget/access filters, Ctrl/Cmd+K search with focus trapping and Escape, source/evidence and budget states, session guide checklists, offers, copy/download feedback, and light/dark responsive layouts. Route filters require complete calculated previews. There is no fabricated community count or output-quality badge.

Known limits: source coverage is deliberately partial; pricing and account limits can change; human time, setup, hardware and retries are excluded. A static host needs separate API hosting. No live provider credential test or hosted database provisioning was performed. Model quality labels remain untested until real task evaluations exist.
