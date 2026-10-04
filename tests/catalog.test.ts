import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  validateCatalog,
  loadCatalog,
  clearCatalogCache,
  getCatalogStatus,
  type CatalogSnapshot,
} from "../lib/catalog";
import {
  parseQwen,
  parseGoogle,
  parseDeepSeek,
} from "../lib/providers/pricing";
import { refreshSnapshot, refreshCatalog } from "../scripts/refresh-catalog";
const catalog = () =>
  JSON.parse(
    fs.readFileSync("data/catalog.snapshot.json", "utf8"),
  ) as CatalogSnapshot;
const qwen = (price = "0.035") =>
  "<table><tr><td>qwen-image-2.0</td><td>International</td><td>$" +
  price +
  "/image</td><td>100 images</td></tr><tr><td>qwen-image-2.0</td><td>Global</td><td>$0.02/image</td></tr></table>";
const google = (price = "0.067") =>
  '<h2 id="gemini-3.1-flash-image">Image</h2><h3>Standard</h3><table><tr><td>Input price</td><td>Not available</td><td>$0.50 (text/image)</td></tr><tr><td>Output price</td><td>Not available</td><td>$' +
  price +
  " per 1K image</td></tr></table><h3>Batch</h3><table><tr><td>$0.001 per 1K image</td></tr></table><h2>Other model</h2>";
const deepseek = () =>
  "<table><tr><td>MODEL</td><td>deepseek-flash<sup>(1)</sup></td><td>deepseek-v4-pro</td></tr><tr><td>1M INPUT TOKENS (CACHE HIT)</td><td>OFF-PEAK</td><td>$0.003</td><td>$0.022</td></tr><tr><td>PEAK</td><td>$0.006</td><td>$0.044</td></tr><tr><td>1M INPUT TOKENS (CACHE MISS)</td><td>OFF-PEAK</td><td>$0.15</td><td>$0.66</td></tr><tr><td>PEAK</td><td>$0.3</td><td>$1.32</td></tr><tr><td>1M OUTPUT TOKENS</td><td>OFF-PEAK</td><td>$0.6</td><td>$1.98</td></tr><tr><td>PEAK</td><td>$1.2</td><td>$3.96</td></tr></table>";
