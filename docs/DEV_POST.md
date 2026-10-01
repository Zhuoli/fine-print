---
title: "Fine Print: an agent that knows when the FAQ and the Official Rules disagree"
published: false
tags: devchallenge, sanitychallenge, sanity, ai
---

*This is a submission for the [Sanity Challenge, Path One: Ship an Agent That Queries Real Content](https://dev.to/challenges/sanity-2026-09-16)*

<!-- DRAFT STATUS (delete before publishing): live on Vercel + Studio deployed + 60 docs imported + dataset embeddings ready + project-level Context MCP verified (tools/list 200, semantic query OK) on 2026-10-01. Knowledge Bases are not available on this Free-plan project, so no KB build. Optional before submitting: LLM key, screen recording, agent session. -->

## What I Built

**Fine Print** reads contest rules so you don't miss the clause that disqualifies you.

I enter a lot of hackathons and bounties. The rules for one contest are never on one page. There's a landing page, an FAQ, a contest-rules page, and the platform's general Official Rules, and they drift apart. This very challenge is a good example. Its own pages disagree in ways that matter:

- **When does the winner paperwork clock start?** The FAQ gives you 7 business days "following the date of your first email notification". The MLH Official Rules say "following the date of first *attempted* notification", and add: "Failure to comply with these deadlines may result in forfeiture of the prize." Under the Official Rules, an email sitting in your spam folder has already started the clock. And the Official Rules govern: *"In the event of a conflict between these Official Rules and the applicable Contest Announcement Page, the Official Rules will govern and control."*
- **Who is "Sponsor"?** The landing page says "Sponsored by Sanity". The contest-rules page says "Sponsored by Major League Hacking PBC Inc ("Sponsor")". The employee exclusion is written against *Sponsor*. Can a Sanity employee enter? The rules don't say. Fine Print says exactly that and tells you to ask, instead of guessing.
- **Can I reuse a project?** The FAQ says riffing on prior work is encouraged. The Official Rules require that "development of your Entry was started during, and not prior to, the Entry Period".
- **"Submissions due: October 04, 2026"** is 2:59 PM on **October 5** in Beijing.

Tell Fine Print who you are (country, time zone, age, employer, whether you use AI, whether an agent submits for you). Then ask a plain question. The offline results include clause IDs and a tool trace with source quotes and URLs. Model-generated citation correctness is not yet automatically verified.

The local snapshot covers three contests: this one, the DEV Kaggle Benchmarking Challenge, and a Superteam Earn bounty (which turns out to be `HUMAN_ONLY`, so an agent can draft for you but not submit).

## Demo

- **Live app:** https://fine-print-opal.vercel.app
- Shareable demo questions:
  - https://fine-print-opal.vercel.app/?p=Sanity%20employee&q=Can%20I%20enter%20the%20Sanity%20challenge%2C%20and%20what%20is%20the%20catch%3F
  - https://fine-print-opal.vercel.app/?p=Dev%20in%20Beijing%2C%20old%20project&q=When%20exactly%20does%20the%20Sanity%20challenge%20close%20for%20me%3F
  - https://fine-print-opal.vercel.app/?q=If%20I%20win%20the%20Sanity%20challenge%2C%20when%20does%20the%20cash%20actually%20land%3F
- **Studio:** https://fine-print.sanity.studio/ (sign-in required; the **⚠️ Open conflicts** desk item is the review queue)

![Fine Print answering for a Sanity employee](https://raw.githubusercontent.com/Zhuoli/fine-print/main/docs/img/sanity-employee.png)

<!-- Optional: 60-second screen recording embed -->

## Code

https://github.com/Zhuoli/fine-print

Clone it and run `npm install && npm run seed:build && npm run dev`. It works with **no accounts at all**: GROQ runs locally via groq-js over the same seed, the Context tools fall back to same-named local shims, and with no LLM key a deterministic planner calls the same tools.

## How I Used Sanity

**The content model is the product.** Rules are prose, but what an entrant needs is computation: comparing instants, ranking sources, checking a country against a list. So every rule lives in Sanity twice: once **verbatim** (for citation), once **normalized** (for code).

- `ruleSource`: a page, its `kind` (officialRules / contestRules / landingPage / listing), a **`precedenceRank`**, and the exact sentence that establishes precedence.
- `clause`: a `topic`, a **verbatim `quote`**, a `normalized` JSON value (`{"minAge":18}`, `{"instant":"2026-10-05T06:59:00Z"}`, `{"excludedCountries":[…]}`), a reference to its `source`, and `contests[]`. One clause in the shared MLH Official Rules binds every DEV contest, so I fix it once.
- `conflict`: two or more `claims[]` (references to clauses) side by side, `status`, `winningClaim`, `resolvedBy` (`precedence` / `precision` / `needsHuman`), and a `rationale`.
- `contest`: the close **instant** *and* the close **as written**, the source time zone, tracks with winners per path, and a payout timeline (business-day windows with their anchors).
- `organizer`: **legal sponsor vs. brand sponsor**, because "Sponsor" in the rules isn't the logo on the page.

In the Studio, the first item in the desk structure is **⚠️ Open conflicts**, a review queue of contradictions nobody has decided yet.

**Sanity Context: one endpoint over the full dataset (no Knowledge Base).**

The live app is wired to the project-level Sanity Context MCP endpoint for the whole `production` dataset, in GROQ mode with **dataset embeddings enabled**:
`https://api.sanity.io/v2026-03-03/context/mcp/9wt4tu94/production?embeddings=true`.
The server connects to it with a read-only Viewer token kept in a server-side environment variable. `tools/list` returns `initial_context`, `groq_query`, `schema_explorer`, and `array_field_reader`. Embeddings cover `{ title, name, topic, quote, note, rationale, closesAsWritten }`. So semantic ranking works through the MCP: `*[_type=="clause"] | score(text::semanticSimilarity("when is the prize money paid"))` ranks `clause.sanity.prize.rules`, `clause.tg.payout`, and `clause.official.notify` first. With an LLM configured, the agent gets the schema overview from `initial_context` and uses `groq_query` to follow references. A typical call is one contest, its sources ordered by precedence, every clause that `references()` it, and every conflict with its claims dereferenced.

**About Knowledge Bases, honestly:** the Knowledge Bases option isn't shown in the dashboard for my Free-plan project, so I couldn't build one. The challenge page says: "Knowledge Bases are in beta and currently index up to 150 documents. Design for that budget, or point your agent at your full dataset through a Context MCP endpoint with embeddings enabled. Both count for Path One." Fine Print takes the second option. `kb/knowledge-base.md` holds the KB setup (dataset query, website sources, file bundle, standing instructions) that I'd apply once access is available. The app has a `knowledge_base_read` slot that currently falls back to a local shim over the verbatim snapshots in `/sources`.

**What the public demo actually runs:** the deployment has no paid LLM key. So the live demo uses the deterministic planner. It calls the same tools, and they run GROQ directly against the live Content Lake (`9wt4tu94/production`). The Context MCP is configured and verified, but the planner doesn't call the MCP tools itself. Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` and the model plans over the MCP tools instead.

**What the agent does with it.** The model is never allowed to do date math or eligibility logic in its head. It calls five deterministic tools: `check_deadline`, `check_eligibility`, `cash_timeline`, `submission_checklist`, and `source_conflicts`. Each runs GROQ against Sanity and returns verdicts carrying clause ids. The system prompt requires a `[clause.*]` citation on every factual sentence, and requires the agent to say "the rules don't settle this" whenever a conflict is `open`.

A keyword search would return "October 04" and "seven (7) business days". Answering "I'm in Beijing, when must I submit, and if I win, when is my W-9 due and when does the money arrive?" takes the instant, the zone, the precedence ranks, and the anchored business-day windows. Fine Print converts the submission instant to Beijing time, but refuses to invent a cash date: winner selection is not recorded, paperwork is due 7 business days after first attempted notification, and delivery depends on acknowledged acceptance of completed paperwork.

### Conflicts are modeled by hand (no KB build)

Without a Knowledge Base build, there are no machine-raised Issues to compare. The five `conflict` documents in the dataset are modeled by hand, each with side-by-side claims, a winning claim, and a rationale. Comparing them with a KB build's Issues is the first thing I'd do once access is available.

### Honest limitations

- The seed is curated: three contests and about 30 clauses. Extracting clauses from a new rules page is still a manual (AI-assisted) step. The next step is a Sanity Function that drafts `clause` documents from a new `ruleSource` for a human to approve.
- Business-day math skips weekends but not public holidays.
- The Kaggle challenge's landing page gives a date with no time. Fine Print says the time is unknown instead of assuming 11:59 PM PDT.
- This isn't legal advice. Where the rules are silent, the agent says so.

## Sanity Project Details

- **Project ID:** `9wt4tu94`
- **Dataset:** `production` (60 documents, imported from `seed/production.ndjson`)
- **Studio:** https://fine-print.sanity.studio/
- **Context MCP:** `https://api.sanity.io/v2026-03-03/context/mcp/9wt4tu94/production?embeddings=true` (dataset embeddings enabled; needs a read token)
- The dataset's visibility is public, but document IDs are dotted (`clause.official.clock`), and Sanity doesn't serve those to anonymous queries. So the app reads with a server-side Viewer token. To browse without an account, use `npm run seed:build` and read `seed/production.ndjson`, which is the exact imported content.

### Reproducible offline evidence

Run `npm test` with no credentials. It checks deadline boundaries, unknown eligibility, request validation, payout-anchor uncertainty, seed references, and a counterfactual: keeping the quoted prose unchanged while changing the normalized minimum age changes the verdict. This demonstrates dependence on structured facts, but is not evidence of a live Context call. `npm run check:mcp` checks the live Context endpoint.

## Agent Session

<!-- Optional: upload the build transcript at https://dev.to/agent_sessions/new, scrub keys, click Make Public, embed here. -->

I built this with an AI coding agent. I wrote the brief and the content model decisions, and checked every quoted clause against the source pages. The agent wrote most of the code.
