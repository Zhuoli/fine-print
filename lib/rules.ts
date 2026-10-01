/**
 * Deterministic rule engine. The LLM never does date math or eligibility logic in its head:
 * it calls these functions, which read structured clauses from Sanity and return
 * verdicts that carry the exact clause ids they relied on.
 */
import {runGroq} from './store'

export type SourceRef = {_id: string; title: string; url: string; kind: string; precedenceRank: number}
export type Clause = {_id: string; topic: string; quote: string; normalized?: string; note?: string; source: SourceRef}
export type Conflict = {
  _id: string; title: string; topic: string; status: 'open' | 'resolved'; resolvedBy?: string; rationale: string; severity: string
  claims: {_id: string; quote: string; source: {title: string; url: string; precedenceRank: number}}[]
  winningClaim?: string
}
export type Contest = {
  _id: string; title: string; slug: string; url: string; platform: string; legalSponsor?: string; brandSponsors?: string[]
  entryOpens?: string | null; entryCloses?: string | null; closesAsWritten?: string; sourceTimeZone?: string; winnersAnnounced?: string
  currency: string; totalPrize: number; tracks: {name: string; winners: number; prizeEach?: number; prizeLadder?: number[]; requiredTag?: string; judging: string[]}[]
  maxEntriesPerTrack?: number; maxTeamSize?: number; payoutTimeline?: Record<string, number | string>; requiredDocsIfWin?: string[]
  aiPolicy?: string; agentSubmissionAllowed?: string
  sources: SourceRef[]; clauses: Clause[]; conflicts: Conflict[]
}
export type Profile = {
  country?: string; timeZone?: string; age?: number | null; employer?: string | null
  usesAI?: boolean; wantsAgentToSubmit?: boolean; projectStartedOn?: string | null; affiliatedProjects?: string[]
}
export type Check = {check: string; status: 'pass' | 'fail' | 'warn' | 'unknown'; detail: string; clauses: string[]}

export const CONTEST_QUERY = /* groq */ `
*[_type == "contest" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, url, platform,
  "legalSponsor": legalSponsor->name, "brandSponsors": brandSponsors[]->name,
  entryOpens, entryCloses, closesAsWritten, sourceTimeZone, winnersAnnounced,
  currency, totalPrize, tracks, maxEntriesPerTrack, maxTeamSize, payoutTimeline, requiredDocsIfWin,
  aiPolicy, agentSubmissionAllowed,
  "sources": sources[]->{_id, title, url, kind, precedenceRank} | order(precedenceRank asc),
  "clauses": *[_type == "clause" && references(^._id)]{
    _id, topic, quote, normalized, note,
    "source": source->{_id, title, url, kind, precedenceRank}
  } | order(source.precedenceRank asc),
  "conflicts": *[_type == "conflict" && references(^._id)]{
    _id, title, topic, status, resolvedBy, rationale, severity,
    "claims": claims[]->{_id, quote, "source": source->{title, url, precedenceRank}},
    "winningClaim": winningClaim._ref
  }
}`

export const LIST_QUERY = /* groq */ `*[_type == "contest"] | order(entryCloses asc){title, "slug": slug.current, entryCloses, closesAsWritten, totalPrize, currency, platform}`

export async function listContests() {
  return runGroq<{title: string; slug: string; entryCloses: string | null; closesAsWritten: string; totalPrize: number; currency: string; platform: string}[]>(LIST_QUERY)
}

export async function getContest(slug: string): Promise<Contest | null> {
  return runGroq<Contest | null>(CONTEST_QUERY, {slug})
}

const norm = (c: Clause): Record<string, any> => {
  try { return c.normalized ? JSON.parse(c.normalized) : {} } catch { return {} }
}

export function fmt(instant: string | Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(new Date(instant))
}

// ---------- deadlines ----------
export function deadlineStatus(contest: Contest, timeZone = 'UTC', now = new Date()) {
  const clauses = contest.clauses.filter((c) => c.topic === 'deadline').map((c) => c._id)
  if (!contest.entryCloses) {
    return {
      known: false, asWritten: contest.closesAsWritten, clauses,
      advice: `The sources only give a date ("${contest.closesAsWritten}"), not a time or zone. Treat the start of that date in your own zone as the safe deadline, and look for the contest-rules page for the exact minute.`,
    }
  }
  const close = new Date(contest.entryCloses)
  const msLeft = close.getTime() - now.getTime()
  const safe = new Date(close.getTime() - 2 * 3600_000)
  return {
    known: true, clauses, asWritten: contest.closesAsWritten,
    utc: close.toISOString(),
    inYourZone: fmt(close, timeZone),
    inSourceZone: fmt(close, contest.sourceTimeZone || 'UTC'),
    hoursLeft: Math.round((msLeft / 3600_000) * 10) / 10,
    closed: msLeft <= 0,
    safeTarget: fmt(safe, timeZone),
    note: contest.clauses.some((c) => c._id === 'clause.official.clock')
      ? "The sponsor's server clock is official, and your proof of submission is not proof of receipt. Leave a buffer."
      : undefined,
  }
}

