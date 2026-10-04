import fs from "node:fs";
import { loadCatalog } from "../lib/catalog";
import { normalizeRequest, buildDraft, finalizePlan } from "../lib/planner";
const c = loadCatalog();
const scenarios = [
  {
    name: "20 product images, best value",
    goal: "Create 20 product ad images for my skincare shop",
    quantity: 20,
    budget: 5,
    preference: "value",
  },
  {
    name: "10 educational videos",
    goal: "Create 10 faceless educational videos for YouTube Shorts",
    quantity: 10,
    budget: 20,
    preference: "value",
    durationSeconds: 60,
  },
  {
    name: "Small app with ChatGPT Plus",
    goal: "Build a small finance tracker web app",
    quantity: 1,
    budget: 20,
    preference: "value",
    ownedTools: ["ChatGPT Plus"],
  },
  {
    name: "Quality-first research",
    goal: "Research papers and compare their evidence",
    quantity: 1,
    budget: 20,
    preference: "quality",
  },
  {
    name: "Production coding with Claude",
    goal: "Write production code for a web app",
    quantity: 1,
    budget: 20,
    preference: "value",
    ownedTools: ["Claude"],
  },
  {
    name: "Privacy-sensitive local research",
    goal: "Research private documents and synthesize findings",
    quantity: 1,
    budget: 0,
    preference: "free",
    privacy: true,
    accessMode: "local",
    hardware: "cpu",
  },
];
const results = scenarios.map((s) => {
  const r = normalizeRequest(s);
  return { scenario: s.name, plan: finalizePlan(r, c, buildDraft(r, c)) };
});
const report = [
  "# Planning evaluation",
  "",
  `Catalog snapshot: ${c.generatedAt}. Deterministic routing, no live model call. Estimates exclude retries; untested output quality is labeled honestly.`,
  "",
  "| Scenario | Known subtotal | Status | Route |",
  "| --- | ---: | --- | --- |",
  ...results.map(
    ({ scenario, plan: p }) =>
      `| ${scenario} | $${p.knownCost.toFixed(2)} / $${p.budget.toFixed(2)} | ${p.budgetStatus} | ${p.tasks.map((t) => t.stage + ": " + t.toolName).join(" → ")} |`,
  ),
  "",
  "## Interpretation",
  "",
  "The image MAKE step uses Qwen ($0.70 for 20 images); Gemini remains a quality-oriented alternative with input tokens estimated separately. Video plans split scripting, visuals, narration, editing, checking, and delivery. Owned chat subscriptions have zero incremental chat-interface cost and do not grant API credits. Quality priority spends selectively on core work; no measured output-quality improvement is claimed. Private research stays on local CPU routes, with model download/runtime memory and human source validation required.",
  "",
  "## Validation",
  "",
  "Automated coverage includes six scenarios, total budgets, known/unknown/stale costs, owned/API separation, malformed requests and planner responses, exact candidate IDs, provider neutrality, source changes/failures, conditional quota expiry, discovery filters, HTTP Markdown attachments, and real Postgres migration/export/RLS checks. Browser QA covers home, plan, guide, search/filter keyboard behavior, clipboard copy, offers, responsive light/dark layouts, and Markdown download.",
  "",
  "## External limits",
  "",
  "No live planner credentials or hosted database were provisioned. Compatible planner calls are tested with controlled responses. The Postgres schema and repeatable SQL bootstrap are tested locally with PGlite; production reads the validated snapshot. Four pricing adapters cover Qwen, Google and two DeepSeek models. Other records retain their prior dates and show reachability or failed checks; no complete provider-coverage claim is made.",
  "",
];
fs.writeFileSync("docs/EVALUATION.md", report.join("\n"));
console.log(
  results.map(({ scenario, plan }) => ({
    scenario,
    cost: plan.knownCost,
    status: plan.budgetStatus,
    tools: plan.tasks.map((t) => t.toolId),
  })),
);
