/**
 * Seed content for Fine Print.
 *
 * Every `quote` is copied verbatim from the source page snapshot in /sources
 * (fetched 2026-09-30). The `normalized` fields are what make the agent useful:
 * they turn prose into values code can compare (instants, ranks, lists, numbers).
 */

export const FETCHED_AT = '2026-09-30T21:30:00-07:00'

type Doc = Record<string, unknown> & {_id: string; _type: string}
const ref = (id: string) => ({_type: 'reference', _ref: id})
const key = (s: string) => s.replace(/[^a-z0-9]/gi, '').slice(0, 12) + Math.abs(hash(s)).toString(36)
function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

// ---------- organizers ----------
const organizers: Doc[] = [
  {_id: 'org.mlh', _type: 'organizer', name: 'Major League Hacking PBC Inc.', role: 'legalSponsor', url: 'https://dev.to'},
  {_id: 'org.sanity', _type: 'organizer', name: 'Sanity', role: 'brandSponsor', url: 'https://www.sanity.io'},
  {_id: 'org.kaggle', _type: 'organizer', name: 'Kaggle', role: 'brandSponsor', url: 'https://www.kaggle.com'},
  {_id: 'org.superteam', _type: 'organizer', name: 'Superteam Earn', role: 'platform', url: 'https://superteam.fun/earn'},
  {_id: 'org.tokengems', _type: 'organizer', name: 'TokenGems', role: 'legalSponsor', url: 'https://tokengems.ai'},
]

// ---------- sources (precedence: lower rank wins a conflict) ----------
const sources: Doc[] = [
  {
    _id: 'src.dev-official-rules', _type: 'ruleSource', title: 'MLH General Contest Official Rules (DEV)',
    url: 'https://dev.to/page/official-hackathon-rules', kind: 'officialRules', precedenceRank: 1,
    lastUpdatedOnPage: '2026-02-25', fetchedAt: FETCHED_AT, snapshotFile: 'sources/dev-official-rules.txt',
    precedenceQuote: 'In the event of a conflict between these Official Rules and the applicable Contest Announcement Page, the Official Rules will govern and control.',
  },
  {
    _id: 'src.dev-sanity-contest-rules', _type: 'ruleSource', title: 'Sanity Challenge Contest Rules (Contest Announcement Page)',
    url: 'https://dev.to/page/sanity-challenge-v26-09-16-contest-rules', kind: 'contestRules', precedenceRank: 2,
    fetchedAt: FETCHED_AT, snapshotFile: 'sources/dev-sanity-contest-rules.txt',
    precedenceQuote: 'In the event of a conflict between the terms of this Contest Announcement Page and the Official Rules, the Official Rules will govern and control.',
  },
  {
    _id: 'src.dev-sanity-landing', _type: 'ruleSource', title: 'Sanity Challenge landing page + FAQ',
    url: 'https://dev.to/challenges/sanity-2026-09-16', kind: 'landingPage', precedenceRank: 3,
    fetchedAt: FETCHED_AT, snapshotFile: 'sources/dev-sanity-landing.txt',
  },
  {
    _id: 'src.dev-kaggle-landing', _type: 'ruleSource', title: 'Kaggle Benchmarking Challenge landing page',
    url: 'https://dev.to/challenges/kaggle-2026-09-23', kind: 'landingPage', precedenceRank: 3,
    fetchedAt: FETCHED_AT, snapshotFile: 'sources/dev-kaggle-landing.txt',
  },
  {
    _id: 'src.superteam-tokengems', _type: 'ruleSource', title: 'Superteam Earn listing: TokenGems feedback bounty',
    url: 'https://superteam.fun/earn/listing/try-a-solana-project-and-give-useful-feedback-tokengems/',
    kind: 'listing', precedenceRank: 1, fetchedAt: FETCHED_AT, snapshotFile: 'sources/superteam-tokengems.txt',
  },
]