// ---------- eligibility ----------
export function eligibility(contest: Contest, p: Profile): Check[] {
  const out: Check[] = []
  const byTopic = (t: string) => contest.clauses.filter((c) => c.topic === t)
  const elig = byTopic('eligibility')

  // age
  const ageClauses = elig.filter((c) => norm(c).minAge)
  if (ageClauses.length) {
    const min = Math.max(...ageClauses.map((c) => norm(c).minAge))
    out.push(p.age == null
      ? {check: 'Age', status: 'unknown', detail: `Must be ${min}+ (or the age of majority where you live). Age not provided.`, clauses: ageClauses.map((c) => c._id)}
      : {check: 'Age', status: p.age >= min ? 'pass' : 'fail', detail: p.age >= min ? `${p.age} ≥ ${min}` : `${p.age} is under the minimum of ${min}. A completion badge is still possible on DEV, but no prize.`, clauses: ageClauses.map((c) => c._id)})
  }
  else if (p.age != null) {
    out.push({check: 'Age', status: 'unknown', detail: 'No age rule in the ingested sources. The platform\'s own terms may still set one.', clauses: []})
  }
  // residency
  const geo = elig.filter((c) => norm(c).excludedCountries)
  if (geo.length) {
    const excluded: string[] = geo.flatMap((c) => norm(c).excludedCountries)
    out.push(!p.country
      ? {check: 'Residency', status: 'unknown', detail: 'Country not provided.', clauses: geo.map((c) => c._id)}
      : {check: 'Residency', status: excluded.includes(p.country.toUpperCase()) ? 'fail' : 'pass',
        detail: excluded.includes(p.country.toUpperCase()) ? `${p.country} is on the excluded list.` : `${p.country} is not on the excluded list (US export-control and restricted-party rules still apply).`,
        clauses: geo.map((c) => c._id)})
  }
  // sponsor employees
  const emp = elig.filter((c) => norm(c).excludedEmployersOf)
  if (emp.length) {
    const sponsor = contest.legalSponsor || ''
    const brand = contest.brandSponsors || []
    const e = (p.employer || '').toLowerCase()
    const isLegal = !!e && !!sponsor && (e.includes(sponsor.toLowerCase().split(' ')[0]) || e.includes('dev.to') || e.includes('mlh'))
    const isBrand = !!e && brand.some((b) => e.includes(b.toLowerCase()))
    const open = contest.conflicts.find((x) => x.topic === 'sponsor' && x.status === 'open')
    out.push({
      check: 'Sponsor employee',
      status: isLegal ? 'fail' : isBrand ? 'warn' : p.employer === undefined ? 'unknown' : 'pass',
      detail: isLegal ? `Employees of the legal sponsor (${sponsor}) are excluded.`
        : isBrand ? `You work for a brand sponsor (${brand.join(', ')}). The rules exclude employees of the legal Sponsor (${sponsor}) and its coordinating agencies, and do not say whether brand sponsors count. Ask the organizers before you enter.`
        : p.employer === undefined ? 'Employer not provided. Employees of the legal Sponsor and its agencies (and their households) are excluded.'
        : `Not an employee of ${sponsor}${brand.length ? ` or ${brand.join(', ')}` : ''}.`,
      clauses: [...emp.map((c) => c._id), ...(isBrand && open ? [open._id] : [])],
    })
  }
  // employer policy
  const ep = elig.filter((c) => norm(c).requiresEmployerPolicyCheck)
  if (ep.length && p.employer) {
    out.push({check: 'Employer policy', status: 'warn', detail: `Entries that violate your employer's policies are ineligible. Check ${p.employer}'s moonlighting/IP policy before you submit.`, clauses: ep.map((c) => c._id)})
  }
  // AI use
  const ai = byTopic('aiPolicy')
  const aiAllowed = ai.find((c) => norm(c).aiPolicy === 'allowed')
  const agentBan = ai.find((c) => norm(c).agentSubmissionAllowed === false)
  const fabricated = byTopic('originality').find((c) => (norm(c).disqualifiers || []).some((d: string) => /fabricated|mass-produced/.test(d)))
  if (p.usesAI && !aiAllowed && fabricated) {
    out.push({check: 'AI assistance', status: 'warn', detail: 'AI isn\'t banned, but generic mass-produced comments and fabricated experiences disqualify you. Only post what you actually tried, in your own words.', clauses: [fabricated._id, ...(agentBan ? [agentBan._id] : [])]})
  } else if (p.usesAI) {
    out.push(aiAllowed
      ? {check: 'AI assistance', status: 'pass', detail: 'AI use is explicitly allowed, as long as all other rules are followed (originality still applies).', clauses: [aiAllowed._id]}
      : {check: 'AI assistance', status: 'unknown', detail: 'The sources don\'t mention AI-assisted work.', clauses: []})
  }
  if (p.wantsAgentToSubmit) {
    out.push(agentBan
      ? {check: 'Agent submits on its own', status: 'fail', detail: 'This listing is HUMAN_ONLY. A human must submit; an agent may only help draft.', clauses: [agentBan._id]}
      : {check: 'Agent submits on its own', status: 'warn', detail: 'Not addressed. The rules assume a human entrant with an account (for example, "DEV Member"). Assume a human must submit.', clauses: elig.filter((c) => norm(c).requiresAccount).map((c) => c._id)})
  }
  // prior work
  const started = byTopic('originality').find((c) => norm(c).mustStartWithinEntryPeriod)
  if (started && p.projectStartedOn && contest.entryOpens) {
    const before = new Date(p.projectStartedOn) < new Date(contest.entryOpens)
    out.push({check: 'Project start date', status: before ? 'fail' : 'pass',
      detail: before ? `You started on ${p.projectStartedOn}, before the Entry Period opened (${contest.entryOpens.slice(0, 10)}). Build a new entry; reusing OSS is fine if you credit it and change it significantly.` : 'Started inside the Entry Period.',
      clauses: [started._id, ...byTopic('originality').filter((c) => norm(c).priorWorkAllowed).map((c) => c._id)]})
  }
  // affiliation (TokenGems style)
  const aff = elig.find((c) => norm(c).excludesAffiliatedProjects)
  if (aff) out.push({check: 'Project affiliation', status: p.affiliatedProjects?.length ? 'warn' : 'pass',
    detail: p.affiliatedProjects?.length ? `Don't write about ${p.affiliatedProjects.join(', ')}. Disclose affiliations or write "None".` : 'Write only about projects you don\'t own, work for, or get paid to promote.', clauses: [aff._id]})
  return out
}

