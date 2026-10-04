import fs from "node:fs";
import path from "node:path";
export type Pricing = {
  type: string;
  currency: string;
  unitCost?: number;
  unit?: string;
  inputPer1M?: number;
  cachedInputPer1M?: number;
  outputPer1M?: number;
  subscriptionMonthly?: number;
  scope?: string;
  [key: string]: unknown;
};
export type CatalogItem = {
  id: string;
  name: string;
  provider: string;
  kind: string;
  status?: string;
  tasks: string[];
  pricing: Pricing;
  freeTier?: {
    available: boolean;
    note?: string;
    unconditional?: boolean;
    [key: string]: unknown;
  };
  access?: { api?: boolean; web?: boolean; local?: boolean };
  quality?: {
    status: string;
    note: string;
    sourceUrl?: string;
    [key: string]: unknown;
  };
  sourceUrl: string;
  lastVerified: string;
  tags: string[];
  hardware?: string;
  requiresGpu?: boolean;
  regions?: string[];
  pricingVerified?: boolean;
  [key: string]: unknown;
};
export type SourceCheck = {
  source: string;
  ok: boolean;
  checkedAt: string;
  note: string;
  itemId?: string;
  parserVersion?: string;
  priceVerified?: boolean;
  changeDetected?: boolean;
  [key: string]: unknown;
};
export type Offer = {
  id: string;
  toolId?: string;
  name?: string;
  title?: string;
  eligibility?: string | string[];
  limits?: string | string[];
  startsAt?: string;
  expiresAt?: string;
  lastVerified?: string;
  sourceUrl?: string;
  fallback?: string;
  [key: string]: unknown;
};
export type CatalogSnapshot = {
  version: number;
  generatedAt: string;
  policy: Record<string, unknown>;
  items: CatalogItem[];
  sourceChecks?: SourceCheck[];
  priceHistory?: unknown[];
  offerHistory?: unknown[];
  offers?: Offer[];
  [key: string]: unknown;
};
export function validateCatalog(value: unknown): CatalogSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Catalog must be an object.");
  const c = value as CatalogSnapshot;
  if (
    !Number.isInteger(c.version) ||
    c.version < 1 ||
    typeof c.generatedAt !== "string" ||
    !Number.isFinite(Date.parse(c.generatedAt)) ||
    !Array.isArray(c.items) ||
    !c.items.length ||
    !c.policy ||
    typeof c.policy !== "object"
  )
    throw new Error("Invalid catalog envelope.");
  if (
    c.sourceChecks !== undefined &&
    (!Array.isArray(c.sourceChecks) ||
      c.sourceChecks.some(
        (ch) =>
          !ch ||
          typeof ch.source !== "string" ||
          new URL(ch.source).protocol !== "https:" ||
          typeof ch.ok !== "boolean" ||
          typeof ch.note !== "string" ||
          !Number.isFinite(Date.parse(ch.checkedAt)),
      ))
  )
    throw new Error("Invalid source checks.");
  const ids = new Set<string>();
  for (const i of c.items) {
    if (
      !i ||
      typeof i !== "object" ||
      typeof i.id !== "string" ||
      !/^[a-z0-9][a-z0-9._-]{0,99}$/.test(i.id) ||
      ids.has(i.id)
    )
      throw new Error("Catalog IDs must be unique and safe.");
    ids.add(i.id);
    for (const key of [
      "name",
      "provider",
      "kind",
      "sourceUrl",
      "lastVerified",
    ] as const)
      if (typeof i[key] !== "string" || !i[key])
        throw new Error("Catalog item missing " + key);
    if (new URL(i.sourceUrl).protocol !== "https:")
      throw new Error("Catalog source must use HTTPS.");
    if (
      !Array.isArray(i.tasks) ||
      !i.tasks.length ||
      i.tasks.some((t) => typeof t !== "string") ||
      !Array.isArray(i.tags) ||
      i.tags.some((t) => typeof t !== "string")
    )
      throw new Error("Invalid catalog capabilities.");
    if (
      !i.pricing ||
      typeof i.pricing.type !== "string" ||
      typeof i.pricing.currency !== "string"
    )
      throw new Error("Missing normalized pricing.");
    for (const [key, v] of Object.entries(i.pricing))
      if (
        [
          "unitCost",
          "inputPer1M",
          "cachedInputPer1M",
          "outputPer1M",
          "subscriptionMonthly",
          "perSecond",
          "perMinute",
          "perCredit",
        ].includes(key) &&
        (typeof v !== "number" || !Number.isFinite(v) || v < 0)
      )
        throw new Error("Invalid catalog rate.");
    if (!Number.isFinite(Date.parse(i.lastVerified)))
      throw new Error("Invalid verification date.");
    if (i.access && Object.values(i.access).some((v) => typeof v !== "boolean"))
      throw new Error("Invalid access flags.");
    if (
      i.regions &&
      (!Array.isArray(i.regions) ||
        i.regions.some((v) => typeof v !== "string"))
    )
      throw new Error("Invalid region constraints.");
  }
  if (c.offers !== undefined && !Array.isArray(c.offers))
    throw new Error("Invalid offers.");
  for (const o of c.offers || []) {
    if (
      !o ||
      typeof o.id !== "string" ||
      !o.id ||
      (o.toolId && !ids.has(o.toolId))
    )
      throw new Error("Invalid offer reference.");
    for (const key of ["startsAt", "expiresAt", "lastVerified"] as const)
      if (o[key] && !Number.isFinite(Date.parse(o[key]!)))
        throw new Error("Invalid offer date.");
    if (o.sourceUrl && new URL(o.sourceUrl).protocol !== "https:")
      throw new Error("Invalid offer source.");
  }
  return c;
}
let cache:
  | { catalog: CatalogSnapshot; file: string; mtime: number; size: number }
  | undefined;
