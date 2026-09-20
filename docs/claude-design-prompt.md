# Claude design prompt — "Handoff"

Paste everything below the line into Claude (claude.ai) to get a working, previewable
front-end prototype. It is written to produce a **self-contained artifact with mocked
data**, so it previews immediately without a backend.

---

Build me a single-file React artifact for a product called **Handoff**.

## What the product does

Handoff is a project-aware model recommendation engine. A developer tells it what they
are building, in a few taps, and it hands back:

1. A ranked model recommendation **per role in their project** — not one model for
   everything. A project needs a planner, a bulk worker, maybe a vision model, maybe an
   embedding model. Each gets its own pick.
2. A **handoff file** they paste into their coding agent (Claude Code, Cursor, Copilot)
   so the agent knows which model to call for which job, with the API snippets.

The wedge is that recommendations are driven by current benchmark data and real token
prices, and that it will happily recommend an obscure model that wins on the numbers over
a famous one that does not.

## The core interaction — read this part twice

The whole app is **one question at a time**. This is the most important design constraint
and the thing I care most about.

- Exactly one question fills the screen. No sidebar of upcoming steps, no long scrolling
  form, no "step 3 of 7" progress bar chrome cluttering the top.
- When the user answers, that question **collapses upward into a compact one-line summary
  chip** (label + chosen value + a small pencil to reopen it), and the next question
  animates in below it, taking the focus.
- So as the user progresses, a short stack of answered chips builds at the top and the
  live question sits below them. The page grows downward. It should feel like a
  conversation that leaves a receipt, not like a form.
- Answering should be one click wherever possible. Selecting an option auto-advances —
  no separate "Next" button for single-select steps. Multi-select and free-text steps get
  a single primary button.
- Reopening a chip expands that question back in place; everything below it stays, and
  re-answering updates downstream state rather than resetting the flow.
- Keyboard: 1-9 selects an option, Enter confirms, Backspace reopens the previous chip.

## The steps

**Step 1 — What are you building?**
Six large tiles with an icon and a one-line description:
Agent / automation · Chat or support bot · Data extraction & documents · Coding tool ·
Content & creative generation · Something else (free text)

**Step 2 — Where does it run?**
Cloud API (fastest to ship) · Local / self-hosted (private, no per-token cost) ·
Hybrid (cloud for hard jobs, local for bulk) · Must not leave my machine

**Step 3 — What does it handle?** (multi-select)
Plain text · Images · PDFs & scanned documents · Audio · Video · Code · Long documents
(100k+ tokens)

**Step 4 — Budget**
A slider from $0 to $500, plus a toggle for "per month" vs "per run". The slider label
updates live and is phrased in human terms — at $0 it says "Free tiers and local models
only", at $500 it says "Frontier models, no real constraint".

**Step 5 — What matters most?**
A row of three sliders that must total 100 — **Quality**, **Speed**, **Cost**. Dragging
one redistributes the others. Show the live split as a thin stacked bar. Default 50/20/30.

**Step 6 — Describe it in a sentence** (optional, free text)
Placeholder: "A Slack bot that reads our support inbox and drafts replies from our docs."
With a "Skip" link. Below it, small text: "This sharpens the picks. We never share it."

Then a full-width button: **Find my models**.

## The result screen

A brief analyzing state — 2 to 3 seconds, showing the reasoning steps ticking past as
lines that check off one by one ("Read your project shape", "Scored 340 models",
"Checked live pricing", "Matched roles to models"). Then the result.

The result is a vertical stack of **role cards**. For an agent project, roles would be:
Planner / Reasoning · Bulk worker · Vision · Embeddings. Each role card contains:

- The role name and one line explaining what this model does in *their* project,
  written in terms of their answers, not generically.
- **The pick**: model name, who makes it, and three hard numbers side by side —
  benchmark score, price as `$in / $out per million tokens`, and median latency.
- A short **"why this one"** sentence citing an actual number, e.g. "Scores 4 points
  below the leader on agentic tasks but costs 11x less."
- A **"Sleeper pick"** slot underneath, visually distinct with a subtle accent border —
  a lesser-known model that beat the popular ones on this role's score. This slot is a
  first-class feature, not a footnote. Give it a small label like "Underrated".
- Two or three **alternates** collapsed behind a "Compare 3 others" disclosure. Expanded,
  they show as a tight comparison table with the same three numbers, and the winning
  number in each column gets bold + a colored dot.
- A "swap" control that promotes an alternate to the pick and **recomputes the running
  monthly cost estimate at the top of the page**, live.

At the top of the results, a sticky summary bar: estimated monthly cost vs their budget,
as a slim horizontal meter. Green while under, amber past 80%, red when over. Show the
actual dollar figures, not just the bar.

At the bottom, the payoff: **Your handoff**. A dark code block containing a generated
`AGENTS.md` — project summary, the model routing table, env vars to set, and a short
"rules for the agent" section. One big **Copy handoff** button, and a secondary
**Download AGENTS.md**. Next to it, a small row of tabs to switch the generated format
between `AGENTS.md`, `CLAUDE.md`, and `models.json`.

## Visual design

Make it feel like a precise instrument, not a SaaS landing page.

- **Restraint.** Near-black `#0A0A0A` and off-white `#FAFAF9` as the two poles. One
  accent color only, used for the selected state, the sleeper-pick border, and the
  primary button — nothing else. Pick a confident accent, not blue-600.
- **Type carries the hierarchy**, not boxes. Large tight-tracking headings for questions
  (32-40px, tracking -0.02em). Small uppercase micro-labels at 11px with wide tracking
  for field names. A monospace face for every number, price, and model ID — this matters,
  the numbers should read as data.
- **Light and dark mode both**, driven by CSS custom properties on `:root`, with dark
  mode under both `@media (prefers-color-scheme: dark)` and a `[data-theme="dark"]`
  attribute so the toggle works. Give `body` an explicit background.
- **Generous space.** The live question should have room around it. Cards use hairline
  1px borders and a large radius (16px), essentially no drop shadows.
- **Motion with intent.** Question-to-chip collapse is a real transition, roughly 300ms
  with an ease-out curve — the chip should look like it *is* the collapsed question, not
  a different element fading in. New question enters with a small upward translate and
  fade. Numbers that change on a model swap should count up rather than snap. Respect
  `prefers-reduced-motion` and drop to instant swaps.
- **Full width on phones**, 16px side gutters, no horizontal scroll, tiles stack to one
  column, sliders remain comfortably thumb-draggable.

## Data

Hardcode a realistic mock catalog of about 20 models inside the artifact, spanning
frontier, mid-tier, cheap, and local/open-weight, with plausible benchmark scores, real
per-million prices, and latency figures. Include several genuinely obscure names so the
sleeper-pick slot has something real to surface. Write the scoring as an honest function —
weighted role-fit × the user's quality/speed/cost split, filtered by their modality and
deployment constraints — so that changing the sliders actually changes the picks. I want
to feel the recommendation move when I drag them.

Do not add a login screen, a landing page, or marketing copy. Start directly on question
one.
