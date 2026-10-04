import fs from "node:fs";
import type { CatalogSnapshot } from "../lib/catalog";
/** Controlled unit-test rates, independent of daily production price observations. */
export function catalogFixture(): CatalogSnapshot {
  const c = JSON.parse(
    fs.readFileSync("data/catalog.snapshot.json", "utf8"),
  ) as CatalogSnapshot;
  const rates: Record<string, object> = {
    "qwen-image-2-0": { type: "per_image", currency: "USD", unitCost: 0.035 },
    "gemini-3-1-flash-image": {
      type: "per_image",
      currency: "USD",
      unitCost: 0.067,
      inputPer1M: 0.5,
    },
    "deepseek-flash": {
      type: "token",
      currency: "USD",
      inputPer1M: 0.3,
      outputPer1M: 1.2,
    },
    "deepseek-v4-pro": {
      type: "token",
      currency: "USD",
      inputPer1M: 1.32,
      outputPer1M: 3.96,
    },
  };
  for (const i of c.items) {
    i.lastVerified = new Date().toISOString();
    if (rates[i.id]) {
      i.pricing = { ...i.pricing, ...rates[i.id] };
      i.pricingVerified = true;
    }
  }
  return c;
}