// ---------- contests ----------
const contests: Doc[] = [
  {
    _id: 'contest.dev-sanity-2026', _type: 'contest', title: 'DEV Sanity Challenge',
    slug: {_type: 'slug', current: 'dev-sanity-2026'}, platform: 'DEV', url: 'https://dev.to/challenges/sanity-2026-09-16',
    legalSponsor: ref('org.mlh'), brandSponsors: [{...ref('org.sanity'), _key: 'sanity'}],
    sources: ['src.dev-official-rules', 'src.dev-sanity-contest-rules', 'src.dev-sanity-landing'].map((id) => ({...ref(id), _key: key(id)})),
    entryOpens: '2026-09-18T16:00:00Z', entryCloses: '2026-10-05T06:59:00Z', closesAsWritten: 'October 4, 2026 at 11:59 PM PDT',
    sourceTimeZone: 'America/Los_Angeles', winnersAnnounced: '2026-10-22', officialClock: 'Sponsor servers',
    currency: 'USD', totalPrize: 2500,
    tracks: [
      {_key: 'p1', name: 'Path One: Ship an Agent That Queries Real Content', winners: 3, prizeEach: 500, requiredTag: 'sanitychallenge',
        judging: ['Meaningful use of Sanity Context and structured content', 'Technical implementation and code quality', 'Use of Knowledge Bases', 'Usability']},
      {_key: 'p2', name: 'Path Two: Vibe-Code Something Strange', winners: 2, prizeEach: 500, requiredTag: 'sanitychallenge',
        judging: ['Quality and honesty of the build process writeup', 'Functionality of the finished app', 'Thoughtfulness of the schema behind it', 'Creativity and originality']},
    ],
    maxEntriesPerTrack: 1, maxTeamSize: 4,
    payoutTimeline: {notifyWithinBusinessDays: 10, notifyAnchor: 'winnerSelection', docsDueBusinessDays: 7, docsAnchor: 'firstAttemptedNotification', deliveryWeeksMin: 2, deliveryWeeksMax: 4, paymentRail: 'not stated'},
    requiredDocsIfWin: ['Affidavit of eligibility', 'Publicity/liability release', 'Tax info (e.g. W-9, SSN or Federal tax ID)'],
    aiPolicy: 'allowed',
    agentSubmissionAllowed: 'unspecified',
  },
  {
    _id: 'contest.dev-kaggle-2026', _type: 'contest', title: 'DEV Kaggle Benchmarking Challenge',
    slug: {_type: 'slug', current: 'dev-kaggle-2026'}, platform: 'DEV', url: 'https://dev.to/challenges/kaggle-2026-09-23',
    legalSponsor: ref('org.mlh'), brandSponsors: [{...ref('org.kaggle'), _key: 'kaggle'}],
    sources: ['src.dev-official-rules', 'src.dev-kaggle-landing'].map((id) => ({...ref(id), _key: key(id)})),
    entryOpens: null, opensAsWritten: 'September 23, 2026', entryCloses: null, closesAsWritten: 'October 11, 2026 (no time given on the landing page)',
    sourceTimeZone: 'America/Los_Angeles', winnersAnnounced: '2026-11-05', currency: 'USD', totalPrize: 2500,
    tracks: [{_key: 'main', name: 'Build a Benchmark', winners: 5, prizeEach: 500, requiredTag: 'kagglechallenge',
      judging: ['Insights Shared', 'Writing Quality', 'Creativity in Approach']}],
    maxEntriesPerTrack: 1,
    payoutTimeline: {notifyWithinBusinessDays: 10, notifyAnchor: 'winnerSelection', docsDueBusinessDays: 7, docsAnchor: 'firstAttemptedNotification', deliveryWeeksMin: 2, deliveryWeeksMax: 4, paymentRail: 'not stated'},
    aiPolicy: 'allowed', agentSubmissionAllowed: 'unspecified', maxTeamSize: 4,
  },
  {
    _id: 'contest.tokengems-feedback', _type: 'contest', title: 'TokenGems: Try a Solana Project and Give Useful Feedback',
    slug: {_type: 'slug', current: 'tokengems-feedback'}, platform: 'Superteam Earn',
    url: 'https://superteam.fun/earn/listing/try-a-solana-project-and-give-useful-feedback-tokengems/',
    legalSponsor: ref('org.tokengems'), brandSponsors: [{...ref('org.superteam'), _key: 'st'}],
    sources: [{...ref('src.superteam-tokengems'), _key: 'st'}],
    entryOpens: '2026-09-28T13:21:17Z', entryCloses: '2026-10-17T06:59:59Z', closesAsWritten: '2026-10-17T06:59:59.000Z (listing API)',
    sourceTimeZone: 'UTC', currency: 'USDC', totalPrize: 350,
    tracks: [{_key: 'main', name: 'Feedback bounty', winners: 5, prizeLadder: [100, 75, 75, 50, 50],
      judging: ['Specificity', 'Evidence of exploration', 'Usefulness to a builder or another reader']}],
    maxEntriesPerTrack: 1, maxContributionsJudged: 3,
    payoutTimeline: {paidWithinDaysOfAnnouncement: 7, paymentRail: 'Superteam Earn (USDC)'},
    aiPolicy: 'unspecified', agentSubmissionAllowed: 'no',
  },
]

