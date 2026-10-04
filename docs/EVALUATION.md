# Planning evaluation

Catalog snapshot: 2026-10-04T17:08:48.119Z. Deterministic routing, no live model call. Estimates exclude retries; untested output quality is labeled honestly.

| Scenario                         | Known subtotal | Status | Route                                                                                                                                              |
| -------------------------------- | -------------: | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 20 product images, best value    |  $1.21 / $5.00 | within | Prepare: DeepSeek V4.1 Flash → Make: Qwen Image 2.0 → Check: DeepSeek V4.1 Flash → Publish: Canva                                                  |
| 10 educational videos            | $0.61 / $20.00 | within | Prepare: DeepSeek V4.1 Flash → Make: Qwen Image 2.0 → Make: DaVinci Resolve → Make: CapCut → Check: DaVinci Resolve → Publish: DeepSeek V4.1 Flash |
| Small app with ChatGPT Plus      | $0.00 / $20.00 | within | Prepare: ChatGPT Plus → Make: ChatGPT Plus → Check: ChatGPT Plus → Publish: Cloudflare Pages                                                       |
| Quality-first research           | $0.09 / $20.00 | within | Prepare: DeepSeek V4.1 Flash → Make: DeepSeek V4 Pro → Check: DeepSeek V4.1 Flash → Publish: DeepSeek V4.1 Flash                                   |
| Production coding with Claude    | $0.00 / $20.00 | within | Prepare: Claude Sonnet → Make: Claude Sonnet → Check: Claude Sonnet → Publish: Cloudflare Pages                                                    |
| Privacy-sensitive local research |  $0.00 / $0.00 | within | Prepare: Qwen3 4B via Ollama → Make: Qwen3 4B via Ollama → Check: Qwen3 4B via Ollama → Publish: LibreOffice                                       |

## Interpretation

The image MAKE step uses Qwen ($0.70 for 20 images); Gemini remains a quality-oriented alternative with input tokens estimated separately. Video plans split scripting, visuals, narration, editing, checking, and delivery. Owned chat subscriptions have zero incremental chat-interface cost and do not grant API credits. Quality priority spends selectively on core work; no measured output-quality improvement is claimed. Private research stays on local CPU routes, with model download/runtime memory and human source validation required.

## Validation

Automated coverage includes six scenarios, total budgets, known/unknown/stale costs, owned/API separation, malformed requests and planner responses, exact candidate IDs, provider neutrality, source changes/failures, conditional quota expiry, discovery filters, HTTP Markdown attachments, and real Postgres migration/export/RLS checks. Browser QA covers home, plan, guide, search/filter keyboard behavior, clipboard copy, offers, responsive light/dark layouts, and Markdown download.

## External limits

No live planner credentials or hosted database were provisioned. Compatible planner calls are tested with controlled responses. The Postgres schema and repeatable SQL bootstrap are tested locally with PGlite; production reads the validated snapshot. Four pricing adapters cover Qwen, Google and two DeepSeek models. Other records retain their prior dates and show reachability or failed checks; no complete provider-coverage claim is made.
