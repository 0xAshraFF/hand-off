# HANDOFF — Build it / Launch it: launch + marketing for Handoff

Goal: Handoff already turns an idea into a build plan. Extend it so people actually **ship and get customers**: one visit produces a handoff that covers build → launch → marketing, and people with an existing repo get a launch + marketing handoff generated from their real code.

Audience: vibe coders who build but never launch. The product must remove decisions, not add reading.

Status of this document: decisions are final unless marked **OPEN**. Facts marked **VERIFY** were not confirmed from an official source while writing this; confirm them before they reach users.

---

## 1. Decisions already made

1. **Packaged plan, not autopilot.** Handoff produces an agent-ready plan plus a small set of live checks. It does **not** deploy on the user's behalf, hold hosting tokens, buy domains through an API, or post to communities.
   - Reason: cheap to run, nothing to break when a provider changes its API, no money or credentials handled, and coding agents (Claude Code, Cursor, Codex) can already run deploy CLIs.
2. **Two entry points on the home page.**
   - **Build it** — "I have an idea" → existing planner → one handoff covering build + launch + marketing.
   - **Launch it** — "I have a repo" → repo scan → launch + marketing handoff.
   - Plus a small link inside Launch it: **"Already live? Get customers →"** (marketing-only handoff).
3. **One visit, no return trip.** The Build handoff includes launch and marketing from the start. The user should never have to come back for "part 2". Coming back to check "Is it live?" is optional.
4. **Deploy on day 1.** In the Build handoff, the agent deploys a skeleton to the real domain before building features. Every later push auto-deploys, so launching is never a separate scary step at the end.
5. **Human steps vs agent steps are separated.** Every launch handoff starts with what only the human can do (buy domain, create hosting account, approve GitHub access — about 15–30 min) and ends with what only the human should do (post, reply to people). Everything else is for the agent.
6. **Cache the strategy, generate the words.** Playbooks are cached data with `lastVerified` dates. An LLM writes only product-specific text (positioning, posts, outreach). Same contract as the existing catalog: the LLM is never the source of prices, rules, URLs, or channel facts.
7. **Writer model quality over cost.** Owner accepts about **$29 per 1,000 handoffs** for better writing (see §8).

---

## 2. Current codebase (read before changing)

- `server.ts` — Express API + Vite middleware in dev, static `dist/` in prod. Holds the deterministic router (`buildDraft`), optional LLM refinement (`maybeRefineWithPlanner`, OpenAI-compatible, `PLANNER_*` / `DEEPSEEK_API_KEY` env), and `finalizePlan` which builds the handoff Markdown. Endpoint: `POST /api/plan-v2`.
- `src/App.tsx` — whole V2 frontend in one dense file: `HomeView`, `ExploreView`, `PlanView`, `Header`, `FilterModal`. Views switch via `useState<View>`; no router.
- `src/index.css` — design tokens on `:root` and `:root[data-theme='light']`; reuse them. Breakpoints at 1100px and 760px.
- `data/catalog.snapshot.json` — catalog with `version`, `generatedAt`, `policy`, `items[]`, `sourceUrl`, `lastVerified`. Build script copies it to `dist/data/`.
- `scripts/refresh-catalog.ts` + `.github/workflows/catalog-refresh.yml` — nightly source checks; preserves last known value on failure.
- `.github/workflows/ci.yml` — `bun run lint` (tsc) + `bun run build`. No test runner yet.
- `src/components/*` — V1 components; **not imported by the V2 app**. Don't build on them. Don't delete them in this task.
- The home page has a non-functional `.mode-switch` ("Create content" / "Build a tool or app"). Replace it with the Build it / Launch it fork.

Keep the existing style: compact code, provider-neutral, works with **no API key**.

---

## 3. What to cache vs. not cache

### 3.1 Cache — `data/launch.snapshot.json` (same shape idea as the catalog)

