import test from "node:test";
import assert from "node:assert/strict";
import {
  currentOffers,
  validateCatalog,
  type CatalogSnapshot,
} from "../lib/catalog";
import fs from "node:fs";
test("offers require fresh official evidence and exclude expired, future, and unverified records", () => {
  const c = JSON.parse(
      fs.readFileSync("data/catalog.snapshot.json", "utf8"),
    ) as CatalogSnapshot,
    now = Date.now();
  const good = {
    id: "promo",
    toolId: c.items[0].id,
    title: "Conditional quota",
    status: "verified",
    sourceUrl: c.items[0].sourceUrl,
    lastVerified: new Date(now).toISOString(),
    eligibility: "Account conditions apply",
  };
  c.offers = [
    good,
    { ...good, id: "expired", expiresAt: new Date(now - 1).toISOString() },
    { ...good, id: "future", startsAt: new Date(now + 100000).toISOString() },
    {
      ...good,
      id: "stale",
      lastVerified: new Date(now - 37 * 3600000).toISOString(),
    },
    { ...good, id: "unverified", status: "unverified" },
    { ...good, id: "no-source", sourceUrl: undefined },
  ];
  assert.deepEqual(
    currentOffers(c, now).map((o) => o.id),
    ["promo"],
  );
  c.offers = [{ ...good, lastVerified: "bad" }];
  assert.throws(() => validateCatalog(c));
});