// ---------- clauses ----------
type C = {id: string; contest: string[]; source: string; topic: string; quote: string; normalized?: Record<string, unknown>; note?: string}
const C: C[] = [
  // Sanity: dates
  {id: 'sanity.close.rules', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-contest-rules', topic: 'deadline',
    quote: 'The Contest begins on September 18, 2026 at 9:00 AM PDT and ends on October 4, 2026 at 11:59 PM PDT (the " Entry Period ")',
    normalized: {instant: '2026-10-05T06:59:00Z', precision: 'minute'}},
  {id: 'sanity.close.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'deadline',
    quote: 'Submissions due: October 04, 2026', normalized: {date: '2026-10-04', precision: 'day'},
    note: 'Date only. Someone reading this in UTC+8 would wrongly assume they have until midnight local time.'},
  {id: 'official.clock', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'deadline',
    quote: "Sponsor's servers and clock will be deemed the official clock for the Contest and Entrant's proof of submission does not constitute proof of receipt by Sponsor."},
  // Eligibility
  {id: 'official.eligibility', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'eligibility',
    quote: 'The Contest is a skill-based contest open to individuals who are not residents of the following jurisdictions: Afghanistan, Belarus, Central African Republic, Cuba, Equatorial Guinea, Iran, Iraq, Kosovo, Libya, Myanmar (Burma), North Korea, Russia, South Sudan, Sudan, Syria, Tanzania, Venezuela, Yemen and are at least age eighteen (18) or older or are the legal age of majority in the jurisdiction in which they reside',
    normalized: {minAge: 18, excludedCountries: ['AF', 'BY', 'CF', 'CU', 'GQ', 'IR', 'IQ', 'XK', 'LY', 'MM', 'KP', 'RU', 'SS', 'SD', 'SY', 'TZ', 'VE', 'YE'], requiresAccount: 'DEV Member'}},
  {id: 'official.employees', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'eligibility',
    quote: 'Employees of Sponsor and its parent company, affiliates, subsidiaries, advertising, promotion, fulfillment or other coordinating agencies, individuals providing services to Sponsor through an outsourcer or temporary employment agency during the Entry Period, and their respective immediate family members and persons living in their same household, are also not eligible to participate in the Contest.',
    normalized: {excludedEmployersOf: 'legalSponsor'}},
  {id: 'official.employer-policy', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'eligibility',
    quote: "All Entries that violate an Entrant's employer's policies, will be deemed ineligible.",
    normalized: {requiresEmployerPolicyCheck: true}},
  {id: 'sanity.age.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'eligibility',
    quote: 'Participants need to be 18+ in order to participate.', normalized: {minAge: 18}},
  // AI + originality
  {id: 'sanity.ai.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'aiPolicy',
    quote: 'Use of AI is allowed as long as all other rules are followed.', normalized: {aiPolicy: 'allowed'}},
  {id: 'official.original', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'originality',
    quote: 'the Entry is the original creation of Entrant', normalized: {mustBeOriginal: true}},
  {id: 'official.started-during', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'originality',
    quote: 'development of your Entry was started during, and not prior to, the Entry Period', normalized: {mustStartWithinEntryPeriod: true}},
  {id: 'sanity.oss.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'originality',
    quote: 'Riffing on open source code and borrowing and improving on previous work/ideas is encouraged but it\'s important your changes are significant enough to ensure your submission is valid.',
    normalized: {priorWorkAllowed: 'withSignificantChanges'}},
  // Submission
  {id: 'sanity.required.rules', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-contest-rules', topic: 'submission',
    quote: 'A published submission post on DEV that provides an overview of the project using the submission template and unique challenge tag provided on the Contest Page. A Sanity project ID or a link to a public dataset URL.',
    normalized: {artifacts: ['Published DEV post using the path template', 'Tag #sanitychallenge', 'Sanity project ID or public dataset URL']}},
  {id: 'sanity.perpath.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'submission',
    quote: 'You may submit to both paths, but you must create a separate post for each.', normalized: {separatePostPerTrack: true}},
  {id: 'sanity.login.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'submission',
    quote: 'If your app requires logging in, please provide testing credentials in your submission and/or instructions on how to best test your application for judges.',
    normalized: {artifactsIfLogin: ['Test credentials or testing instructions for judges']}},
  {id: 'sanity.team.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'team',
    quote: 'Yes, you can work on teams of up to four people.', normalized: {maxTeamSize: 4}},
  {id: 'sanity.english.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'eligibility',
    quote: 'Non-english submissions are eligible for a completion badge but not eligible for prizes due to the current limitations of our judges.',
    normalized: {prizeLanguage: 'en'}},
  // Prizes
  {id: 'sanity.prize.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'prize',
    quote: 'The Sanity Challenge runs September 18 to October 4. Build an AI agent on structured content, or vibe-code an app with Sanity behind it. $2,500 in prizes.',
    normalized: {totalPrize: 2500}},
  {id: 'sanity.prize.rules', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-contest-rules', topic: 'prize',
    quote: 'Path One Winners (3) will each receive: $500 USD Cash Prize DEV++ Membership Exclusive DEV Badge Path Two Winners (2) will each receive: $500 USD Cash Prize',
    normalized: {winnersByTrack: {p1: 3, p2: 2}}},
  {id: 'sanity.tie.rules', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-contest-rules', topic: 'judging',
    quote: 'In the event of a tie in scoring between judges, the judges will select the entry that received the highest number of positive reactions on their DEV post to determine the winner.'},
  // Payout timeline (this is where the pages disagree)
  {id: 'sanity.notify.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'payout',
    quote: 'The DEV Team will contact you via the email associated with your DEV profile within, at most, 10 business days of the announcement date to share the details of claiming your prizes.',
    normalized: {notifyWithinBusinessDays: 10, anchor: 'announcementDate'}},
  {id: 'official.notify', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'payout',
    quote: "The winner of the Contest will be notified by email within ten (10) business days of the winner's selection.",
    normalized: {notifyWithinBusinessDays: 10, anchor: 'winnerSelection'}},
  {id: 'sanity.docs.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'payout',
    quote: 'provide any additional tax filing information (such as a W-9, social security number or Federal tax ID number) within seven (7) business days following the date of your first email notification.',
    normalized: {docsDueBusinessDays: 7, anchor: 'firstEmailNotification'}},
  {id: 'official.docs', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'payout',
    quote: 'provide any additional tax filing information (such as a W-9, social security number or Federal tax ID number) within seven (7) business days following the date of first attempted notification. Failure to comply with these deadlines may result in forfeiture of the prize.',
    normalized: {docsDueBusinessDays: 7, anchor: 'firstAttemptedNotification', forfeitOnMiss: true}},
  {id: 'official.delivery', contest: ['dev-sanity-2026', 'dev-kaggle-2026'], source: 'src.dev-official-rules', topic: 'payout',
    quote: 'Allow two (2) to four (4)] weeks from acknowledged acceptance by Sponsor of completed affidavit of eligibility and publicity/liability releases for delivery of prizes.',
    normalized: {deliveryWeeksMin: 2, deliveryWeeksMax: 4}},
  // Sponsor identity
  {id: 'sanity.sponsor.landing', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-landing', topic: 'sponsor',
    quote: 'Sponsored by Sanity', normalized: {sponsor: 'Sanity', sense: 'brand'}},
  {id: 'sanity.sponsor.rules', contest: ['dev-sanity-2026'], source: 'src.dev-sanity-contest-rules', topic: 'sponsor',
    quote: 'Sanity Challenge Sponsored by Major League Hacking PBC Inc(" Sponsor ")', normalized: {sponsor: 'Major League Hacking PBC Inc.', sense: 'legal'}},
  // Kaggle
  {id: 'kaggle.close.landing', contest: ['dev-kaggle-2026'], source: 'src.dev-kaggle-landing', topic: 'deadline',
    quote: 'Submissions due: October 11, 2026', normalized: {date: '2026-10-11', precision: 'day'},
    note: 'No time or zone on the landing page. The contest-rules page for this challenge was not ingested; check it for the exact minute.'},
  {id: 'kaggle.required.landing', contest: ['dev-kaggle-2026'], source: 'src.dev-kaggle-landing', topic: 'submission',
    quote: 'Submissions must include a link to the benchmark on Kaggle to be eligible.',
    normalized: {artifacts: ['Published DEV post using the template', 'Tag #kagglechallenge', 'Link to the benchmark on Kaggle']}},
  {id: 'kaggle.one.landing', contest: ['dev-kaggle-2026'], source: 'src.dev-kaggle-landing', topic: 'submission',
    quote: 'One submission per participant , so make it count!', normalized: {maxEntries: 1}},
  {id: 'kaggle.ai.landing', contest: ['dev-kaggle-2026'], source: 'src.dev-kaggle-landing', topic: 'aiPolicy',
    quote: 'Use of AI is allowed as long as all other rules are followed.', normalized: {aiPolicy: 'allowed'}},
  // TokenGems
  {id: 'tg.deadline', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'deadline',
    quote: 'Deadline (UTC): 2026-10-17T06:59:59.000Z', normalized: {instant: '2026-10-17T06:59:59Z', precision: 'second'}},
  {id: 'tg.human', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'aiPolicy',
    quote: 'Agent access: HUMAN_ONLY', normalized: {agentSubmissionAllowed: false}},
  {id: 'tg.fabricated', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'originality',
    quote: 'Duplicate accounts, copied or generic mass-produced comments, fabricated experiences, and coordinated prize manipulation are disqualified.',
    normalized: {disqualifiers: ['duplicate accounts', 'copied or generic mass-produced comments', 'fabricated experiences', 'coordinated prize manipulation']}},
  {id: 'tg.affiliation', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'eligibility',
    quote: 'Contributions about projects you own, work for, or are paid to promote do not qualify.', normalized: {excludesAffiliatedProjects: true}},
  {id: 'tg.free', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'cost',
    quote: 'Free to enter. No purchase, deposit, trade, or token ownership required.', normalized: {costToEnter: 0}},
  {id: 'tg.steps', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'submission',
    quote: 'Submit your TokenGems profile URL as the main Earn submission link, then add your contribution and project links, plus your X handle, in the questions below.',
    normalized: {artifacts: ['TokenGems profile URL (main link)', 'Links to 1-3 contributions + project pages', 'Affiliation disclosure', 'X handle that follows @tokengems and reposted the announcement']}},
  {id: 'tg.noedit', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'submission',
    quote: 'Contributions must be posted during this contest before the deadline and stay public through judging. Do not edit submitted contributions after the deadline.'},
  {id: 'tg.payout', contest: ['tokengems-feedback'], source: 'src.superteam-tokengems', topic: 'payout',
    quote: 'Winners are announced by the date shown on this listing and paid through Superteam Earn within seven days of announcement.',
    normalized: {paidWithinDaysOfAnnouncement: 7}},
]