```jsonc
{
  "version": 1,
  "generatedAt": "ISO date",
  "policy": { "staleAfterDays": 90, "note": "Playbooks are source data. The writer model must not invent rules, prices or URLs." },
  "hosting": [ /* HostingPlaybook */ ],
  "addons": [ /* e.g. database */ ],
  "registrars": [ /* Registrar */ ],
  "checklist": [ /* ChecklistItem */ ],
  "audiences": [ /* AudiencePlaybook */ ],
  "channels": [ /* Channel */ ],
  "timeline": [ /* TimelineStep */ ]
}
```

Update the build script to copy this file to `dist/data/` alongside the catalog, and load it with the same fallback logic as `loadCatalog()`.

Every record carries: `id`, `sourceUrl` (official), `lastVerified`, `evidence: 'tested' | 'reviewed' | 'not-tested'`. Records older than `staleAfterDays` are shown with a "re-check" label in the UI and the handoff.

#### Shared types — put in `shared/launch.ts`, import from server and frontend

```ts
type HostId = 'cloudflare-pages' | 'netlify' | 'vercel' | 'render' | 'railway' | 'fly';

type HostingPlaybook = {
  id: string;                       // 'vite-spa__cloudflare-pages'
  stack: StackId;                   // see §4
  host: HostId;
  isDefault: boolean;               // default host for this stack
  alternatives: HostId[];
  why: string;                      // one line shown to user
  commercialUse: 'allowed' | 'paid-plan-required' | 'check-terms';
  freeTierNote: string;             // human text, VERIFY values
  build: { install?: string; build?: string; output?: string; start?: string };
  configFiles: Array<{ path: string; template: string }>;   // e.g. render.yaml
  envNotes: string[];               // e.g. 'Bind to 0.0.0.0 and read PORT'
  dns: { apex: DnsRecord[]; www: DnsRecord[]; note: string };
  agentCommands: string[];          // CLI the agent runs, e.g. 'npx wrangler pages deploy dist'
  humanSteps: string[];             // account creation, GitHub app approval
  gotchas: string[];
  sourceUrl: string; lastVerified: string; evidence: Evidence;
};

type Registrar = {
  id: 'cloudflare' | 'porkbun' | 'namecheap';
  name: string;
  searchUrl: string;                // template with {domain}
  why: string;
  indicativeComPrice?: { usd: number; checkedAt: string };  // never shown as final
  dnsHelpUrl: string;
  sourceUrl: string; lastVerified: string;
};

type ChecklistItem = {
  id: string; title: string; owner: 'agent' | 'human';
  appliesTo: { pricing?: 'free' | 'paid'; stacks?: StackId[] };
  agentInstruction: string;
};

type AudienceId = 'developer-tools' | 'b2b-saas' | 'consumer-productivity' | 'creator-tools' | 'shops-local' | 'ai-tools';

type AudiencePlaybook = {
  id: AudienceId; label: string;
  whereTheyAre: string;
  channelOrder: string[];           // Channel ids, in launch order
  firstTenCustomers: string;        // concrete tactic
  measure: string[];                // 1–3 metrics
  avoid: string[];
  sourceUrl?: string; lastVerified: string; evidence: Evidence;
};

type Channel = {
  id: string; name: string; url: string;
  audiences: AudienceId[];
  cost: 'free' | 'paid' | 'freemium';
  rules: string[];                  // self-promo rules, posting days, etc. VERIFY each
  limits: { title?: number; body?: number; tagline?: number };  // characters
  postUrlTemplate?: string;         // prefilled share/submit URL, VERIFY
  sourceUrl: string; lastVerified: string; evidence: Evidence;
};

type TimelineStep = { day: number; owner: 'agent' | 'human'; title: string; detail: string; channelIds?: string[] };
```

#### Seed content (write these records; VERIFY every fact before shipping)

**Hosting playbooks (8):**

