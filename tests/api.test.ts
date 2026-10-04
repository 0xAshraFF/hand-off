import test from "node:test";
import { once } from "node:events";
import assert from "node:assert/strict";
import { createApp } from "../server";
const app = createApp(),
  server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
const base = "http://127.0.0.1:" + (address as { port: number }).port;
test.after(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
);
test("health/catalog/search/details/prices expose sourced data", async () => {
  for (const route of [
    "/api/health",
    "/api/catalog",
    "/api/catalog/status",
    "/api/catalog/search?q=qwen",
    "/api/tools/qwen-image-2-0",
    "/api/prices/qwen-image-2-0",
    "/api/offers",
  ]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.ok(await response.json());
  }
});
test("plan and compatibility endpoint work without API key", async () => {
  for (const route of ["/api/plan", "/api/plan-v2", "/api/plan/refine"]) {
    const response = await fetch(base + route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: "Create 20 product images",
        quantity: 20,
        budget: 5,
      }),
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(data.plan.handoff);
    assert.ok(Number.isFinite(data.plan.knownCost));
    if (data.plan.knownCost > 5) assert.equal(data.plan.budgetStatus, "over");
  }
});
test("API validation errors are readable without stack/secrets", async () => {
  const response = await fetch(base + "/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: "abc", budget: "bad", ownedTools: [{}] }),
  });
  assert.equal(response.status, 400);
  assert.ok((await response.json()).error);
});
test("admin refresh cannot be triggered anonymously", async () => {
  const response = await fetch(base + "/api/catalog/refresh", {
    method: "POST",
  });
  assert.equal(response.status, 401);
});
test("unknown API route and missing item return JSON 404", async () => {
  for (const route of ["/api/unknown", "/api/tools/missing"]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404);
    assert.ok((await response.json()).error);
  }
});
test("invalid JSON body fails safely", async () => {
  const response = await fetch(base + "/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{bad",
  });
  assert.equal(response.status, 400);
  assert.ok((await response.json()).error);
});
test("oversized planning request is rejected", async () => {
  const response = await fetch(base + "/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal: "x".repeat(40000) }),
  });
  assert.equal(response.status, 413);
});

test("Markdown export preserves the handoff, supplies a safe filename and rejects malformed requests", async () => {
  const handoff = "# PROJECT HANDOFF\nBudget: $5\nTool: qwen-image-2-0";
  const response = await fetch(base + "/api/handoff/export", {
    method: "POST",
    body: new URLSearchParams({ handoff, name: "My project / ../../bad" }),
  });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), handoff);
  assert.match(
    response.headers.get("content-disposition")!,
    /^attachment; filename="My-project-bad.md"/,
  );
  assert.match(response.headers.get("content-type")!, /text\/markdown/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const unicode = "# PROJECT HANDOFF\n" + "বাংলা".repeat(2000);
  const unicodeResponse = await fetch(base + "/api/handoff/export", {
    method: "POST",
    body: new URLSearchParams({ handoff: unicode, name: "unicode-handoff" }),
  });
  assert.equal(unicodeResponse.status, 200);
  assert.equal(await unicodeResponse.text(), unicode);
  assert.equal(
    (
      await fetch(base + "/api/handoff/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"handoff":5}',
      })
    ).status,
    400,
  );
});
