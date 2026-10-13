# Handoff — design documents

A project-aware AI model recommendation engine. Someone describes what they are
building; it says which model to use for each task, what it will really cost in their
language, and hands them a document their own chatbot can build from.

## Read in this order

| File | What it is |
|---|---|
| `summary.html` | **Start here.** The whole product on one page — problem, flow, rules, economics, scope. |
| `user-flow.html` | The flow diagram: the borrowed-chatbot loop, and the classify/select split inside the one call. |
| `build-spec.html` | The written spec: every screen, the API contract, language and token-tax rules, failure cases. |
| `model-board.html` | Working prototype — pick a budget, see everything in reach with what each model is and is not for. |
| `claude-design-prompt.md` | Paste into claude.ai to get a previewable front-end prototype. |
| `architecture-decisions.md` | The full record, revisions 1–9, including what was rejected and why. |
| `cost-model.md` | Pricing arithmetic behind the free tier. |

## The four rules that settle arguments

1. **The model classifies, the code selects.** No language model ever names a model a
   user sees — it returns job types from a closed enum, and the scorer picks from the
   nightly catalog. Breaking this recreates the stale-catalog bug at the core.
2. **Price first, budget second.** Nobody can budget for something they have never
   bought. The same five-task project ranges $0.25–$90 a month on model choice alone.
3. **Fit, not ranking.** Every model gets a "shines at" and a "not for". A ranking
   answers "which is best", which is the wrong question.
4. **Reduce the asking, never the answer.** Fewer questions is a fair trade; a thinner
   recommendation is not.

## Open before building

- **Artificial Analysis terms.** Redistributing their scores is load-bearing now, not
  incidental. Confirm in writing.
- **Does the catalog include subscriptions and tools**, or only raw APIs? Changes what
  the nightly sync pulls and who the product is for.