| Stack | Default host | Alternatives | Key notes |
|---|---|---|---|
| `static-html` | Cloudflare Pages | Netlify | No build step |
| `vite-spa` (React/Vue/Svelte SPA, CRA, Angular) | Cloudflare Pages | Netlify, Vercel | SPA fallback so page refresh doesn't 404 (VERIFY per host) |
| `nextjs` | Vercel | Netlify, Cloudflare | **Vercel Hobby is personal/non-commercial only; Pro required once the app makes money** (confirmed from vercel.com/terms, 2026-10-04) |
| `ssr-meta` (Astro SSR, SvelteKit, Nuxt, Remix/React Router) | Cloudflare Pages | Netlify, Vercel | Needs the host's adapter; Astro without SSR adapter → treat as `vite-spa`-like static |
| `node-server` (Express/Fastify/Hono/Nest, incl. Vite+Express like Handoff itself) | Render | Railway, Fly | Bind `0.0.0.0`, read `PORT`; free tiers may sleep (VERIFY); Render's Deploy button requires `render.yaml` (confirmed) — generate it |
| `python-server` (FastAPI/Flask/Django) | Render | Railway, Fly | Start command via `uvicorn`/`gunicorn` |
| `docker` | Fly | Railway, Render | Use the repo's Dockerfile |
| addon `database` (Supabase/Postgres detected) | Supabase step | Neon | Env vars, migrations, never commit keys |

**Registrars (3):** Cloudflare (at-cost pricing), Porkbun, Namecheap.
- Porkbun search: `https://porkbun.com/checkout/search?q={domain}` (seen in third-party code — VERIFY)
- Namecheap search: `https://www.namecheap.com/domains/registration/results/?domain={domain}` (VERIFY)
- Cloudflare: dashboard deep link format `https://dash.cloudflare.com/?to=/:account/...` exists; exact registrar path VERIFY

**Checklist (same for everyone, owner `agent` unless noted):** title + meta description, Open Graph/Twitter image, favicon, privacy-friendly analytics, privacy + terms pages, 404 page, contact email, signup/waitlist capture, payments step (Stripe or Lemon Squeezy) only when `pricing = paid`, uptime check, README "Live at" link. Human: create hosting account, buy domain, approve GitHub app.

**Audience playbooks (6):** `developer-tools`, `b2b-saas`, `consumer-productivity`, `creator-tools`, `shops-local`, `ai-tools`. Example direction (VERIFY and refine): dev tools → Show HN, DevHunt, relevant subreddits, dev.to; B2B → LinkedIn + 20 targeted cold DMs, niche communities; consumer → short demo videos (TikTok/Shorts), niche subreddits; shops/local → Google Business Profile, local groups.

**Channel seed candidates (all `evidence: 'not-tested'` until checked):** Show HN, Product Hunt, Indie Hackers, r/SideProject, r/webdev (strict self-promo rules — VERIFY), r/SaaS, r/startups, r/alphaandbetausers, BetaList, Peerlist Launchpad, Uneed, Microlaunch, DevHunt, dev.to, X, LinkedIn, TikTok / YouTube Shorts, Google Business Profile.
Prefilled post URLs to VERIFY: HN `https://news.ycombinator.com/submitlink?u={url}&t={title}`, X intent `https://x.com/intent/post?text={text}`, Reddit `https://www.reddit.com/r/{sub}/submit?title={title}&url={url}`, LinkedIn `https://www.linkedin.com/sharing/share-offsite/?url={url}`.
**Do not include a channel whose URL, rules, or cost you could not confirm.**

**Timeline skeleton:** Day −7 (domain + skeleton live, waitlist on), Day −3 (launch kit ready, screenshots), Day 0 (main launch channel per audience), Days 1–3 (secondary channels, reply to every comment), Day 7 (first-10-customers outreach), Day 14 (review metrics, decide next channel).

### 3.2 Do not cache — live or generated every time

| Item | How |
|---|---|
| Repo scan (stack, scripts, env vars) | Live from GitHub. Short-lived cache only for rate limits: key `owner/repo@commitSha`, TTL 24h |
| Domain availability | Always live (RDAP). Never cache |
| Final domain price | Link to the registrar checkout; cached price is "indicative, checked <date>" |
| Positioning: who it's for, one-liner, problem | From user answers + README, generated |
| All post text, outreach messages | Generated per product, within cached channel limits/rules. Identical template text across users is a spam signal |
| Niche channel picks (e.g. a hobby subreddit) | Writer model may suggest; always shown as "unverified — check the rules" |
| "Is it live?" | Always live |

