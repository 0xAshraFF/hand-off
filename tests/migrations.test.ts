import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";

test("Postgres migration enforces source evidence, pricing constraints, read-only clients and offer expiry", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(fs.readFileSync("migrations/001_catalog.sql", "utf8"));
    const tables = await db.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname='public'",
    );
    assert.equal(tables.rows.length, 18);
    await db.exec(
      "insert into providers(id,name) values('test','Test'); insert into tools(id,provider_id,name,kind,status,source_url) values('test','test','Test','image','active','https://example.com'); insert into source_urls(url,source_type) values('https://example.com','official_pricing');",
    );
    await assert.rejects(
      db.exec(
        "insert into pricing(tool_id,pricing_type,currency,unit_cost,status) values('test','per_image','USD',-1,'unknown')",
      ),
    );
    await assert.rejects(
      db.exec(
        "insert into pricing(tool_id,pricing_type,currency,unit_cost,status) values('test','per_image','USD',1,'verified')",
      ),
    );
    await db.exec(
      "insert into pricing(tool_id,source_url_id,pricing_type,currency,unit_cost,status,verified_at,observed_at) values('test',1,'per_image','USD',1,'verified',now(),now()-interval '1 hour'),('test',1,'per_image','USD',2,'verified',now(),now());",
    );
    assert.equal(
      (
        await db.query<{ unit_cost: string }>(
          "select unit_cost from catalog_current_prices",
        )
      ).rows[0].unit_cost,
      "2.00000000",
    );
    await db.exec(
      "insert into offers(id,tool_id,title,status,source_url_id,verified_at,expires_at) values('expired','test','Expired','verified',1,now(),now()-interval '1 hour'),('live','test','Live','verified',1,now(),now()+interval '1 hour'),('unknown','test','Unknown','unverified',null,null,null);",
    );
    assert.deepEqual(
      (
        await db.query<{ id: string }>("select id from catalog_active_offers")
      ).rows.map((r) => r.id),
      ["live"],
    );
    await db.exec("set role anon");
    assert.equal(
      (await db.query("select * from catalog_public_items")).rows.length,
      1,
    );
    await assert.rejects(
      db.exec("insert into providers(id,name) values('forbidden','Forbidden')"),
    );
    await db.exec("reset role");
    await db.exec("set role service_role");
    await db.exec("insert into providers(id,name) values('ingest','Ingest')");
  } finally {
    await db.close();
  }
});

test("validated snapshot SQL imports actual facts twice without duplicating observations", async () => {
  const { catalogSql } = await import("../lib/catalog-sql");
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(fs.readFileSync("migrations/001_catalog.sql", "utf8"));
    const c = JSON.parse(fs.readFileSync("data/catalog.snapshot.json", "utf8"));
    const statement = catalogSql(c);
    await db.exec(statement);
    await db.exec(statement);
    assert.equal(
      (await db.query("select * from tools")).rows.length,
      c.items.length,
    );
    assert.equal(
      (await db.query("select * from pricing")).rows.length,
      c.items.length,
    );
    assert.equal(
      (await db.query("select * from source_checks")).rows.length,
      new Set((c.sourceChecks || []).map((r: unknown) => JSON.stringify(r)))
        .size,
    );
    assert.equal(
      (await db.query("select * from price_history")).rows.length,
      c.priceHistory.length,
    );
    assert.equal(
      (await db.query("select * from offer_history")).rows.length,
      c.offerHistory.filter((h: { offerId?: string }) => h.offerId).length,
    );
    assert.equal(
      (
        await db.query<{ details: { freeTier: { available: boolean } } }>(
          "select details from tools where id=$1",
          [c.items[0].id],
        )
      ).rows[0].details.freeTier.available,
      c.items[0].freeTier.available,
    );
    const malicious = structuredClone(c);
    malicious.items[0].name = "Quoted ' name; drop table tools; --";
    await db.exec(catalogSql(malicious));
    assert.equal(
      (await db.query("select * from tools")).rows.length,
      c.items.length,
    );
  } finally {
    await db.close();
  }
});

test("changed snapshots retire removed tools and reconcile capabilities and tags without losing history", async () => {
  const { catalogSql } = await import("../lib/catalog-sql");
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls;",
    );
    await db.exec(fs.readFileSync("migrations/001_catalog.sql", "utf8"));
    const c = JSON.parse(fs.readFileSync("data/catalog.snapshot.json", "utf8"));
    await db.exec(catalogSql(c));
    assert.equal(
      (await db.query("select * from free_tiers")).rows.length,
      c.items.filter((i: { freeTier?: unknown }) => i.freeTier).length,
    );
    assert.equal(
      (await db.query("select * from quality_evidence")).rows.length,
      c.items.length,
    );
    const old = c.items.at(-1);
    const changed = structuredClone(c);
    changed.items.pop();
    changed.items[0].tasks = ["image generation"];
    changed.items[0].tags = ["reconciled"];
    await db.exec(catalogSql(changed));
    assert.equal(
      (await db.query("select * from catalog_public_items")).rows.length,
      c.items.length - 1,
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from tools where id=$1",
          [old.id],
        )
      ).rows[0].status,
      "retired",
    );
    assert.equal(
      (
        await db.query("select * from tool_capabilities where tool_id=$1", [
          c.items[0].id,
        ])
      ).rows.length,
      1,
    );
    assert.deepEqual(
      (
        await db.query<{ tag: string }>(
          "select tag from catalog_tags where tool_id=$1",
          [c.items[0].id],
        )
      ).rows.map((r) => r.tag),
      ["reconciled"],
    );
    const failed = await db.query<{ check_kind: string }>(
      "select check_kind from source_checks where ok=false and parser_version='official-tables-v1'",
    );
    assert.ok(failed.rows.every((r) => r.check_kind === "price"));
    assert.equal(
      (await db.query("select * from price_history")).rows.length,
      c.priceHistory.length,
    );
  } finally {
    await db.close();
  }
});
