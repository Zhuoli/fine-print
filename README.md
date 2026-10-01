# Fine Print

**An agent that reads contest rules so you don't miss the clause that disqualifies you.**

Every hackathon and bounty spreads its rules across a landing page, an FAQ, a contest-rules page, and the platform's general Official Rules. They drift. Fine Print models those rules as structured content in Sanity, shows where a contest's own pages disagree and which page wins, and answers the questions entrants actually get wrong:

- *Can I enter?* (age, residency, sponsor-employee exclusion, employer policy, AI use, agent-submitted entries, project start date)
- *When does it **really** close for me?* (the exact instant, in my time zone, with a safe target)
- *What do I have to submit?* (every required artifact, tied to the clause that requires it)
- *If I win, when does the cash land, and what paperwork is due?*

It's built for **DEV × Sanity Challenge, Path One** (Sanity Context + Knowledge Bases).

## Why it needs structure

A keyword search finds "October 04". It can't tell you that this is 2:59 PM on **Oct 5** in Beijing. It also misses that the FAQ starts the 7-day winner-paperwork clock at "your first email notification", while the Official Rules (which govern) start it at the first *attempted* notification. Fine Print stores:

| Type | What it holds | Why the agent needs it |
|---|---|---|
| `ruleSource` | page URL, kind, **precedenceRank**, the sentence that sets precedence | decides who wins a conflict |
| `clause` | **verbatim quote**, topic, `normalized` JSON (`{"minAge":18}`, `{"instant":"…Z"}`), source → `ruleSource`, contests[] | the agent cites it; code computes on it |
| `conflict` | claims[] → `clause`, status, winningClaim, resolvedBy, rationale | contradictions side by side, with the decision |
| `contest` | close instant, close as written, source TZ, tracks, payout timeline, sources[] | deadline and cash math |
| `organizer` | legal sponsor vs. brand sponsor | "Sponsor" in the rules ≠ the logo on the page |

One `clause` in the shared MLH Official Rules binds several contests (`contests[]`), so fixing it once fixes every contest.

## Architecture

```
Next.js UI ──► /api/ask ──► agent (Vercel AI SDK, Claude or GPT)
                              ├─ Sanity Context MCP, GROQ mode ── dataset (contest, clause, conflict…)
                              ├─ Sanity Context MCP, Knowledge Base mode ── KB built from the dataset + rule pages + snapshots
                              └─ deterministic rule tools (check_deadline, check_eligibility,
                                 cash_timeline, submission_checklist, source_conflicts) that run GROQ
```

The LLM never does date math or eligibility logic in its head. It calls tools that return verdicts with clause ids, and it must cite them.

**Everything degrades gracefully, so the repo runs with zero accounts:**

| Missing | Fallback |
|---|---|
| `SANITY_PROJECT_ID` | groq-js runs the *same GROQ* over `seed/production.ndjson` |
| Context MCP URLs / org token | local `groq_query` and `knowledge_base_read` shims with the same names and shapes |
| LLM key | deterministic keyword planner over the same tools |

## Run it locally (no accounts)

```bash
# Node 22.12+ (the Studio needs it)
npm install
npm run seed:build      # data/seed.ts → seed/production.ndjson
npm test                # smoke checks on the rule engine + planner
npm run ask -- "Can I enter the Sanity challenge, and what is the catch?"
npm run dev             # http://localhost:3000
```

Demo links: `/?p=Sanity%20employee&q=Can%20I%20enter%20the%20Sanity%20challenge%3F`

## Go live with Sanity (needs accounts)

1. **Create a project** (free plan) at sanity.io/manage. Set `SANITY_PROJECT_ID` and `SANITY_STUDIO_PROJECT_ID` in `.env`.
2. **Studio + schema:**
   ```bash
   cd studio && npm install
   npx sanity login
   npx sanity schema deploy          # Context GROQ mode requires a deployed schema
   npx sanity deploy                 # free hosted Studio at https://fine-print.sanity.studio
   ```
3. **Import content:** `npm run seed:import` (from the repo root).
4. **Make the dataset public** (Manage → Datasets → production → Public) so judges can query it without a token:
   `https://9wt4tu94.apicdn.sanity.io/v2026-09-24/data/query/production?query=*[_type=="conflict"]{title,status,rationale}`
5. **Enable Context + Knowledge Bases:** Manage → organization → **Labs**. Create an **organization** API token with **Context Viewer**. Set it as `SANITY_ORGANIZATION_TOKEN`; a project token gets 403.
6. **Knowledge Base:** in the Context app, follow `kb/knowledge-base.md` (dataset source + website sources + `npm run kb:bundle` file upload). Run the build and resolve its Issues.
7. **Two MCPs** in the Context app:
   - `fine-print-groq`: source = dataset `9wt4tu94.production`, groqFilter `_type in ["contest","ruleSource","clause","conflict","organizer"]` → `SANITY_CONTEXT_MCP_URL`
   - `fine-print-kb`: source = the Knowledge Base → `SANITY_CONTEXT_KB_MCP_URL`

   (An MCP with both a dataset and a KB serves only the dataset, so use two.)
8. `npm run check:mcp` should list `groq_query, schema_explorer, array_field_reader` and `knowledge_base_read`.
9. Add `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) to get the LLM agent instead of the planner.

## Deploy (free)

Vercel Hobby: import the repo, framework Next.js, root `/`. Add the env vars above (server-side only; never expose the org token). `next.config.ts` ships `seed/` and `sources/` with the API function, so offline mode works on Vercel too.

## Data provenance

`sources/*.txt` are verbatim text snapshots of the public rule pages, fetched 2026-09-30. Each `clause.quote` is copied from them exactly. Contest data covers the DEV Sanity Challenge, the DEV Kaggle Benchmarking Challenge, and the TokenGems feedback bounty on Superteam Earn.

## Credits

Built with an AI coding agent. Uses the Vercel AI SDK, `@ai-sdk/mcp`, `groq-js`, Next.js, and Sanity Studio. No code was copied from starters. The Context integration follows the official "Connect Sanity Context with Vercel AI SDK" guide.