---

## 4. Repo scan — `POST /api/launch/scan`

Input `{ repoUrl }`. Accept only `https://github.com/{owner}/{repo}` (optional `.git`, `/tree/{branch}`). Validate owner `^[A-Za-z0-9-]{1,39}$`, repo `^[A-Za-z0-9._-]{1,100}$`. Fetch **only** from `api.github.com` / `raw.githubusercontent.com`.

Reads: repo metadata (description, default branch, homepage, topics, private flag, latest commit SHA), root file listing, `package.json`, README, `.env.example` / `.env.sample`, `requirements.txt` / `pyproject.toml`, presence of `Dockerfile`, `vercel.json`, `netlify.toml`, `render.yaml`, `wrangler.toml`/`wrangler.jsonc`, lockfiles, `LICENSE`.

Use `GITHUB_TOKEN` env when set. Without it GitHub allows 60 requests/hour **per server IP shared by all users** (~12 scans/hour) — the README and `/api/health` must say so.

Output:

```ts
type ScanResult = {
  repo: { owner: string; name: string; description?: string; defaultBranch: string; sha: string; homepage?: string; topics: string[] };
  stack: { id: StackId; label: string; confidence: 'high' | 'medium' | 'low'; signals: string[] };
  build: { packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'; install?: string; build?: string; output?: string; start?: string };
  envVars: string[];              // names only, from .env.example — never values
  addons: Array<'database'>;
  readiness: Array<{ id: string; ok: boolean; note: string }>;  // has README, build script, env example, license...
  warnings: string[];             // monorepo, no package.json, private repo, etc.
  readmeExcerpt: string;          // first ~2,000 chars, for the writer
};
```

Put detection in a **pure function** `detectStack(files, pkg, extras)` in `shared/` or `server/launch/` so it's unit-testable without network.

Detection order (first match wins): `next` → `nextjs`; `nuxt` / `@sveltejs/kit` / `@remix-run/*` / `@react-router/dev` / `astro` + SSR adapter → `ssr-meta`; server lib (`express`, `fastify`, `koa`, `hono`, `@nestjs/core`) **with** a `start` script or server entry → `node-server`; `vite` / `react-scripts` / `@angular/core` / `@vue/cli-service` / `astro` (static) / `gatsby` → `vite-spa`; Python framework in requirements → `python-server`; `Dockerfile` → `docker`; root `index.html` and no `package.json` → `static-html`; else `unknown` with a clear warning. Monorepo (workspaces, `apps/`, `packages/`) → warning + ask for subdirectory.

Errors to handle with plain-English messages: repo not found or private (suggest making it public or setting `GITHUB_TOKEN`), rate limited (say when it resets), empty repo.

---

## 5. Domain — `POST /api/launch/domains`

- "Have a domain?" **Yes** → validate hostname, store it, skip to DNS instructions for the chosen host.
- **No** → generate 6–10 candidates from the project name (`name.com`, `getname.com`, `name.app`, `name.dev`, `nameapp.com`, `tryname.com`…), check availability live, show registrar buttons with the domain prefilled, then an **"I bought it"** button that switches to the "have one" path.

Availability via RDAP:
1. Load IANA bootstrap `https://data.iana.org/rdap/dns.json` (cache 24h).
2. Query the **authoritative** server for the TLD: `{base}domain/{name}`.
3. 404 → "likely available"; 200 → "taken"; TLD not in bootstrap, timeout or other status → "unknown — check at registrar".
4. Do **not** treat a 404 from `rdap.org` as "available" — it also returns 404 when it doesn't know the TLD.
5. Label results "likely available" — premium/reserved names exist; the registrar checkout is the final word.

---

## 6. Launch handoff assembly — `POST /api/launch/plan`

