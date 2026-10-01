# Fine Print — strict Path One review

Reviewed against SANITY_BRIEF.md and the checked-in implementation, not against a deployed service. Scores below describe the received submission before these edits. The owner has not created the Sanity project. No live dataset, Context session, Knowledge Base build, or judge-accessible deployment was verified. Local shims do not satisfy those requirements.

## Scores

| Criterion | Score / 10 | Judge rationale |
| --- | ---: | --- |
| Meaningful Sanity Context and structured content | 5 | Reference traversal, source precedence, normalized rules, and explicit unresolved conflicts are a good use of structure. But deterministic tools query Content Lake directly; Context and KB can be bypassed entirely. Most decisions and conflict winners are curated, not derived through the agent's use of Context. |
| Technical implementation and code quality | 5 | Small, readable modules and real local GROQ evaluation. Incorrect payout anchors, optimistic eligibility, weak request validation, MCP lifecycle leaks, and narrow tests undermine trust. Studio has a separate dependency/build boundary excluded from root typecheck. |
| Use of Knowledge Bases | 2 | Setup recipe, snapshots, outline shim, and read tool exist. No actual KB, build Issues, resolution evidence, or recorded KB-dependent answer exists. The default offline router never reads the KB. |
| Usability | 5 | Zero-account demo, profile presets, shareable questions, and trace are useful. Citation IDs are not clickable evidence, profile inputs lack associated labels, failures could leave the UI busy, and questions outside routing heuristics silently select Sanity. |

**17/40, equally weighted for this review only.** Promising prototype, not submission-ready. A project ID/public dataset URL is a required missing submission artifact, not merely a cosmetic deduction. These offline fixes improve reliability but do not earn credit for an unperformed live integration.

## Ranked improvements (win impact / effort)

| Rank | Concrete improvement | Impact / effort | Outcome |
| --- | --- | --- | --- |
| 1 | Replace unsupported live/KB claims and absolute payout promises; clearly expose unknowns | Very high / small | Implemented in draft and rule engine. Required project artifact still owner-blocked. |
| 2 | Fix unknown eligibility and date boundaries; validate profiles at API, agent, and tool boundaries | High / small | Implemented conservative aggregate wording, coverage warning, date checks, shared input schema. Full rule coverage remains deferred. |
| 3 | Prove structured-data dependence with counterfactual tests and seed integrity checks | High / small | Implemented offline test changing normalized age while holding prose fixed; added reference, fixture, and boundary checks. |
| 4 | Make evidence inspectable and demonstrate disagreement side by side | High / small | Offline trace now includes source quotes/URLs and conflicts show both claims and the stored winner. Clickable citation UI and model citation validation deferred. |
| 5 | Harden request UX and MCP lifecycle | Medium / small | Network failure recovery, busy chips, generic server errors, initial-context timeout, cleanup on connection failure, endpoint-prefixed tool names. Live contract tests deferred. |
| 6 | Enforce content integrity at authoring time | High / medium | Normalized values must be JSON objects; conflicts require two claims. Full typed normalized schemas and cross-document validation deferred. |
| 7 | Build a real KB-dependent demonstration and publish verifiable artifacts | Essential / medium, requires owner account | Not implemented: create project, import seed, deploy schema, build KB, inspect Issues, record a session that actually calls both endpoints, fill submission placeholders. Offline checks provide a rehearsal, not substitute evidence. |

## Weaknesses by area

### lib/

