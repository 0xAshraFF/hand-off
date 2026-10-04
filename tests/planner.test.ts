import test from "node:test";
import assert from "node:assert/strict";
import { catalogFixture } from "./catalog-fixture";
import {
  normalizeRequest,
  classifyGoal,
  calculateCost,
  buildDraft,
  finalizePlan,
  validatePlannerSelection,
  refineWithPlanner,
  eligible,
  chooseRoute,
  type DraftTask,
} from "../lib/planner";
import type { CatalogSnapshot, CatalogItem } from "../lib/catalog";
const catalog = catalogFixture;
const request = (extra: object = {}) =>
  normalizeRequest({
    goal: "Create 20 product images",
    budget: 5,
    quantity: 20,
    ...extra,
  });
const fixture = (extra: object = {}) =>
  ({
    id: "test",
    name: "Test item",
    provider: "Neutral",
    kind: "image",
    tasks: ["image generation"],
    pricing: { type: "per_image", currency: "USD", unitCost: 0.035 },
    sourceUrl: "https://example.com/pricing",
    lastVerified: new Date().toISOString(),
    tags: [],
    access: { api: true, web: true },
    quality: { status: "not-tested", note: "No benchmark" },
    ...extra,
  }) as CatalogItem;
test("normalization rejects malformed goals, finite ranges and tool list", () => {
  for (const b of [
    null,
    { goal: 2 },
    { goal: "abc", budget: "5" },
    { goal: "abc", budget: NaN },
    { goal: "abc", budget: -1 },
    { goal: "abc", quantity: 1.5 },
    { goal: "abc", ownedTools: [{}] },
    { goal: "abc", privacy: "yes" },
    { goal: "abc", accessMode: "shell" },
  ])
    assert.throws(() => normalizeRequest(b));
});
test("classification uses word boundaries and detects production coding", () => {
  for (const [goal, kind] of [
    ["Create 20 images", "image"],
    ["10 faceless videos", "video"],
    ["Build a finance tracker", "app"],
    ["Production coding project", "app"],
    ["Research assistant", "research"],
    ["Extract invoices", "documents"],
    ["Create presentation slides", "presentation"],
    ["Write a happy birthday note", "general"],
  ])
    assert.equal(classifyGoal(goal), kind);
});
test("image arithmetic exact 20 × .035", () => {
  const i = fixture();
  assert.equal(calculateCost(i, request(), {}, catalog()).cost, 0.7);
});
test("zero token rates remain valid; workloads are estimated", () => {
  const i = fixture({
    pricing: { type: "token", currency: "USD", inputPer1M: 0, outputPer1M: 2 },
  });
  const c = calculateCost(
    i,
    request(),
    { inputTokens: 1e6, outputTokens: 1e6 },
    catalog(),
  );
  assert.equal(c.cost, 2);
  assert.equal(c.costBasis, "estimated");
});
test("unknown credits are never zero even with advertised trial", () => {
  const i = fixture({
    pricing: { type: "credits", currency: "USD" },
    freeTier: { available: true, note: "Eligibility varies" },
  });
  assert.equal(calculateCost(i, request(), {}, catalog()).cost, null);
});
test("owned subscription is zero only through subscription interface", () => {
  const c = catalog(),
    i = c.items.find((i) => i.id === "chatgpt-plus")!;
  assert.equal(
    calculateCost(i, request({ ownedTools: ["ChatGPT Plus"] }), {}, c).cost,
    0,
  );
  assert.notEqual(
    calculateCost(
      i,
      request({ ownedTools: ["ChatGPT Plus"], accessMode: "api" }),
      {},
      c,
    ).costBasis,
    "owned",
  );
  assert.notEqual(
    calculateCost(i, request({ ownedTools: ["Not ChatGPT Plus"] }), {}, c)
      .costBasis,
    "owned",
  );
});
test("free edition needs known eligibility", () => {
  const i = fixture({
    kind: "editor",
    pricing: { type: "free_plus_license", currency: "USD" },
    freeTier: { available: true },
  });
  assert.equal(calculateCost(i, request(), {}, catalog()).cost, 0);
});
test("non-USD rates need conversion rather than USD fabrication", () => {
  assert.equal(
    calculateCost(
      fixture({ pricing: { type: "per_image", currency: "CNY", unitCost: 1 } }),
      request(),
      {},
      catalog(),
    ).cost,
    null,
  );
});
test("stale/future dates cannot be called verified", () => {
  for (const date of ["2000-01-01", "not-a-date", "2999-01-01"])
    assert.equal(
      calculateCost(fixture({ lastVerified: date }), request(), {}, catalog())
        .costBasis,
      "estimated",
    );
});
test("privacy, access, GPU and region filtering precedes routing", () => {
  const i = fixture({
    access: { api: true, local: true },
    hardware: "gpu",
    regions: ["CN"],
  });
  assert.equal(
    eligible(i, request({ privacy: true, hardware: "cpu", region: "CN" }), [
      "image generation",
    ]),
    false,
  );
  assert.equal(
    eligible(i, request({ privacy: true, hardware: "gpu", region: "BD" }), [
      "image generation",
    ]),
    false,
  );
  assert.equal(
    eligible(i, request({ privacy: true, hardware: "gpu", region: "CN" }), [
      "image generation",
    ]),
    true,
  );
  assert.equal(
    eligible(fixture(), request({ privacy: true, hardware: "cpu" }), [
      "image generation",
    ]),
    false,
  );
});
test("missing capable candidates fail explicitly", () => {
  assert.throws(() => buildDraft(request(), { ...catalog(), items: [] }));
});
test("20 images best value considers Chinese and Google choices", () => {
  const c = catalog(),
    r = request(),
    d = buildDraft(r, c),
    make = d.find((t) => t.id === "make")!;
  assert.ok(make.options.some((o) => o.toolId === "qwen-image-2-0"));
  assert.ok(make.options.some((o) => o.toolId === "gemini-3-1-flash-image"));
  assert.equal(make.selectedToolId, "qwen-image-2-0");
  const p = finalizePlan(r, c, d);
  assert.ok(p.knownCost <= r.budget);
  assert.ok(p.handoff.includes("Budget ceiling: $5.00"));
  assert.ok(p.tasks.every((t) => t.validation.length));
});
test("ten educational videos separate scripts, visuals, narration, edit, QA, publishing", () => {
  const c = catalog(),
    r = request({
      goal: "10 faceless educational videos",
      quantity: 10,
      budget: 20,
    }),
    d = buildDraft(r, c);
  assert.deepEqual(
    d.map((t) => t.id),
    ["prepare", "visuals", "voice", "edit", "check", "publish"],
  );
  assert.ok(
    !d
      .flatMap((t) => t.options)
      .some((o) => o.toolId === "kling" && o.cost !== null),
  );
});
test("small app uses owned ChatGPT when adequate plus free hosting", () => {
  const c = catalog(),
    r = request({
      goal: "Build a small web app",
      quantity: 1,
      budget: 20,
      ownedTools: ["ChatGPT Plus"],
    }),
    p = finalizePlan(r, c, buildDraft(r, c));
  assert.equal(p.tasks.find((t) => t.id === "make")?.toolId, "chatgpt-plus");
  assert.equal(p.tasks.find((t) => t.id === "make")?.cost, 0);
  assert.ok(p.tasks.some((t) => t.stage === "Publish" && t.cost === 0));
});
test("quality research upgrades only meaningful core tasks", () => {
  const c = catalog(),
    r = request({
      goal: "Research assistant",
      quantity: 1,
      budget: 20,
      preference: "quality",
    }),
    d = buildDraft(r, c);
  assert.equal(d.filter((t) => t.important).length, 1);
  assert.ok(finalizePlan(r, c, d).knownCost <= 20);
});
test("production coding reuses Claude subscription without another subscription", () => {
  const c = catalog(),
    r = request({
      goal: "Build a production coding project",
      quantity: 1,
      budget: 20,
      ownedTools: ["Claude"],
    }),
    p = finalizePlan(r, c, buildDraft(r, c));
  assert.equal(p.tasks.find((t) => t.id === "make")?.toolId, "claude-sonnet");
  assert.equal(p.tasks.find((t) => t.id === "make")?.cost, 0);
});
test("privacy route stays local and never makes planner network call", async () => {
  const c = catalog(),
    r = request({
      goal: "Analyze private research documents",
      privacy: true,
      hardware: "cpu",
      quantity: 1,
    }),
    d = buildDraft(r, c);
  assert.ok(d.every((t) => t.options.every((o) => o.item.access?.local)));
  let called = false;
  await refineWithPlanner(
    r,
    d,
    {
      PLANNER_API_KEY: "test",
      PLANNER_BASE_URL: "https://example.com",
      PLANNER_MODEL: "test",
    },
    async () => {
      called = true;
      throw new Error();
    },
  );
  assert.equal(called, false);
});
test("zero budget routes remain honest about unaffordable scope", () => {
  const c = catalog(),
    r = request({ budget: 0 }),
    p = finalizePlan(r, c, buildDraft(r, c));
  assert.ok(p.budgetStatus === "over" || p.knownCost === 0);
});
test("unknown and stale selections mark budget unconfirmed", () => {
  const c = catalog(),
    r = request(),
    d = buildDraft(r, c);
  const t = d[1],
    selected = t.options.find((o) => o.toolId === t.selectedToolId)!;
  selected.cost = null;
  assert.equal(finalizePlan(r, c, d).budgetStatus, "unconfirmed");
});
test("planner must return all tasks once with eligible known IDs", () => {
  const c = catalog(),
    r = request(),
    d = buildDraft(r, c),
    rows = d.map((t) => ({ id: t.id, selectedToolId: t.selectedToolId }));
  for (const tasks of [
    [{ id: d[0].id, selectedToolId: "fabricated" }],
    rows.slice(1),
    rows.map((v, i) => (i === 1 ? { ...v, id: rows[0].id } : v)),
    rows.map((v, i) =>
      i === 1 ? { ...v, selectedToolId: "chatgpt-plus" } : v,
    ),
  ])
    assert.throws(() => validatePlannerSelection({ tasks }, d, r));
});
test("model prices are ignored and costs recalculated from candidates", () => {
  const c = catalog(),
    r = request(),
    d = buildDraft(r, c),
    tasks = d.map((t) => ({
      id: t.id,
      selectedToolId: t.selectedToolId,
      cost: -100,
      price: 0,
    }));
  assert.deepEqual(validatePlannerSelection({ tasks }, d, r), d);
});
test("model route over total budget is rejected", () => {
  const c = catalog(),
    r = request({ budget: 0.8 }),
    d = buildDraft(r, c),
    tasks = d.map((t) => ({
      id: t.id,
      selectedToolId:
        t.id === "make" ? "gemini-3-1-flash-image" : t.selectedToolId,
    }));
  assert.throws(() => validatePlannerSelection({ tasks }, d, r));
});
test("no-key fallback and malformed provider responses are safe", async () => {
  const r = request(),
    d = buildDraft(r, catalog());
  assert.equal((await refineWithPlanner(r, d, {})).used, false);
  const response = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"tasks":[{"id":"make","selectedToolId":"injected"}]}',
            },
          },
        ],
      }),
    );
  assert.equal(
    (
      await refineWithPlanner(
        r,
        d,
        {
          PLANNER_API_KEY: "test",
          PLANNER_BASE_URL: "https://example.com/v1",
          PLANNER_MODEL: "model",
        },
        response,
      )
    ).used,
    false,
  );
});
test("valid compatible planner path accepts supplied IDs", async () => {
  const r = request(),
    d = buildDraft(r, catalog());
  const response = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tasks: d.map((t) => ({
                  id: t.id,
                  selectedToolId: t.selectedToolId,
                })),
              }),
            },
          },
        ],
      }),
    );
  assert.equal(
    (
      await refineWithPlanner(
        r,
        d,
        {
          PLANNER_API_KEY: "test",
          PLANNER_BASE_URL: "https://example.com/v1",
          PLANNER_MODEL: "model",
        },
        response,
      )
    ).used,
    true,
  );
});
test("global budget reserved across every task instead of per-step fractions", () => {
  const r = request({ budget: 1, preference: "quality" });
  const i = fixture();
  const option = (id: string, cost: number, score: number) => ({
    toolId: id,
    label: id,
    item: i,
    cost,
    score,
    costBasis: "verified" as const,
    costLabel: "cost",
    category: "usage",
    assumptions: [],
  });
  const tasks = [0, 1].map((n) => ({
    id: String(n),
    stage: "Make",
    title: "Generate",
    purpose: "Generate",
    expectedOutput: "Result",
    capabilities: [],
    validation: [],
    units: 1,
    important: true,
    selectedToolId: "",
    options: [option("low", 0.4, 1), option("high", 0.7, 3)],
  })) as DraftTask[];
  const selected = chooseRoute(tasks, r);
  assert.ok(
    selected.reduce(
      (sum, t) =>
        sum + t.options.find((o) => o.toolId === t.selectedToolId)!.cost!,
      0,
    ) <= 1,
  );
});

