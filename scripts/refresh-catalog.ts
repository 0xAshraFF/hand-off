import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  validateCatalog,
  clearCatalogCache,
  type CatalogSnapshot,
  type SourceCheck,
} from "../lib/catalog";
import { pricingAdapter, parserVersion } from "../lib/providers/pricing";
export async function fetchSource(url: string) {
  if (new URL(url).protocol !== "https:")
    throw new Error("Source requires HTTPS.");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: {
      "User-Agent":
        "HandoffCatalogBot/0.3 (+https://github.com/0xAshraFF/hand-off)",
    },
  });
  if (!response.ok) throw new Error("Source returned HTTP " + response.status);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty source response.");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 3e6) {
      await reader.cancel();
      throw new Error("Source too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function refreshSnapshot(
  previous: CatalogSnapshot,
  fetcher: (url: string) => Promise<string> = fetchSource,
  now = new Date().toISOString(),
) {
  const next = structuredClone(validateCatalog(previous));
  const checks: SourceCheck[] = [];
  const history = next.priceHistory || [];
  const offerHistory = next.offerHistory || [];
  const cache = new Map<string, Promise<string>>();
  for (const item of next.items) {
    const adapter = pricingAdapter(item);
    const check: SourceCheck = {
      source: item.sourceUrl,
      itemId: item.id,
      ok: false,
      checkedAt: now,
      note: "",
      parserVersion: adapter ? parserVersion : "reachability-v1",
      priceVerified: false,
      changeDetected: false,
    };
    try {
      if (!cache.has(item.sourceUrl))
        cache.set(item.sourceUrl, fetcher(item.sourceUrl));
      const html = await cache.get(item.sourceUrl)!;
      if (adapter) {
        const parsed = adapter(html, item);
        const oldPricing = structuredClone(item.pricing),
          oldTier = structuredClone(item.freeTier);
        validateCatalog({
          ...next,
          items: next.items.map((candidate) =>
            candidate.id === item.id
              ? { ...item, pricing: parsed.pricing }
              : candidate,
          ),
        });
        check.changeDetected =
          JSON.stringify(oldPricing) !== JSON.stringify(parsed.pricing);
        history.push({
          itemId: item.id,
          oldValue: oldPricing,
          newValue: parsed.pricing,
          detectedAt: now,
          source: item.sourceUrl,
          parserVersion,
          changed: check.changeDetected,
        });
        if (
          parsed.freeTier &&
          JSON.stringify(oldTier) !== JSON.stringify(parsed.freeTier)
        ) {
          offerHistory.push({
            itemId: item.id,
            oldValue: oldTier,
            newValue: parsed.freeTier,
            detectedAt: now,
            source: item.sourceUrl,
            kind: "free_tier",
          });
        }
        if (item.id === "qwen-image-2-0" && parsed.freeTier) {
          const id = "qwen-new-account-image-quota",
            previousOffer = (next.offers || []).find((o) => o.id === id);
          const offer = {
            id,
            toolId: item.id,
            title: "Qwen image new-account quota",
            status: parsed.freeTier.available ? "verified" : "removed",
            description: parsed.freeTier.note,
            eligibility:
              "Only qualifying provider accounts and regions. Confirm activation date and remaining quota with Alibaba Cloud.",
            limits: parsed.freeTier.note,
            sourceUrl: item.sourceUrl,
            lastVerified: now,
            fallback:
              "Use paid international image pricing at $" +
              parsed.pricing.unitCost +
              " per image; recalculate the route first.",
          };
          next.offers = [
            ...(next.offers || []).filter((o) => o.id !== id),
            offer,
          ];
          offerHistory.push({
            offerId: id,
            oldValue: previousOffer || null,
            newValue: offer,
            detectedAt: now,
            source: item.sourceUrl,
            event: "observed",
            changed: JSON.stringify(previousOffer) !== JSON.stringify(offer),
          });
        }
        item.pricing = parsed.pricing;
        if (parsed.freeTier) item.freeTier = parsed.freeTier;
        item.lastVerified = now;
        item.pricingVerified = true;
        check.priceVerified = true;
        check.note = "Scoped model pricing parsed and validated.";
      } else {
        check.note =
          "Official source reachable; no pricing parser. Price verification date retained.";
      }
      check.ok = true;
    } catch {
      check.note =
        "Fetch or parser failed; previous prices and verification date retained.";
      item.pricingVerified = item.pricingVerified ?? false;
    }
    item.sourceCheck = {
      status: check.priceVerified
        ? "verified"
        : check.ok
          ? "reachable"
          : "failed",
      checkedAt: now,
      note: check.note,
    };
    checks.push(check);
  }
  next.generatedAt = now;
  next.priceHistory = history;
  next.offerHistory = offerHistory;
  next.sourceChecks = [...(next.sourceChecks || []), ...checks];
  next.policy = {
    ...next.policy,
    lastRefreshResult: {
      checkedAt: now,
      successfulSources: checks.filter((c) => c.ok).length,
      verifiedPrices: checks.filter((c) => c.priceVerified).length,
      failedSources: checks.filter((c) => !c.ok).length,
    },
  };
  return validateCatalog(next);
}
export async function refreshCatalog(
  root = process.cwd(),
  fetcher = fetchSource,
) {
  const file = path.join(root, "data", "catalog.snapshot.json");
  const before = fs.readFileSync(file, "utf8"),
    previous = validateCatalog(JSON.parse(before));
  const next = await refreshSnapshot(previous, fetcher);
  if (fs.readFileSync(file, "utf8") !== before)
    throw new Error(
      "Catalog changed during refresh; retry to preserve concurrent edits.",
    );
  const temporary = file + "." + process.pid + ".tmp";
  try {
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + "\n");
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  clearCatalogCache();
  return next.policy.lastRefreshResult;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  refreshCatalog()
    .then((result) => console.log("Catalog refresh:", result))
    .catch(() => {
      console.error("Catalog refresh failed; previous snapshot retained.");
      process.exitCode = 1;
    });
