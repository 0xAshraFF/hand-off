# Implementation board

## NOW

Catalog freshness hardening on `claude/admiring-clarke-uj8qqn`. Nightly snapshot history is now bounded, failed source checks record why they failed, and the refresh command reports verified/unparseable/failed counts with a warning per failure so a green workflow run no longer implies a current catalog. Typecheck, 60 tests and build pass locally; PR open for CI and review.

## PARALLEL

None in flight. Earlier independent catalog/schema, UI and documentation work is integrated in main through PR #1 and PR #2, both merged 2026-10-04.

## BLOCKED

- **No live planner key or hosted database.** Controlled compatible-response tests and real Postgres/PGlite migration/import checks validate those boundaries; production uses the snapshot.
- **Thirteen of seventeen catalog items have no pricing parser.** `pricingAdapter` covers only `qwen-image-2-0`, `gemini-3-1-flash-image`, `deepseek-flash` and `deepseek-v4-pro`. Every other item is reachability-checked only, so its `lastVerified` cannot advance and it reads as stale permanently under the 36-hour policy. `verifiedPrices: 3` in the last refresh is the ceiling, not a shortfall. Resolving this needs a product decision, not more scraping: either add parsers, or give manually-verified items an explicit longer review cadence so the catalog stops claiming a nightly cycle it cannot meet for most of its contents.
- **No quality evidence.** All seventeen items are `quality.status: "not-tested"`, which scores zero and therefore differentiates nothing. `scripts/evaluate.ts` exists but has produced no results into the catalog, so routing is price-and-fit only today.

## VALIDATE

Typecheck, 60 tests and portable production build pass. A sixty-night refresh simulation against the real snapshot confirms the file plateaus at ~217 KB instead of growing ~11.25 KB per night. Pruning is covered by a test asserting the newest check per source always survives, because `getCatalogStatus` derives each source's state from exactly that entry. Failure-reason capture is covered by a test asserting an HTTP failure and a parser failure produce distinguishable notes. Remaining verification is GitHub CI and PR review.

## DONE

- Bounded `sourceChecks`, `priceHistory` and `offerHistory` with retention caps. The snapshot is rewritten and committed nightly, so unbounded arrays were costing a fresh blob of a permanently growing file: 53 KB on 2026-10-04 to 131 KB on 2026-10-10, tracking to ~4.2 MB and roughly 767 MB of git objects within a year.
- Preserved the newest check per source through pruning so status reporting cannot lose sight of a source whose check ages out of the window.
- Captured the real reason on a failed source check. Failures previously discarded the error and shared one generic sentence, leaving twenty-five recorded failures indistinguishable and undiagnosable from the committed artifact.
- Reported refresh outcome counts and a warning per failure from the CLI, and recorded `unparseableItems` and per-failure detail in `lastRefreshResult`.
- Updated the test that asserted unbounded history appending; it would have begun failing in CI once the retention cap was first reached.
- Pulled current main, manually initialized AGENTS.md because /init is unavailable in this desktop tool session, audited baseline and preserved V2 design.
- Replaced hardcoded candidates and arbitrary estimates with constraint filtering, total-budget accounting, owned/API separation, deterministic preferences and validated optional planner choices.
- Added isolated official pricing adapters, source health, price/quota histories, failure preservation, stale/unknown states and atomic refresh.
- Added Postgres/Supabase schema, RLS, current views and idempotent snapshot SQL export with current-row reconciliation.
- Finished details, Explore, discovery filters, search overlay, guide, offers, copy/download, accessibility and responsive themes.
- Removed unused legacy components and fabricated pricing presets; replaced Unix build commands with portable Node scripts and pnpm locking.
- Reviewed full implementation; fixed compiler escaping, Google input rates, cent precision, malformed health records, free/API billing, SQL retirement/import coverage and degraded health.

## Open questions

- `volatileMaxAgeHours` is 36 against a nightly (24-hour) schedule, leaving twelve hours of slack. One late or skipped run tips the whole catalog stale; a gap already occurred between 2026-10-04 and 2026-10-06. Either tighten the schedule or widen the window, noting it changes what users are shown.
- Even at a flat ~217 KB, a nightly commit stores a new blob, so git objects still accumulate at roughly 79 MB a year. Lowering retention, committing only on change, or moving history out of the tracked snapshot would each reduce it further.

## Baseline evidence

Original typecheck and direct Vite/esbuild passed. No test script existed; npm/pnpm were unavailable on PATH and the build copy commands were Unix-only. Original planning ignored preferences, bypassed whole-budget checks and owned tools, guessed video costs, refreshed verification from mere reachability, and exposed inert discovery controls and unsupported quality claims.