- `rules.ts`: payout calculation ignored `notifyAnchor: winnerSelection`, substituting public announcement and inventing a cash window despite unknown acceptance timing. Fixed by refusing calendar dates for that anchor. Other future timeline configurations still need typed anchor modeling; holiday calendars are absent.
- Eligibility originally called unknown profiles eligible, omitted missing start dates, and accepted dates after closing. Fixed those paths and added an explicit coverage warning. Per-check employer substring matching remains brittle (`not MLH` matches MLH; unrelated names containing `Major` can match), and household, agency, language, account, majority-age, and originality checks remain incomplete. A country format check is not a residency verification.
- Deadline/contest fields and normalized clauses duplicate facts. `conflictReport` reports a stored winner; it does not compute a new winner or establish why a rank is authoritative. `norm` still swallows malformed JSON, and trusted dataset values lack runtime shape validation. Mutations could create contradictory derived facts.
- `agent.ts`: prompt instructions alone cannot guarantee cited or supported answers. No citation resolver, entailment check, prompt-injection evaluation, or handling of an empty tool-limit answer. The deterministic router does not extract profile facts from question prose and defaults ambiguous questions to Sanity. It does not invoke Context or KB. Configured mode labels show configuration, not proof of actual tool use.
- `tools.ts`: KB shim returns truncated text at 12,000 characters, ignores the requested KB identity, and maps paths using basename. It is a local convenience, not a verified replica of the service contract. Trace previews also truncate output. A crucial qualification can be missed.
- `mcp.ts`: endpoint tool name collisions and partial-connection leaks addressed. Initial-context response failure still becomes prompt text; tool discovery/execution lack an application-wide timeout. No mocked transport failure tests or live SDK contract validation.
- `store.ts`: arbitrary read-only GROQ, synchronous fixture loading, process-local cache, and optional CDN reads are fine for a tiny demo but need resource limits and a documented freshness policy before public service use.

### app/

- API formerly accepted malformed profiles and leaked raw exception messages; fixed. No request-body byte cap, authentication, rate limiting, or LLM budget control. Public deployment with a paid model key needs bounded access before release.
- UI now recovers from fetch/JSON errors and disables question chips while busy. Citation spans remain noninteractive; JSON trace is hard for judges to inspect, and its display truncation can hide evidence. No explicit contest selector or profile prose/field reconciliation.
- Form labels lack `htmlFor`/input IDs; answer/error updates lack live-region semantics. No browser interaction/accessibility test was run.

### scripts/

- `smoke.ts` formerly exercised mostly happy-path curated data and could use real credentials. Tests now force local modes and cover request validation, uncertainty, boundary conditions, structured counterfactuals, and seed consistency. Still not an LLM quality evaluation or complete precedence/KB ablation suite.
- `check-mcp.ts` posts `tools/list` directly without exercising the SDK initialization/session lifecycle, and does not fail the process for HTTP failure. It is insufficient proof of a working agent integration.
- `ask.ts` has no friendly CLI JSON parsing errors and standalone scripts do not explicitly load `.env`; documented shell setup must supply environment variables.
- `build-kb-bundle.ts` shells out to `rm`/`tar`, packages all source files, and produces no source manifest, hashes, counts, or upload validation. Check actual indexed document count against the brief's 150-document beta limit after the first build.
- `build-seed.ts` overwrites generated output without validating rule semantics. `seed:import` hardcodes production and `--replace`; it should be treated as an explicit owner operation, not part of offline review.

### studio/ schemas

- Good editorial separation of organizers, sources, clauses, conflicts, and an open-conflict queue.
- Normalized JSON remains a freeform text field; now rejects arrays/primitives, but cannot validate topic-specific keys or numeric ranges. Wrong normalized types can crash the rule engine.
- Conflict schema now requires at least two claims, but does not ensure distinct claims, winner membership, common contest scope, or resolved/open consistency. Source precedence accepts fractional ranks. Dates, currencies, payout ranges, and required references need stronger validation.
- Root typecheck excludes Studio; root build success is not Studio validation. No Studio dependency installation/build or schema deployment was performed here.

### data/seed.ts, seed/, sources/

- Curated fixtures are useful and reproducible but not an extraction pipeline. Tests now check generated-seed equality, unique IDs, all reference targets, and resolved-winner membership for Sanity.
- Removed the unsupported claim that selection and announcement happen in the same week from both seed representations.
- Quotes, extracted snapshot text, annotations, and normalization lack span-level provenance and automated quote-matching. Some normalized artifacts aggregate requirements beyond the specific quoted sentence. Do not claim every fact has been individually verified by this review.
- No freshness polling or content-change review. Frozen snapshots are evidence of collected text, not current contest status. Not all contests have complete source coverage (Kaggle lacks contest-specific rules/time).

