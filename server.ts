import express, { type Request, type Response } from "express";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { timingSafeEqual } from "node:crypto";
import dotenv from "dotenv";
import { loadCatalog, getCatalogStatus, currentOffers } from "./lib/catalog";
import {
  normalizeRequest,
  buildDraft,
  refineWithPlanner,
  finalizePlan,
  PlanError,
} from "./lib/planner";
dotenv.config({ quiet: true });

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use(
    "/api/handoff/export",
    express.urlencoded({ extended: false, limit: "256kb" }),
  );
  app.use((_req, _res, next) => {
    _res.setHeader("X-Content-Type-Options", "nosniff");
    _res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  const limits = new Map<string, { count: number; reset: number }>();
  app.use(["/api/plan", "/api/plan-v2"], (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of limits)
      if (value.reset <= now) limits.delete(key);
    const key = req.ip || "unknown";
    const entry = limits.get(key) || { count: 0, reset: now + 60000 };
    entry.count++;
    limits.set(key, entry);
    if (entry.count > 30) {
      res.setHeader("Retry-After", "60");
      res
        .status(429)
        .json({ error: "Too many planning requests. Try again in a minute." });
      return;
    }
    next();
  });
  const catalog = (res: Response) => {
    try {
      return loadCatalog();
    } catch {
      res.status(503).json({
        error:
          "Catalog temporarily unavailable. Try again after a source refresh.",
      });
      return null;
    }
  };
  app.get("/api/health", (_req, res) => {
    try {
      const c = loadCatalog();
      res.json({
        status: getCatalogStatus(c).status === "degraded" ? "degraded" : "ok",
        catalogStatus: getCatalogStatus(c).status,
        catalogVersion: c.version,
        catalogGeneratedAt: c.generatedAt,
        plannerConfigured: Boolean(
          (process.env.PLANNER_API_KEY || process.env.DEEPSEEK_API_KEY) &&
            process.env.PLANNER_MODEL &&
            (process.env.PLANNER_BASE_URL || process.env.DEEPSEEK_API_KEY),
        ),
      });
    } catch {
      res.status(503).json({ status: "degraded", catalogVersion: null });
    }
  });
  app.get("/api/catalog", (_req, res) => {
    const c = catalog(res);
    if (c) res.json(c);
  });
  app.get("/api/catalog/status", (_req, res) => {
    try {
      res.json(getCatalogStatus());
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.get("/api/catalog/search", (req, res) => {
    const c = catalog(res);
    if (!c) return;
    const q = String(req.query.q || "")
      .toLowerCase()
      .slice(0, 200);
    res.json({
      items: c.items.filter((i) =>
        (
          i.name +
          " " +
          i.provider +
          " " +
          i.tasks.join(" ") +
          " " +
          i.tags.join(" ")
        )
          .toLowerCase()
          .includes(q),
      ),
    });
  });
  app.get("/api/tools/:id", (req, res) => {
    const c = catalog(res);
    if (!c) return;
    const i = c.items.find((i) => i.id === req.params.id);
    if (i) res.json(i);
    else res.status(404).json({ error: "Tool not found." });
  });
  app.get("/api/prices/:id", (req, res) => {
    const c = catalog(res);
    if (!c) return;
    const i = c.items.find((i) => i.id === req.params.id);
    if (i)
      res.json({
        toolId: i.id,
        pricing: i.pricing,
        sourceUrl: i.sourceUrl,
        lastVerified: i.lastVerified,
      });
    else res.status(404).json({ error: "Tool not found." });
  });
  app.get("/api/offers", (_req, res) => {
    const c = catalog(res);
    if (!c) return;
    res.json({ offers: currentOffers(c), checkedAt: c.generatedAt });
  });
  const plan = async (req: Request, res: Response) => {
    try {
      const normalized = normalizeRequest(req.body);
      const c = loadCatalog();
      const draft = buildDraft(normalized, c);
      const refined =
        req.path === "/api/plan/preview"
          ? { tasks: draft, model: "deterministic router", used: false }
          : await refineWithPlanner(normalized, draft);
      const result = finalizePlan(
        normalized,
        c,
        refined.tasks,
        refined.model,
        refined.used,
      );
      if ("warning" in refined && typeof refined.warning === "string")
        result.warnings.push(refined.warning);
      const state = getCatalogStatus(c);
      if (state.warning) {
        result.warnings.push(state.warning);
        result.budgetStatus = "unconfirmed";
        result.summary =
          "Catalog cache degraded; confirm prices before spending.";
        result.handoff =
          result.handoff.replace(
            "budget status: within",
            "budget status: unconfirmed",
          ) +
          "\n- " +
          state.warning;
        result.costNote += " Catalog cache is degraded.";
      }
      res.json({ plan: result });
    } catch (e) {
      if (e instanceof PlanError)
        res.status(e.status).json({ error: e.message });
      else
        res.status(503).json({
          error:
            "Could not prepare a verified route. Check catalog status and try again.",
        });
    }
  };
  app.post("/api/handoff/export", (req, res) => {
    if (
      typeof req.body?.handoff !== "string" ||
      !req.body.handoff ||
      req.body.handoff.length > 24000
    ) {
      res
        .status(400)
        .json({ error: "Provide a Markdown handoff up to 24,000 characters." });
      return;
    }
    const name =
      String(req.body.name || "handoff")
        .slice(0, 120)
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "") || "handoff";
    res.setHeader("Cache-Control", "no-store");
    res
      .attachment(name + ".md")
      .type("text/markdown")
      .send(req.body.handoff);
  });
  app.post("/api/plan/preview", plan);
  app.post("/api/plan", plan);
  app.post("/api/plan-v2", plan);
  app.post("/api/plan/refine", plan);
  let refreshing = false;
  app.post("/api/catalog/refresh", async (req, res) => {
    const secret = process.env.CATALOG_ADMIN_TOKEN,
      provided = req.headers.authorization?.replace(/^Bearer /, "");
    if (
      !secret ||
      !provided ||
      Buffer.byteLength(secret) !== Buffer.byteLength(provided) ||
      !timingSafeEqual(Buffer.from(secret), Buffer.from(provided))
    ) {
      res
        .status(401)
        .json({ error: "Authorized catalog administrator required." });
      return;
    }
    if (refreshing) {
      res.status(409).json({ error: "Refresh already in progress." });
      return;
    }
    refreshing = true;
    try {
      const { refreshCatalog } = (await import(
        "./scripts/refresh-catalog"
      )) as unknown as { refreshCatalog: () => Promise<unknown> };
      await refreshCatalog();
      res.json({ status: "refreshed" });
    } catch {
      res
        .status(503)
        .json({ error: "Refresh failed; previous catalog retained." });
    } finally {
      refreshing = false;
    }
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });
  app.use(
    (
      err: unknown,
      _req: Request,
      res: Response,
      _next: express.NextFunction,
    ) => {
      const e = err as { type?: string };
      res.status(e.type === "entity.too.large" ? 413 : 400).json({
        error:
          e.type === "entity.too.large"
            ? "Request too large."
            : "Invalid JSON request.",
      });
    },
  );
  return app;
}
export async function startServer() {
  const app = createApp();
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }
  return app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
    console.log(
      "Handoff running on http://localhost:" + (process.env.PORT || 3000),
    ),
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  startServer().catch(() => {
    console.error("Handoff startup failed.");
    process.exitCode = 1;
  });