const clauses: Doc[] = C.map((c) => ({
  _id: `clause.${c.id}`, _type: 'clause', topic: c.topic, quote: c.quote,
  contests: c.contest.map((s) => ({...ref(`contest.${s}`), _key: key(s)})),
  source: ref(c.source), normalized: c.normalized ? JSON.stringify(c.normalized) : undefined, note: c.note,
}))

// ---------- conflicts (claims side by side + a decision that carries forward) ----------
const conflicts: Doc[] = [
  {
    _id: 'conflict.sanity-docs-anchor', _type: 'conflict', contest: ref('contest.dev-sanity-2026'), topic: 'payout',
    title: 'When does the 7-business-day clock for winner paperwork start?',
    claims: [{...ref('clause.sanity.docs.landing'), _key: 'a'}, {...ref('clause.official.docs'), _key: 'b'}],
    status: 'resolved', winningClaim: ref('clause.official.docs'), resolvedBy: 'precedence',
    rationale: 'The landing FAQ starts the clock at "your first email notification" (received). The Official Rules start it at "first attempted notification" (sent) and govern on conflict. A spam-foldered email still starts the clock. Watch the DEV-profile inbox from Oct 22.',
    severity: 'high',
  },
  {
    _id: 'conflict.sanity-notify-anchor', _type: 'conflict', contest: ref('contest.dev-sanity-2026'), topic: 'payout',
    title: 'Is the 10-business-day contact window counted from the announcement or from winner selection?',
    claims: [{...ref('clause.sanity.notify.landing'), _key: 'a'}, {...ref('clause.official.notify'), _key: 'b'}],
    status: 'resolved', winningClaim: ref('clause.official.notify'), resolvedBy: 'precedence',
    rationale: 'Official Rules govern: anchored to winner selection, which may be earlier than the public announcement. In practice the two are the same week, so this is low impact.',
    severity: 'low',
  },
  {
    _id: 'conflict.sanity-sponsor', _type: 'conflict', contest: ref('contest.dev-sanity-2026'), topic: 'sponsor',
    title: 'Who is "Sponsor" for the employee exclusion: Sanity or MLH?',
    claims: [{...ref('clause.sanity.sponsor.landing'), _key: 'a'}, {...ref('clause.sanity.sponsor.rules'), _key: 'b'}],
    status: 'open', resolvedBy: 'needsHuman',
    rationale: 'Legally the Sponsor is MLH (DEV\'s parent). The employee exclusion covers MLH and its "coordinating agencies"; whether a brand sponsor like Sanity counts is not stated. Sanity employees should ask the organizers before entering. The agent must not guess here.',
    severity: 'medium',
  },
  {
    _id: 'conflict.sanity-prior-work', _type: 'conflict', contest: ref('contest.dev-sanity-2026'), topic: 'originality',
    title: 'Can I reuse a project I started before Sept 18?',
    claims: [{...ref('clause.sanity.oss.landing'), _key: 'a'}, {...ref('clause.official.started-during'), _key: 'b'}],
    status: 'resolved', winningClaim: ref('clause.official.started-during'), resolvedBy: 'precedence',
    rationale: 'Borrowing open-source or prior ideas is fine (and must be credited), but the Entry itself must have been started inside the Entry Period. Re-submitting an older project is the risk; building new on top of OSS is fine.',
    severity: 'high',
  },
  {
    _id: 'conflict.sanity-deadline-precision', _type: 'conflict', contest: ref('contest.dev-sanity-2026'), topic: 'deadline',
    title: '"October 04" vs "October 4, 11:59 PM PDT"',
    claims: [{...ref('clause.sanity.close.landing'), _key: 'a'}, {...ref('clause.sanity.close.rules'), _key: 'b'}],
    status: 'resolved', winningClaim: ref('clause.sanity.close.rules'), resolvedBy: 'precision',
    rationale: 'Not a contradiction, but the date-only line is dangerous outside the Americas: 11:59 PM PDT on Oct 4 is 2:59 PM on Oct 5 in Beijing, and 6:59 AM Oct 5 UTC.',
    severity: 'medium',
  },
]

// ---------- demo entrant profiles ----------
const profiles: Doc[] = [
  {_id: 'profile.sf-engineer', _type: 'entrantProfile', label: 'SF software engineer using AI tools',
    country: 'US', timeZone: 'America/Los_Angeles', age: 30, employer: 'A tech company (not MLH)', employerAllowsSideProjects: 'unknown', usesAI: true, wantsAgentToSubmit: false},
  {_id: 'profile.lagos-student', _type: 'entrantProfile', label: 'Student in Lagos, 17',
    country: 'NG', timeZone: 'Africa/Lagos', age: 17, employer: null, usesAI: true, wantsAgentToSubmit: false},
  {_id: 'profile.moscow-dev', _type: 'entrantProfile', label: 'Freelancer resident in Moscow',
    country: 'RU', timeZone: 'Europe/Moscow', age: 28, employer: null, usesAI: true, wantsAgentToSubmit: false},
  {_id: 'profile.agent-only', _type: 'entrantProfile', label: 'Autonomous agent that wants to submit on its own',
    country: 'US', timeZone: 'UTC', age: null, employer: null, usesAI: true, wantsAgentToSubmit: true},
]

export const docs: Doc[] = [...organizers, ...sources, ...contests, ...clauses, ...conflicts, ...profiles]