Input:

```ts
type LaunchRequest = {
  source: { type: 'repo'; repoUrl: string } | { type: 'plan'; goal: string; stack: StackId } | { type: 'live'; url: string };
  domain: { has: true; name: string } | { has: false; chosen?: string };
  hosting: { has: true; host: HostId } | { has: false };
  audience: AudienceId | 'not-sure';      // not-sure → infer from README/goal, show the guess for confirmation
  pricing: 'free' | 'paid';
};
```

Deterministic assembler (works with no API key):
1. Pick hosting playbook: user's host if they have one and it supports the stack; else the stack's default. If `pricing = paid` and host `commercialUse !== 'allowed'`, add the upgrade note (e.g. Vercel Pro) or pick the alternative.
2. Pick registrar + DNS steps for `{registrar → host}`.
3. Filter checklist by pricing/stack.
4. Pick audience playbook and its channels; drop channels that are stale or failed the nightly link check.
5. Fill timeline.
6. Call the writer (§7) for product-specific words; if no key or the call fails, fill templates from README/goal.
7. Render Markdown (§9) and return structured JSON too (for the UI).

Caching: key `hash(repo@sha + answers)`, TTL 7 days, in-memory LRU. Repeat requests return the cached kit for free. Regenerate: max 3/day per key; support regenerating **one** post instead of the whole kit.

---

## 7. Writer model (LLM)

Role: **writer only.** It receives product facts + the chosen audience playbook + chosen channels with their limits and rules. It returns JSON:

```ts
{
  positioning: { oneLiner: string; problem: string; audience: string };
  posts: Array<{ channelId: string; title?: string; body: string }>;
  outreach: { message: string; whoToContact: string };
  nicheChannels: Array<{ name: string; url?: string; reason: string }>;  // always marked unverified
}
```

Server-side validation:
- `channelId` must be one of the supplied channels; drop anything else.
- Enforce `limits` (title/body/tagline). Over the limit → one retry for that post, then template fallback.
- No invented facts: no user counts, revenue, testimonials, awards, or features not in the README/goal. Say this in the prompt and reject posts containing numbers that aren't in the input where feasible.
- Only URLs allowed in posts: the user's domain/live URL and repo URL.
- `nicheChannels` are rendered under "Unverified — check each community's rules before posting".

Config (OpenAI-compatible, same pattern as the planner):
- `WRITER_API_KEY`, `WRITER_BASE_URL`, `WRITER_MODEL`; fall back to `PLANNER_*`, then `DEEPSEEK_API_KEY`.
- **OPEN:** owner mentioned GLM 5.2. The catalog currently lists **GLM 5.3** (`glm-5-3`, Z.ai) with **no numeric price**. Confirm the exact model id, base URL and per-token price from Z.ai's docs, add the price to the catalog refresh adapter, and only then make it the default. Until then default to DeepSeek V4 Pro (priced in the catalog).

---

## 8. Cost envelope and guards

Using catalog prices (checked 2026-10-04), with ~10k input + ~4k output tokens per kit:

| Writer model | Per handoff | Per 1,000 |
|---|---|---|
| DeepSeek V4 Pro ($1.32 in / $3.96 out per 1M) | ~$0.03 | ~$29 ← owner-approved budget |
| DeepSeek V4.1 Flash ($0.30 / $1.20) | ~$0.008 | ~$8 |
| GLM 5.3 | unknown — not in catalog | — |

Everything else is $0: cached JSON, GitHub API with a token, RDAP, DNS-over-HTTPS, GitHub Actions minutes for the nightly check.

Guards (ship with v1, no new dependencies needed):
- In-memory per-IP rate limits: scan 30/h, domains 30/h, plan/generate 10/h, live check 30/h. Set `app.set('trust proxy', 1)` only when deployed behind a proxy.
- Output cache per repo@sha + answers (above) and regenerate limits.
- Recommend setting a **monthly spend limit in the model provider's dashboard** — the only reliable hard cap. An in-memory counter is best-effort and resets on restart.