// ---------- cash timeline ----------
function addBusinessDays(d: Date, n: number) {
  const x = new Date(d)
  let added = 0
  while (added < n) { x.setUTCDate(x.getUTCDate() + 1); const wd = x.getUTCDay(); if (wd !== 0 && wd !== 6) added++ }
  return x
}
const day = (d: Date) => d.toISOString().slice(0, 10)

export function cashTimeline(contest: Contest) {
  const t = contest.payoutTimeline || {}
  const clauses = contest.clauses.filter((c) => c.topic === 'payout').map((c) => c._id)
  const conflicts = contest.conflicts.filter((c) => c.topic === 'payout')
  if (!contest.winnersAnnounced) return {known: false, clauses, conflicts, detail: 'No announcement date in the sources.', paidWithinDaysOfAnnouncement: t.paidWithinDaysOfAnnouncement}
  const ann = new Date(contest.winnersAnnounced + 'T12:00:00Z')
  if (t.notifyWithinBusinessDays) {
    const notifyBy = addBusinessDays(ann, Number(t.notifyWithinBusinessDays))
    const docsBy = addBusinessDays(notifyBy, Number(t.docsDueBusinessDays || 0))
    const earliest = new Date(addBusinessDays(ann, 1).getTime() + Number(t.deliveryWeeksMin || 0) * 7 * 864e5)
    const latest = new Date(docsBy.getTime() + Number(t.deliveryWeeksMax || 0) * 7 * 864e5)
    return {
      known: true, clauses, conflicts: conflicts.map((c) => ({id: c._id, title: c.title, rationale: c.rationale})),
      winnersAnnounced: contest.winnersAnnounced, notifyBy: day(notifyBy),
      paperworkDueBy: `${t.docsDueBusinessDays} business days after the first *attempted* notification (worst case ${day(docsBy)})`,
      cashWindow: `${day(earliest)} to ${day(latest)}`, requiredDocs: contest.requiredDocsIfWin || [],
      caveat: 'Business days skip weekends but not public holidays. Delivery is counted from when the sponsor accepts your paperwork.',
    }
  }
  return {known: true, clauses, winnersAnnounced: contest.winnersAnnounced, paidWithinDaysOfAnnouncement: t.paidWithinDaysOfAnnouncement, rail: t.paymentRail}
}

// ---------- submission checklist ----------
export function checklist(contest: Contest) {
  const items = contest.clauses.flatMap((c) => {
    const n = norm(c)
    return [...(n.artifacts || []), ...(n.artifactsIfLogin || []).map((a: string) => `${a} (only if your app needs a login)`)].map((a: string) => ({item: a, clause: c._id, source: c.source.title}))
  })
  return {
    items, maxEntriesPerTrack: contest.maxEntriesPerTrack, maxTeamSize: contest.maxTeamSize,
    tracks: contest.tracks.map((t) => ({name: t.name, winners: t.winners, tag: t.requiredTag, judging: t.judging})),
    openQuestions: contest.conflicts.filter((c) => c.status === 'open').map((c) => ({id: c._id, title: c.title, rationale: c.rationale})),
  }
}

/** Conflicts, with the precedence-based winner made explicit. */
export function conflictReport(contest: Contest) {
  return contest.conflicts.map((c) => ({
    id: c._id, title: c.title, severity: c.severity, status: c.status, resolvedBy: c.resolvedBy,
    claims: c.claims.map((k) => ({clause: k._id, says: k.quote, source: k.source.title, rank: k.source.precedenceRank, wins: k._id === c.winningClaim})),
    rationale: c.rationale,
  }))
}
