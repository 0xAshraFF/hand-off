# Can it be free? — the actual numbers

Grounded in Sept 2026 API pricing. Short answer: yes, easily, and the LLM is not
the reason it might not be.

## Cost per generation

One analyzer run is roughly 1,500 input tokens (system prompt + JSON schema +
wizard answers + a 150-word description) and ~400 output tokens of structured JSON.

| Model | $/M in | $/M out | Cost per run |
|---|---|---|---|
| Qwen3.7 Flash | $0.03 | $0.13 | $0.00010 |
| DeepSeek V4 Flash | $0.14 | $0.40 | $0.00037 |
| **GLM-5.3-Flash** | **$0.15** | **$0.50** | **$0.00043** |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | $0.00098 |
| Gemini 3.8 Flash | $0.75 | $3.75 | $0.00263 |
| GLM-5.3 (full) | $1.40 | $4.40 | $0.00386 |

**GLM-5.3-Flash is the tier-1 pick.** Same vendor and API shape as GLM-5.3, roughly
9x cheaper on both sides. The tiered design becomes trivial: same prompt, same schema,
swap the model ID on escalation. No second integration.

## Scaling, at 3 generations per user

Blended cost assuming 20% of runs escalate from GLM-5.3-Flash to full GLM-5.3:
$0.00111 per run, $0.0033 per user.

| Users | Annual LLM cost |
|---|---|
| 1,000 | $3 |
| 10,000 | $33 |
| 100,000 | $333 |
| 1,000,000 | $3,330 |

## The real cost is infrastructure, not intelligence

Vercel Pro (~$20/mo) plus Supabase Pro (~$25/mo) is ~$540/year before a single
model call. **The floor costs more than the AI does until roughly 150,000 users.**

The 3-generation cap is therefore not protecting a budget — at 3 runs per user the
LLM bill is a rounding error. What the cap actually buys is abuse containment: it
stops someone scripting signups to burn quota. Keep it, but understand what it is,
and be generous with it. 3 per *day* reads as fair; 3 per *lifetime* reads as a
demo and will cost more in abandoned users than it ever saves in tokens.

## The conversion cost nobody budgets for

Requiring Google sign-in before a visitor sees any result is the single most
expensive decision available. Typical drop-off at a pre-value auth wall is 60-80%.
That is the thing that actually threatens "free like the benchmarking apps" — not
tokens. See `docs/architecture-decisions.md` for the split that avoids it.
