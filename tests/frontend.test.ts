import test from "node:test";
import assert from "node:assert/strict";
import { catalogFixture } from "./catalog-fixture";
import {
  filterOutcomes,
  emptyFilters,
  type Catalog,
  type ProjectPlan,
} from "../src/frontend";
import { normalizeRequest, buildDraft, finalizePlan } from "../lib/planner";
const catalog = catalogFixture();
const plan = () => {
  const r = normalizeRequest({
    goal: "Create 20 product ad images",
    quantity: 20,
    budget: 5,
  });
  return finalizePlan(r, catalog, buildDraft(r, catalog)) as ProjectPlan;
};
test("discovery combines category, style, difficulty and multiword search", () => {
  const rows = filterOutcomes(
    {
      ...emptyFilters,
      category: "Shopping",
      style: "Photography",
      difficulty: "Easy",
      query: "shop ads",
    },
    catalog as Catalog,
    {},
  );
  assert.deepEqual(
    rows.map((r) => r.id),
    ["shop-ads"],
  );
  assert.equal(
    filterOutcomes(
      { ...emptyFilters, category: "Shopping", style: "Dashboard" },
      catalog,
      {},
    ).length,
    0,
  );
});
test("budget and free discovery require complete, confirmed route costs", () => {
  const p = plan();
  assert.deepEqual(
    filterOutcomes({ ...emptyFilters, budget: "5" }, catalog, {
      "shop-ads": p,
    }).map((o) => o.id),
    ["shop-ads"],
  );
  assert.equal(
    filterOutcomes({ ...emptyFilters, budget: "5" }, catalog, {
      "shop-ads": { ...p, budgetStatus: "unconfirmed" },
    }).length,
    0,
  );
  assert.equal(
    filterOutcomes({ ...emptyFilters, free: true }, catalog, { "shop-ads": p })
      .length,
    0,
  );
  const free = {
    ...p,
    knownCost: 0,
    budgetStatus: "within" as const,
    tasks: p.tasks.map((t) => ({ ...t, cost: 0, costBasis: "free" })),
  };
  assert.equal(
    filterOutcomes({ ...emptyFilters, free: true }, catalog, {
      "shop-ads": free,
    }).length,
    1,
  );
  assert.equal(
    filterOutcomes({ ...emptyFilters, free: true }, catalog, {
      "shop-ads": {
        ...free,
        tasks: [
          ...free.tasks.slice(0, -1),
          { ...free.tasks.at(-1)!, cost: null, costBasis: "unknown" },
        ],
      },
    }).length,
    0,
  );
});
test("local and API discovery verify every step, not one matching catalog tool", () => {
  const p = plan();
  const restricted = structuredClone(catalog);
  restricted.items.find(
    (i: { id: string }) => i.id === p.tasks.at(-1)!.toolId,
  )!.access!.api = false;
  assert.equal(
    filterOutcomes({ ...emptyFilters, local: true }, restricted, {
      "shop-ads": p,
    }).length,
    0,
  );
  assert.equal(
    filterOutcomes({ ...emptyFilters, api: true }, restricted, {
      "shop-ads": p,
    }).length,
    0,
  );
});
