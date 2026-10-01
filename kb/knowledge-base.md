# Knowledge Base setup (paste into the Context app)

**Title:** Fine Print: contest rules

**Purpose** (one or two sentences; it steers the outline and tags `[core]` entries):
> Help people entering developer contests and bounties decide whether they are eligible, exactly what they must submit, when entries really close, and how and when prizes are paid. Precedence matters: Official Rules govern contest announcement pages, which govern landing pages and FAQs.

## Sources
1. **Dataset source** (project `$SANITY_PROJECT_ID`, dataset `production`):
   ```groq
   *[_type in ["contest", "ruleSource", "clause", "conflict"]]{
     _type, title, "slug": slug.current, topic, quote, note, rationale, status, closesAsWritten,
     "source": source->title, "rank": source->precedenceRank,
     "contests": contests[]->title, "claims": claims[]->quote
   }
   ```
2. **Website sources** (crawl these exact URLs, not the whole domain):
   - https://dev.to/page/official-hackathon-rules
   - https://dev.to/page/sanity-challenge-v26-09-16-contest-rules
   - https://dev.to/challenges/sanity-2026-09-16
   - https://dev.to/challenges/kaggle-2026-09-23
   - https://superteam.fun/earn/listing/try-a-solana-project-and-give-useful-feedback-tokengems/
3. **File source** (use this if a crawl is blocked or the pages change): upload `kb/fine-print-sources.tar.gz` (built by `npm run kb:bundle`; it holds the verbatim snapshots from 2026-09-30).

## Standing instructions (Instructions view)
- "When the MLH General Contest Official Rules and a DEV Contest Announcement Page or landing page disagree, the Official Rules govern and control." Anchor: official-hackathon-rules + sanity contest rules page.
- "Quote deadlines with their time zone. If a source gives only a date, say that no time was given."
- "Treat the 'Sponsor' in DEV contest rules as Major League Hacking PBC Inc., not the brand sponsor named on the landing page."

## After the first build
Open **Issues**. Compare what the build flags with the hand-modeled `conflict` documents (see `docs/DEV_POST.md`, section "Knowledge Base vs. my conflicts"). Resolve each one. A resolution becomes an instruction that carries into future builds.