test("new monthly subscription is charged once across repeated tasks", () => {
  const r = request({ budget: 20 }),
    i = fixture({
      pricing: {
        type: "subscription",
        currency: "USD",
        subscriptionMonthly: 20,
      },
    });
  const option = {
    toolId: i.id,
    label: i.name,
    item: i,
    score: 1,
    ...calculateCost(i, r, {}, catalog()),
  };
  const tasks = ["prepare", "make"].map((id) => ({
    id,
    stage: "Make" as const,
    title: "Work",
    purpose: "Work",
    expectedOutput: "Output",
    capabilities: [],
    validation: ["Check result"],
    units: 1,
    selectedToolId: i.id,
    options: [option],
  }));
  const p = finalizePlan(r, catalog(), chooseRoute(tasks, r));
  assert.equal(p.knownCost, 20);
  assert.deepEqual(
    p.tasks.map((t) => t.cost),
    [20, 0],
  );
  assert.doesNotThrow(() =>
    validatePlannerSelection(
      { tasks: tasks.map((t) => ({ id: t.id, selectedToolId: i.id })) },
      tasks,
      r,
    ),
  );
});
test("catalog order and provider names cannot change a recommendation", () => {
  const c = catalog(),
    r = request(),
    first = buildDraft(r, c).map((t) => t.selectedToolId);
  const second = buildDraft(r, {
    ...c,
    items: [...c.items]
      .reverse()
      .map((i) => ({ ...i, provider: "Unrelated provider" })),
  }).map((t) => t.selectedToolId);
  assert.deepEqual(second, first);
});
test("finite but overflowing rates become unknown rather than corrupting totals", () => {
  const i = fixture({
    pricing: {
      type: "token",
      currency: "USD",
      inputPer1M: Number.MAX_VALUE,
      outputPer1M: Number.MAX_VALUE,
    },
  });
  assert.equal(
    calculateCost(
      i,
      request(),
      { inputTokens: 1e9, outputTokens: 1e9 },
      catalog(),
    ).cost,
    null,
  );
});