let failure: string | undefined;
export function clearCatalogCache() {
  cache = undefined;
  failure = undefined;
}
export function loadCatalog(root = process.cwd()): CatalogSnapshot {
  for (const file of [
    path.join(root, "data", "catalog.snapshot.json"),
    path.join(root, "dist", "data", "catalog.snapshot.json"),
  ]) {
    if (!fs.existsSync(file)) continue;
    try {
      const stat = fs.statSync(file);
      if (
        cache?.file === file &&
        cache.mtime === stat.mtimeMs &&
        cache.size === stat.size
      )
        return cache.catalog;
      const catalog = validateCatalog(
        JSON.parse(fs.readFileSync(file, "utf8")),
      );
      cache = { catalog, file, mtime: stat.mtimeMs, size: stat.size };
      failure = undefined;
      return catalog;
    } catch {
      failure = "Catalog snapshot invalid; previous validated cache retained.";
    }
  }
  if (cache) return cache.catalog;
  throw new Error("Catalog unavailable; no validated snapshot exists.");
}
export function isStale(
  item: CatalogItem,
  catalog?: CatalogSnapshot,
  now = Date.now(),
) {
  const d = Date.parse(item.lastVerified);
  return (
    !Number.isFinite(d) ||
    d > now + 60000 ||
    now - d > Number(catalog?.policy?.volatileMaxAgeHours || 36) * 3600000
  );
}
export function getCatalogStatus(catalog = loadCatalog()) {
  const checks = [
    ...new Map((catalog.sourceChecks || []).map((c) => [c.source, c])).values(),
  ];
  return {
    status: failure
      ? "degraded"
      : catalog.items.some(
            (i) => isStale(i, catalog) || i.pricingVerified === false,
          )
        ? "stale"
        : "ok",
    version: catalog.version,
    generatedAt: catalog.generatedAt,
    itemCount: catalog.items.length,
    staleCount: catalog.items.filter(
      (i) => isStale(i, catalog) || i.pricingVerified === false,
    ).length,
    failedSources: checks.filter((c) => !c.ok).length,
    lastRefresh: catalog.policy.lastRefreshResult || null,
    warning: failure || null,
  };
}

export function currentOffers(c: CatalogSnapshot, now = Date.now()) {
  return (c.offers || []).filter(
    (o) =>
      o.status === "verified" &&
      o.sourceUrl &&
      o.lastVerified &&
      Date.parse(o.lastVerified) <= now + 60000 &&
      now - Date.parse(o.lastVerified) <=
        Number(c.policy.volatileMaxAgeHours || 36) * 3600000 &&
      (!o.startsAt || Date.parse(o.startsAt) <= now) &&
      (!o.expiresAt || Date.parse(o.expiresAt) > now),
  );
}