test("validation rejects duplicate IDs, unsafe sources and corrupted rates", () => {
  for (const mutate of [
    (c: CatalogSnapshot) => c.items.push(c.items[0]),
    (c: CatalogSnapshot) => (c.items[0].pricing.unitCost = -1),
    (c: CatalogSnapshot) => (c.items[0].sourceUrl = "javascript:alert(1)"),
    (c: CatalogSnapshot) => (c.items[0].lastVerified = "invalid"),
  ]) {
    const c = catalog();
    mutate(c);
    assert.throws(() => validateCatalog(c));
  }
});
test("Qwen parser scopes exact international model and detects numeric changes", () => {
  const item = catalog().items.find((i) => i.id === "qwen-image-2-0")!;
  assert.equal(parseQwen(qwen(), item).pricing.unitCost, 0.035);
  assert.equal(parseQwen(qwen("0.04"), item).pricing.unitCost, 0.04);
  assert.throws(() => parseQwen(qwen() + qwen(), item));
  assert.throws(() =>
    parseQwen(qwen().replace("qwen-image-2.0", "qwen-image-2.0-pro"), item),
  );
});
test("Google parser separates exact model standard and batch cells", () => {
  const i = catalog().items.find((i) => i.id === "gemini-3-1-flash-image")!;
  assert.equal(parseGoogle(google(), i).pricing.unitCost, 0.067);
  assert.equal(parseGoogle(google("0.08"), i).pricing.unitCost, 0.08);
  assert.throws(() => parseGoogle(google().replace("Standard", "Changed"), i));
});
test("DeepSeek rates bind model column to cache-miss and peak labels", () => {
  const c = catalog(),
    flash = c.items.find((i) => i.id === "deepseek-flash")!,
    pro = c.items.find((i) => i.id === "deepseek-v4-pro")!;
  assert.equal(parseDeepSeek(deepseek(), flash).pricing.inputPer1M, 0.3);
  assert.equal(parseDeepSeek(deepseek(), pro).pricing.outputPer1M, 3.96);
  assert.throws(() =>
    parseDeepSeek(deepseek().replace("CACHE MISS", "UNKNOWN"), flash),
  );
});
test("fetch/parser failures preserve all old prices and dates", async () => {
  const before = catalog(),
    after = await refreshSnapshot(before, async () => {
      throw new Error("Failed");
    });
  assert.deepEqual(
    after.items.map((i) => i.pricing),
    before.items.map((i) => i.pricing),
  );
  assert.deepEqual(
    after.items.map((i) => i.lastVerified),
    before.items.map((i) => i.lastVerified),
  );
  assert.ok(
    after.sourceChecks!.slice(-before.items.length).every((c) => !c.ok),
  );
  assert.deepEqual(
    before.items.map((i) => i.pricing),
    catalog().items.map((i) => i.pricing),
  );
});
test("reachability never advances verification dates; full source history appends", async () => {
  const c = catalog(),
    after = await refreshSnapshot(c, async () => "<html>reachable</html>");
  assert.deepEqual(
    after.items.map((i) => i.lastVerified),
    c.items.map((i) => i.lastVerified),
  );
  assert.equal(
    after.sourceChecks!.length,
    (c.sourceChecks?.length || 0) + c.items.length,
  );
});
test("recognized price change appends history, validates and retains old record", async () => {
  const c = catalog(),
    original = c.items.find((i) => i.id === "qwen-image-2-0")!.pricing.unitCost;
  const price = original === 0.04 ? "0.05" : "0.04";
  const after = await refreshSnapshot(c, async (url) =>
    url.includes("alibabacloud")
      ? qwen(price)
      : url.includes("google")
        ? google()
        : url.includes("deepseek")
          ? deepseek()
          : "<html>source</html>",
  );
  assert.equal(
    after.items.find((i) => i.id === "qwen-image-2-0")!.pricing.unitCost,
    Number(price),
  );
  assert.ok(after.priceHistory!.length > (c.priceHistory?.length || 0));
  assert.equal(
    c.items.find((i) => i.id === "qwen-image-2-0")!.pricing.unitCost,
    original,
  );
});
test("validated cache degrades on corrupted input and missing catalog fails closed", () => {
  const root = fs.mkdtempSync(path.join(process.cwd(), "tests/catalog-cache-"));
  fs.mkdirSync(path.join(root, "data"));
  const file = path.join(root, "data/catalog.snapshot.json");
  try {
    clearCatalogCache();
    fs.writeFileSync(file, JSON.stringify(catalog()));
    const good = loadCatalog(root);
    fs.writeFileSync(file, "{broken");
    assert.equal(loadCatalog(root), good);
    assert.equal(getCatalogStatus(good).status, "degraded");
    clearCatalogCache();
    assert.throws(() => loadCatalog(root));
  } finally {
    clearCatalogCache();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("atomic refresh refuses concurrent catalog replacement", async () => {
  const root = fs.mkdtempSync(
    path.join(process.cwd(), "tests/catalog-refresh-"),
  );
  fs.mkdirSync(path.join(root, "data"));
  const file = path.join(root, "data/catalog.snapshot.json");
  fs.writeFileSync(file, JSON.stringify(catalog()));
  try {
    let changed = false;
    await assert.rejects(() =>
      refreshCatalog(root, async () => {
        if (!changed) {
          changed = true;
          fs.writeFileSync(file, '{"changed":true}');
        }
        return "<html>source</html>";
      }),
    );
    assert.equal(fs.readFileSync(file, "utf8"), '{"changed":true}');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("malformed source health cannot enter the runtime catalog", () => {
  const c = catalog();
  (c as unknown as { sourceChecks: unknown }).sourceChecks = { ok: false };
  assert.throws(() => validateCatalog(c));
});
test("quota observations remain conditional and retain a paid fallback", async () => {
  const c = catalog(),
    after = await refreshSnapshot(c, async (url) =>
      url.includes("alibabacloud") ? qwen() : "<html>reachable</html>",
    );
  const offer = after.offers!.find(
    (o) => o.id === "qwen-new-account-image-quota",
  )!;
  assert.equal(offer.status, "verified");
  assert.ok(offer.eligibility);
  assert.match(offer.fallback!, /0.035/);
  assert.equal(offer.eligible, undefined);
  assert.ok(after.offerHistory!.length > (c.offerHistory?.length || 0));
});
