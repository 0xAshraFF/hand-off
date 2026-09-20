# Claude design prompt — "Handoff"

Paste everything below the line into Claude (claude.ai) to get a working, previewable
front-end prototype. It is written to produce a **self-contained artifact with mocked
data**, so it previews immediately without a backend.

---

Build me a single-file React artifact for a product called **Handoff**.

## What the product does

Handoff is a project-aware model recommendation engine. Someone tells it what they are
building, in a few taps, and it hands back:

1. A ranked model recommendation **for each job their project needs done** — not one
   model for everything. Most projects need something to do the thinking, something
   cheap to do the repetitive work, and sometimes something that can look at pictures.
   Each gets its own pick.
2. A **handoff** they paste into Claude or ChatGPT so their AI knows which model to use
   for which job, and builds the thing properly.

The wedge is that recommendations are driven by current benchmark data and real token
prices, and that it will happily recommend an obscure model that wins on the numbers over
a famous one that does not.

**Audience: curious and enthusiast users, not professional developers.** Assume the reader
has built something with ChatGPT or Claude but does not know what "embeddings", "agentic",
or "inference" mean. Never use those words in the interface. Every number needs a plain
sentence next to it saying whether bigger is better. There is no login anywhere in this
prototype — the whole flow is open.

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

**Step 0 — How deep do you want to go?**
Three cards, and this is the first thing on screen. It never asks the user to rate
themselves — it asks what they want to see:

- **"Just tell me what to use"** — only steps 1 and 4 are then shown. Fifteen seconds
  to a result.
- **"Show me the options"** — the default. All six steps.
- **"Hug me"** — all six steps plus a hardware question, and local / Hugging Face
  models enter the running. The pun is deliberate; leave it in.

This choice controls **how much gets asked and how much gets shown**. It must never
change the quality of the answer — a first-timer gets the same recommendation as
everyone else, just with fewer questions and fewer columns on screen.

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

**Step 5b — What hardware have you got?** (Hug Me only)
A VRAM figure, so a GGUF quantization can be sized to actually fit. This is the one
screen allowed to assume real technical knowledge, because only Hug Me reaches it.

**Step 6 — Describe it in your own words** (optional, free text)
Placeholder: "A Slack bot that reads our support inbox and drafts replies from our docs."
**Hard cap of 150 words**, with a live counter that sits quiet in grey and turns amber at
130 and red at 150, blocking further typing. With a "Skip" link. Below it, small text:
"This sharpens the picks. It stays private to you."

Then a full-width button: **Find my models**.

## The result screen — a spec sheet

Think of the system-requirements panel on the back of a video game box. That is exactly
the shape this screen takes, and it is the most important idea in the whole design.

A brief analyzing state first — 2 to 3 seconds, reasoning steps checking off one by one
("Read your project shape", "Scored 340 models", "Checked today's prices"). Then:

**A table. Jobs down the left, three builds across the top.**

Columns: **MINIMUM · RECOMMENDED · ULTRA**. Recommended is visually marked as the
default — it gets the accent colour, the others stay neutral.

Rows are the jobs the project needs done, named in plain language and never in jargon:

- **The thinker** — "Breaks your problem into steps and decides what happens next"
- **The workhorse** — "Does the repetitive work, thousands of times, cheaply"
- **The reader** — "Looks at images, screenshots and scanned documents"
- **The librarian** — "Finds the right piece of your own data to use"

Each cell holds a model name. A cheaper tier may say "not included" for a row, which is
itself informative — it shows what you give up.

Two rows close the table, and they answer the only question the user actually arrived
with:

- **"Runs you about"** — a monthly dollar figure per column, in monospace.
- **"On a $X budget"** — a verdict per column in plain words: "comfortably under",
  "fits", "4.5x over budget". Colour-coded, but the words must carry it alone.

**Behaviour:**

- If the user chose "Just tell me what to use", show only the Recommended column, with
  a quiet "show me the other two" control. The other columns are computed, just not
  shown.
- If the user chose "Hug me", a fourth column appears for a local build, with the
  quantization and the VRAM it needs.
- Clicking any cell expands a short panel: why this model won this row, its benchmark
  score, its price, and two alternates that nearly won. Each number carries a tiny grey
  caption saying which direction is good.
- Swapping a model inside a cell recomputes that column's cost row and verdict live,
  with the number counting rather than snapping.

The whole point is that the reader compares columns and never has to learn a
specification. If they can pick a column without knowing what any of the model names
mean, the screen works.

At the bottom, the payoff: **Your handoff**. A dark block containing text the user pastes
straight into Claude or ChatGPT to start building — plain prose instructions, not a
config file. It names the chosen models, says plainly that API keys will be needed and
that their assistant can walk them through it, and states what to set up first.

This chat-ready version is the **default tab**. Two more sit beside it for people who
want them: `AGENTS.md` and `models.json`. Label the default tab "Paste into Claude or
ChatGPT", not "Markdown".

One big **Copy** button, and a quieter **Download** next to it.

Important: if the user wrote a free-text description in step 6, it must appear inside the
handoff **quoted and clearly fenced as the user's own words** — never merged into the
instruction prose, since this text is about to be pasted into someone's AI assistant.

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

Put a small honest timestamp under the results: "Prices and scores as of 20 September
2026" — the real product refreshes nightly and should say so rather than implying it is
live.

Do not add a login screen, a landing page, or marketing copy. Start directly on question
one.