---

## 9. Handoff output format

Both entry points produce the same structure. Build it adds §2 "Build" from the existing planner; Launch it omits it; "Already live" keeps only §0 (if anything), §4 and §5.

```md
# HANDOFF — <Project> : launch + customers
Live target: https://<domain>   Host: <host>   Stack: <stack>   Audience: <audience>   Pricing: <free|paid>

## 0. You, before pasting this to your agent (~15 min)
- [ ] Buy <domain> → <registrar prefilled link>   (indicative price, checked <date>)
- [ ] Create a <host> account (<commercial-use note>)
- [ ] Approve <host>'s GitHub access for <owner/repo>

## 1. Agent — Day 1: deploy a skeleton to the real domain
<agentCommands, configFiles, env notes, DNS records, gotchas>
Done when: https://<domain> returns 200 over HTTPS.

## 2. Agent — Build (Build it path only)
<existing Prepare → Make → Check steps; every push auto-deploys>

## 3. Agent — Launch polish
<checklist items owned by agent>

## 4. Agent — Write the launch kit into /launch in the repo
- /launch/positioning.md, /launch/posts/<channel>.md, /launch/outreach.md, /launch/timeline.md
<generated words; channel rules and limits inline>

## 5. You — launch
<timeline: day → channel → prefilled post link>
Unverified niche communities: <list, "check rules first">

## Guardrails
- Prices and rules come from Handoff's cached playbooks (verified <date>); re-check anything marked stale.
- Do not post automatically. Do not invent users, numbers or testimonials.
- Never commit secrets; env var names only.
```

---

## 10. Changes to the existing Build flow

- `server.ts` `finalizePlan`: for `kind === 'app'` (and `general` when it looks like software), append §0, §1, §3, §4, §5 to the handoff and add plan sections the UI can render. Content kinds (video, image, documents, research) keep the current Publish step in v1.
- Reorder for apps: day-1 skeleton deploy comes **before** Make.
- `POST /api/plan-v2` accepts optional `launch: { domain, hosting, audience, pricing }`. Defaults: no domain (suggest), no hosting (recommend), audience inferred from goal, `free`.
- Build planner UI: one compact, collapsed **"Launch & customers"** row under the existing options with those four fields pre-filled with defaults. It must not add required steps.

---

## 11. Frontend