test("budget precision and Google input estimates cannot understate displayed spend", () => {
  assert.throws(() =>
    normalizeRequest({ goal: "Create images", budget: 0.701 }),
  );
  const i = fixture({
    pricing: {
      type: "per_image",
      currency: "USD",
      unitCost: 0.067,
      inputPer1M: 0.5,
    },
  });
  const cost = calculateCost(i, request({ quantity: 20 }), {}, catalog());
  assert.equal(cost.cost, 1.343);
  assert.equal(cost.costBasis, "estimated");
});
test("planner cannot add spend to a free-first or value route without evidence", () => {
  const r = request({ budget: 20 }),
    c = catalog(),
    draft = buildDraft(r, c);
  const payload = {
    tasks: draft.map((t) => ({ id: t.id, selectedToolId: t.selectedToolId })),
  };
  const image = draft.find((t) => t.id === "make")!;
  const expensive = image.options.find(
    (o) =>
      o.toolId !== image.selectedToolId &&
      o.cost !== null &&
      o.cost >
        image.options.find((o) => o.toolId === image.selectedToolId)!.cost!,
  )!;
  payload.tasks.find((t) => t.id === "make")!.selectedToolId = expensive.toolId;
  assert.throws(() => validatePlannerSelection(payload, draft, r));
});

test("web free editions do not imply free API credits or API pricing in the web interface", () => {
  const c = catalog(),
    canva = c.items.find((i) => i.id === "canva")!,
    google = c.items.find((i) => i.id === "gemini-3-1-flash-image")!;
  assert.equal(
    calculateCost(canva, request({ accessMode: "api" }), {}, c).cost,
    null,
  );
  assert.equal(
    calculateCost(google, request({ accessMode: "web" }), {}, c).cost,
    null,
  );
});