### docs/DEV_POST.md and supporting docs

- Draft initially described live endpoints, a deployed-looking Studio URL, a completed KB comparison, and exact payout dates without supporting evidence. Corrected those claims and added reproducible offline evidence.
- Submission placeholders remain: project ID, public dataset, app, code, screenshot URL, Studio, and optional session. The KB Issues comparison must contain real results, including misses and new issues, before publication.
- The first-person statements about entering contests and checking every quote need owner verification. The deadline precision example is a clarification, not a contradiction. The source wording “first email notification” should not automatically be equated with proven receipt.
- README architecture describes intended integration; it should eventually include a captured real trace and measured KB contribution. FINISH_CHECKLIST's 60–90 minute estimate is unverified, and configuring live MCP URLs without an LLM key still takes the deterministic route with no MCP use.
- No external rules or product/pricing claims were revalidated. This review uses the supplied judging brief and repository snapshots; it does not adjudicate actual legal eligibility.

## Changes made

Every changed repository file is listed here:

| File | Why |
| --- | --- |
| `REVIEW.md` | Scored review, ranked improvements, limitations, file inventory, validation record. |
| `lib/validation.ts` | Shared strict request/profile validation, real calendar dates, valid time zones, bounded fields. |
| `app/api/ask/route.ts` | Return 400 for malformed requests/profiles; hide internal exception details. |
| `app/page.tsx` | Recover busy state on failures, show connection error, disable concurrent chip requests, label trace accurately. |
| `lib/tools.ts` | Reuse profile/time-zone validation for deterministic model tools. |
| `lib/agent.ts` | Validate direct calls, conservative eligibility wording, unknown payout explanation, offline evidence trace and side-by-side conflict claims, accurate offline disclaimer. |
| `lib/rules.ts` | Preserve payout-anchor uncertainty; stop calling date-only deadlines safe; check both entry-period bounds and missing start dates; make incomplete coverage/affiliation explicit. |
| `lib/mcp.ts` | Bound initial-context fetch, close clients on discovery/partial connection failure, namespace endpoint tools to prevent silent overwrites. |
| `scripts/smoke.ts` | Force local tests and add meaningful validation, uncertainty, date, counterfactual, and seed-integrity regressions. |
| `data/seed.ts` | Remove unsupported selection/announcement proximity assumption. |
| `seed/production.ndjson` | Keep generated fixture consistent with that editorial correction. |
| `studio/schemaTypes/index.ts` | Require normalized JSON objects and at least two claims on conflicts. |
| `docs/DEV_POST.md` | Mark unverified deployment/KB status, remove invented payout dates, replace deployed-looking Studio URL, document offline evidence. |

Recommended but not implemented: live project/KB/deployment/publication; endpoint integration and failure tests; citation validation and clickable evidence; complete eligibility modeling; typed authoring/data validation; automatic precedence derivation; source manifests and quote-span verification; SDK-based readiness script; public endpoint cost controls; accessibility/browser QA. These require either owner resources or a broader implementation than the safe local fixes above. No secrets, paid dependencies, remote changes, pushes, or commits were introduced.

## Validation

- `npm install --cache /Users/zhuoli/xiangzi-codex/sanity/.npm-cache --no-audit --no-fund`: passed; dependencies installed inside the repo and cache kept inside the authorized parent folder. No manifest or lockfile changes.
- `npm run typecheck`: passed.
- `npm test`: passed, including original smoke cases and added regressions; credentials are disabled in test configuration.
- `NEXT_TELEMETRY_DISABLED=1 npm run build`: passed (Next.js production compilation, TypeScript, page generation, and route tracing).
- Studio and live Sanity/Context/KB/LLM integration: not run. No claim of cloud validation.