- **Home:** replace `.mode-switch` with two large cards: **Build it** ("I have an idea") and **Launch it** ("I have a repo"). Build it shows the current planner box.
- **Launch view** at path `/launch` (read `location.pathname` on load; `history.pushState` on view change; the prod server already falls back to `index.html`). New file `src/launch/LaunchView.tsx`; keep `App.tsx` from growing.
  1. Paste GitHub URL → scan card: stack + confidence, recommended host + why, env vars needed, readiness checks, warnings.
  2. **Have a domain?** Yes → input. No → candidates with live availability + registrar buttons + "I bought it".
  3. **Have hosting?** Yes → pick host (warn if it doesn't fit the stack). No → recommended host, with commercial-use note when pricing is paid.
  4. **Who is it for?** (6 audiences + "Not sure") and **Free or paid?**
  5. Handoff: reuse `.handoff-section` styling — rendered Markdown, **Copy** and **Download .md**.
  - Link **"Already live? Get customers →"** → asks for the live URL, skips to step 4, marketing-only handoff.
  - Optional **"Is it live?"** box.
- **Plan view:** render the new Launch and Customers sections; the Publish step gets "Open launch checklist".
- Styling: append to `src/index.css` using existing tokens; works at 760px; light and dark themes.

---

## 12. "Is it live?" — `GET /api/launch/live?domain=`

- Hostname only (no IP literals, no `localhost`, no ports).
- Resolve via DNS-over-HTTPS; reject private, loopback, link-local and reserved ranges.
- Then one HTTPS `HEAD`/`GET` with a 5s timeout; follow at most 3 redirects manually, re-checking each target.
- Report: DNS points to host? HTTPS valid? Status code? Page title.

---

## 13. Nightly checks

Add `scripts/check-launch-links.ts` and a step in `.github/workflows/catalog-refresh.yml`:
- Fetch every `sourceUrl`, `url`, and registrar `searchUrl` (with a sample domain) in `data/launch.snapshot.json`.
- Record results in a `checks[]` array; never auto-edit rules or prices.
- Mark records whose `lastVerified` is older than `staleAfterDays` as stale; the assembler excludes failing channels and labels stale ones.
- Commit only if the file changed (same pattern as the catalog job).

---

## 14. Tests and CI

- Add `"test"` script using Node's built-in test runner through tsx (no new dependency), and a `bun run test` step in `ci.yml`.
- Unit tests (no network): `detectStack` across fixtures (Next, Vite SPA, Vite+Express like this repo, Astro static vs SSR, FastAPI, Dockerfile-only, plain HTML, monorepo, empty); GitHub URL parser (accept/reject cases); RDAP result mapping (404/200/unknown TLD/timeout); hostname + private-IP guard; assembler picks (paid + Vercel → Pro note; stale channel excluded); writer validation (unknown channelId dropped, over-limit post falls back, foreign URL stripped); Markdown snapshot of one full handoff.
- Mock `fetch` for scan, RDAP and writer calls.

---

## 15. Build order

1. `shared/launch.ts` types + `data/launch.snapshot.json` seed (verified facts only) + loader + build copy.
2. Deterministic assembler + Markdown renderer + tests.
3. Build flow integration (§10): Build handoff now includes launch + customers.
4. Launch it path: scan → domain → hosting → audience → handoff (§4–6, §11).
5. Writer model integration + validation + caching + rate limits (§7–8).
6. "Is it live?" (§12) + nightly link checks (§13).

Ship after step 3 if needed: the Build flow alone already fixes the "never launched" gap for new projects.

---

## 16. Out of scope for v1

- Auto-deploy through a hosting API, domain purchase through an API, OAuth with hosts. For later reference: Vercel has a Registrar API (availability, price, buy — buying needs registrant contact info and spends money) and Projects/Deployments APIs (create project with `gitRepository`, deploy with `gitSource`, add domain via `POST /v10/projects/{id}/domains`). Vercel's and Netlify's Deploy buttons **clone** the repo into a new repo — not suitable for a user's own project.
- Automatic posting to any community — **never**; it breaks Reddit/HN rules and gets users banned.
- Launch outcome reporting ("launched, 3 signups from r/SideProject") feeding evidence labels — v2.

---

## 17. Acceptance criteria

- [ ] Home shows Build it / Launch it; `/launch` opens the Launch view directly.
- [ ] Build it for an app goal produces one handoff with sections 0–5; day-1 deploy comes before Make.
- [ ] Launch it with a public repo produces a handoff whose stack, build commands and env var names match the repo.
- [ ] Pasting this repo (`0xAshraFF/hand-off`) detects `node-server` (Vite + Express) and recommends a server host, not static hosting.
- [ ] Domain "No" path shows candidates with likely-available/taken/unknown and registrar links with the domain prefilled; "I bought it" continues.
- [ ] Paid + Vercel shows the Pro/commercial-use note.
- [ ] With no API keys at all, every path still returns a complete handoff (template words).
- [ ] Writer output never includes channels, URLs or numbers that weren't supplied; niche picks are labelled unverified.
- [ ] Rate limits and per-repo@sha caching are active; repeat requests don't call the model.
- [ ] `bun run lint`, `bun run test`, `bun run build` pass in CI.
- [ ] Every cached record has `sourceUrl` + `lastVerified`; nothing marked VERIFY in this document ships unverified.

## 18. Open questions for the owner

1. **GLM model:** exact model (5.2 vs the catalog's 5.3), endpoint and price — see §7.
2. **Where Handoff itself is hosted** (affects `trust proxy`, and free-tier sleep for the Express server).
3. **Language:** the header shows English / বাংলা. Should generated launch kits support Bengali in v1?
