import { createHash } from "node:crypto";
import { validateCatalog, type CatalogSnapshot } from "./catalog";
const literal = (value: unknown) =>
  value === null || value === undefined
    ? "null"
    : typeof value === "boolean"
      ? String(value)
      : typeof value === "number"
        ? String(value)
        : "'" +
          String(value).replaceAll("'", "''").replaceAll("\u0000", "") +
          "'";
const json = (value: unknown) =>
  literal(JSON.stringify(value ?? {})) + "::jsonb";
const key = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
/** Bootstrap/update a Supabase catalog from validated facts. No credentials in generated SQL. */
export function catalogSql(snapshot: CatalogSnapshot) {
  const c = validateCatalog(snapshot),
    sql = ["begin;"];
  sql.push(
    `update public.tools set status='retired' where id not in (${c.items.map((i) => literal(i.id)).join(",")});`,
  );
  sql.push(
    `delete from public.tool_capabilities where tool_id in (${c.items.map((i) => literal(i.id)).join(",")});`,
    `delete from public.catalog_tags where tool_id in (${c.items.map((i) => literal(i.id)).join(",")});`,
  );
  sql.push(
    `update public.offers set status='removed' where id not in (${(
      c.offers || []
    )
      .map((o) => literal(o.id))
      .concat("''")
      .join(",")});`,
  );
  sql.push("update public.model_routes set status='retired';");
  const sources = new Set([
    ...c.items.map((i) => i.sourceUrl),
    ...(c.sourceChecks || []).map((ch) => ch.source),
    ...(c.offers || []).flatMap((o) => (o.sourceUrl ? [o.sourceUrl] : [])),
  ]);
  for (const source of sources) {
    if (new URL(source).protocol !== "https:")
      throw new Error("Unsafe history source.");
    sql.push(
      `insert into public.source_urls(url,source_type) values(${literal(source)},'official_docs') on conflict(url) do nothing;`,
    );
  }
  const sourceId = (url: unknown) =>
    url
      ? `(select id from public.source_urls where url=${literal(url)})`
      : "null";
  for (const i of c.items) {
    const provider = "provider-" + key(i.provider).slice(0, 24);
    sql.push(
      `insert into public.providers(id,name) values(${literal(provider)},${literal(i.provider)}) on conflict(id) do update set name=excluded.name;`,
    );
    sql.push(
      `insert into public.tools(id,provider_id,name,kind,status,source_url,hardware,access,details) values(${literal(i.id)},${literal(provider)},${literal(i.name)},${literal(i.kind)},${literal(i.status || "active")},${literal(i.sourceUrl)},${literal(i.hardware)},${json(i.access)},${json(i)}) on conflict(id) do update set name=excluded.name,status=excluded.status,source_url=excluded.source_url,hardware=excluded.hardware,access=excluded.access,details=excluded.details;`,
    );
    for (const capability of i.tasks) {
      sql.push(
        `insert into public.capabilities(id,label) values(${literal(capability)},${literal(capability)}) on conflict(id) do nothing;`,
        `insert into public.tool_capabilities(tool_id,capability_id,supported,evidence_url) values(${literal(i.id)},${literal(capability)},true,${literal(i.sourceUrl)}) on conflict(tool_id,capability_id) do update set supported=true,evidence_url=excluded.evidence_url;`,
      );
    }
    for (const tag of i.tags)
      sql.push(
        `insert into public.catalog_tags(tool_id,tag) values(${literal(i.id)},${literal(tag)}) on conflict do nothing;`,
      );
    const p = i.pricing,
      status =
        i.pricingVerified === true
          ? "verified"
          : p.type === "unknown"
            ? "unknown"
            : "estimated";
    sql.push(
      `insert into public.pricing(tool_id,source_url_id,pricing_type,currency,scope,unit,unit_cost,input_per_1m,cached_input_per_1m,output_per_1m,status,verified_at,observed_at,details,observation_key) values(${literal(i.id)},${sourceId(i.sourceUrl)},${literal(p.type)},${literal(p.currency)},${literal(p.scope || "")},${literal(p.unit)},${literal(p.unitCost)},${literal(p.inputPer1M)},${literal(p.cachedInputPer1M)},${literal(p.outputPer1M)},${literal(status)},${literal(i.lastVerified)},${literal(c.generatedAt)},${json(p)},${literal(key({ id: i.id, pricing: p, at: c.generatedAt }))}) on conflict(observation_key) do nothing;`,
    );
  }
  for (const i of c.items) {
    const p = i.pricing;
    if (i.freeTier)
      sql.push(
        `insert into public.free_tiers(tool_id,source_url_id,available,unconditional,eligibility,quota,verified_at,observation_key) values(${literal(i.id)},${sourceId(i.sourceUrl)},${literal(i.freeTier.available)},${literal(i.freeTier.unconditional || false)},${literal(i.freeTier.note)},${json(i.freeTier.quota)},${literal(i.lastVerified)},${literal("tier:" + i.id)}) on conflict(observation_key) do update set available=excluded.available,unconditional=excluded.unconditional,eligibility=excluded.eligibility,quota=excluded.quota,verified_at=excluded.verified_at;`,
      );
    if (p.type.includes("subscription") || i.tags.includes("owned-tool"))
      sql.push(
        `insert into public.subscriptions(tool_id,name,source_url_id,monthly_usd,access_mode,includes_api_credits,limits,verified_at,observation_key) values(${literal(i.id)},${literal(i.name)},${sourceId(i.sourceUrl)},${literal(p.subscriptionMonthly)},'web',false,${json({ pricing: p, freeTier: i.freeTier })},${literal(i.lastVerified)},${literal("subscription:" + i.id)}) on conflict(observation_key) do update set monthly_usd=excluded.monthly_usd,limits=excluded.limits,verified_at=excluded.verified_at;`,
      );
    if (["llm", "image"].includes(i.kind)) {
      sql.push(
        `insert into public.models(id,tool_id,provider_model_id,metadata) values(${literal(i.id)},${literal(i.id)},${literal(i.modelId)},${json(i)}) on conflict(id) do update set provider_model_id=excluded.provider_model_id,metadata=excluded.metadata;`,
      );
      const regions = i.regions?.length ? i.regions : [null];
      for (const region of regions) {
        if (region)
          sql.push(
            `insert into public.regions(id,label) values(${literal(region)},${literal(region)}) on conflict do nothing;`,
          );
        sql.push(
          `insert into public.model_routes(model_id,provider_id,route_name,api_model_id,region_id,access_mode,status,source_url_id) values(${literal(i.id)},${literal("provider-" + key(i.provider).slice(0, 24))},'catalog',${literal(i.modelId)},${literal(region)},${literal(p.accessMode || (i.access?.local ? "local" : i.access?.api ? "api" : "web"))},${literal(i.status || "active")},${sourceId(i.sourceUrl)}) on conflict(model_id,provider_id,route_name,region_id) do update set api_model_id=excluded.api_model_id,access_mode=excluded.access_mode,status=excluded.status;`,
        );
      }
    }
    if (i.quality)
      sql.push(
        `insert into public.quality_evidence(tool_id,evidence_type,source_url_id,summary,observation_key) values(${literal(i.id)},${literal(i.quality.status)},${sourceId(i.quality.sourceUrl || i.sourceUrl)},${literal(i.quality.note)},${literal("quality:" + i.id)}) on conflict(observation_key) do update set evidence_type=excluded.evidence_type,summary=excluded.summary;`,
      );
  }
  for (const check of c.sourceChecks || []) {
    sql.push(
      `insert into public.source_checks(source_url_id,tool_id,check_kind,checked_at,ok,price_verified,change_detected,parser_version,note,observation_key) values(${sourceId(check.source)},${literal(check.itemId)},${literal(check.priceVerified || (check.parserVersion && check.parserVersion !== "reachability-v1") ? "price" : "reachability")},${literal(check.checkedAt)},${literal(check.ok)},${literal(check.priceVerified || false)},${literal(check.changeDetected)},${literal(check.parserVersion)},${literal(check.note)},${literal(key(check))}) on conflict(observation_key) do nothing;`,
    );
  }
  for (const value of c.priceHistory || []) {
    const h = value as Record<string, unknown>;
    sql.push(
      `insert into public.price_history(tool_id,source_url_id,observed_at,changed,previous_price,observed_price,parser_version,observation_key) values(${literal(h.itemId)},${sourceId(h.source)},${literal(h.detectedAt)},${literal(h.changed ?? true)},${json(h.oldValue)},${json(h.newValue)},${literal(h.parserVersion)},${literal(key(h))}) on conflict(observation_key) do nothing;`,
    );
  }
  for (const o of c.offers || []) {
    if (!o.toolId) continue;
    sql.push(
      `insert into public.offers(id,tool_id,source_url_id,title,eligibility,limits,starts_at,expires_at,status,verified_at,details) values(${literal(o.id)},${literal(o.toolId)},${sourceId(o.sourceUrl)},${literal(o.title || o.name || o.id)},${literal(o.eligibility)},${literal(o.limits)},${literal(o.startsAt)},${literal(o.expiresAt)},${literal(o.status || "unverified")},${literal(o.lastVerified)},${json(o)}) on conflict(id) do update set status=excluded.status,verified_at=excluded.verified_at,expires_at=excluded.expires_at,details=excluded.details;`,
    );
  }
  for (const value of c.offerHistory || []) {
    const h = value as Record<string, unknown>;
    if (!h.offerId) continue;
    sql.push(
      `insert into public.offer_history(offer_id,source_url_id,observed_at,changed,previous_offer,observed_offer,event,observation_key) values(${literal(h.offerId)},${sourceId(h.source)},${literal(h.detectedAt)},${literal(h.changed ?? true)},${json(h.oldValue)},${json(h.newValue)},${literal(h.event || "observed")},${literal(key(h))}) on conflict(observation_key) do nothing;`,
    );
  }
  return sql.concat("commit;").join("\n") + "\n";
}
