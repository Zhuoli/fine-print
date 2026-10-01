/** Hand-written stand-in for Sanity Context's initial_context, used only in offline mode. */
export const SCHEMA_OVERVIEW = `Types:
- contest {title, slug.current, platform, url, legalSponsor->organizer, brandSponsors[]->organizer, entryOpens, entryCloses (UTC instant or null), closesAsWritten, sourceTimeZone, winnersAnnounced (date), currency, totalPrize, tracks[]{name, winners, prizeEach, prizeLadder[], requiredTag, judging[]}, maxEntriesPerTrack, maxTeamSize, payoutTimeline{...}, requiredDocsIfWin[], aiPolicy, agentSubmissionAllowed, sources[]->ruleSource}
- ruleSource {title, url, kind (officialRules|contestRules|landingPage|faq|listing), precedenceRank (1 wins), precedenceQuote, fetchedAt, snapshotFile}
- clause {topic (deadline|eligibility|aiPolicy|originality|submission|team|prize|judging|payout|sponsor|cost), quote (verbatim), normalized (JSON string), note, contests[]->contest, source->ruleSource}
- conflict {title, topic, contest->contest, claims[]->clause, status (open|resolved), winningClaim->clause, resolvedBy (precedence|precision|needsHuman), rationale, severity}
- entrantProfile {label, country, timeZone, age, employer, usesAI, wantsAgentToSubmit}
- organizer {name, role (legalSponsor|brandSponsor|platform), url}
Contest slugs: dev-sanity-2026, dev-kaggle-2026, tokengems-feedback.`
