import {defineArrayMember, defineField, defineType} from 'sanity'

const TOPICS = ['deadline', 'eligibility', 'aiPolicy', 'originality', 'submission', 'team', 'prize', 'judging', 'payout', 'sponsor', 'cost']

export const organizer = defineType({
  name: 'organizer', title: 'Organizer', type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'role', type: 'string', description: 'Legal sponsor is who the rules bind. A brand sponsor is the logo on the page.',
      options: {list: ['legalSponsor', 'brandSponsor', 'platform']}}),
    defineField({name: 'url', type: 'url'}),
  ],
})

export const ruleSource = defineType({
  name: 'ruleSource', title: 'Rule source', type: 'document',
  description: 'One page or document that states rules. Precedence decides who wins when two sources disagree.',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'url', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'kind', type: 'string', options: {list: ['officialRules', 'contestRules', 'landingPage', 'faq', 'listing', 'api']}}),
    defineField({name: 'precedenceRank', type: 'number', description: '1 = governs. Lower rank wins a conflict.', validation: (r) => r.required().min(1)}),
    defineField({name: 'precedenceQuote', type: 'text', rows: 3, description: 'Verbatim sentence that establishes the precedence, if the source states one.'}),
    defineField({name: 'lastUpdatedOnPage', type: 'date'}),
    defineField({name: 'fetchedAt', type: 'datetime'}),
    defineField({name: 'snapshotFile', type: 'string', description: 'Path of the verbatim snapshot in the repo (also uploaded as a Knowledge Base file source).'}),
  ],
  orderings: [{title: 'Precedence', name: 'prec', by: [{field: 'precedenceRank', direction: 'asc'}]}],
  preview: {select: {title: 'title', rank: 'precedenceRank', kind: 'kind'}, prepare: ({title, rank, kind}) => ({title, subtitle: `rank ${rank} · ${kind}`})},
})

const track = defineArrayMember({
  type: 'object', name: 'track',
  fields: [
    defineField({name: 'name', type: 'string'}),
    defineField({name: 'winners', type: 'number'}),
    defineField({name: 'prizeEach', type: 'number'}),
    defineField({name: 'prizeLadder', type: 'array', of: [{type: 'number'}]}),
    defineField({name: 'requiredTag', type: 'string'}),
    defineField({name: 'judging', type: 'array', of: [{type: 'string'}]}),
  ],
})

export const contest = defineType({
  name: 'contest', title: 'Contest', type: 'document',
  groups: [{name: 'when', title: 'When'}, {name: 'money', title: 'Money'}, {name: 'rules', title: 'Rules'}],
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: (r) => r.required()}),
    defineField({name: 'platform', type: 'string'}),
    defineField({name: 'url', type: 'url'}),
    defineField({name: 'legalSponsor', type: 'reference', to: [{type: 'organizer'}], group: 'rules'}),
    defineField({name: 'brandSponsors', type: 'array', of: [{type: 'reference', to: [{type: 'organizer'}]}], group: 'rules'}),
    defineField({name: 'sources', type: 'array', of: [{type: 'reference', to: [{type: 'ruleSource'}]}], group: 'rules'}),
    defineField({name: 'entryOpens', type: 'datetime', group: 'when'}),
    defineField({name: 'opensAsWritten', type: 'string', group: 'when'}),
    defineField({name: 'entryCloses', type: 'datetime', group: 'when', description: 'Exact instant (stored in UTC). Leave empty if no source gives a time. The agent then says so instead of guessing.'}),
    defineField({name: 'closesAsWritten', type: 'string', group: 'when', description: 'The deadline exactly as the source words it.'}),
    defineField({name: 'sourceTimeZone', type: 'string', group: 'when', description: 'IANA zone the source uses, e.g. America/Los_Angeles'}),
    defineField({name: 'officialClock', type: 'string', group: 'when'}),
    defineField({name: 'winnersAnnounced', type: 'date', group: 'when'}),
    defineField({name: 'currency', type: 'string', group: 'money'}),
    defineField({name: 'totalPrize', type: 'number', group: 'money'}),
    defineField({name: 'tracks', type: 'array', of: [track], group: 'money'}),
    defineField({name: 'payoutTimeline', type: 'object', group: 'money', fields: [
      defineField({name: 'notifyWithinBusinessDays', type: 'number'}),
      defineField({name: 'notifyAnchor', type: 'string'}),
      defineField({name: 'docsDueBusinessDays', type: 'number'}),
      defineField({name: 'docsAnchor', type: 'string'}),
      defineField({name: 'deliveryWeeksMin', type: 'number'}),
      defineField({name: 'deliveryWeeksMax', type: 'number'}),
      defineField({name: 'paidWithinDaysOfAnnouncement', type: 'number'}),
      defineField({name: 'paymentRail', type: 'string'}),
    ]}),
    defineField({name: 'requiredDocsIfWin', type: 'array', of: [{type: 'string'}], group: 'money'}),
    defineField({name: 'maxEntriesPerTrack', type: 'number', group: 'rules'}),
    defineField({name: 'maxContributionsJudged', type: 'number', group: 'rules'}),
    defineField({name: 'maxTeamSize', type: 'number', group: 'rules'}),
    defineField({name: 'aiPolicy', type: 'string', options: {list: ['allowed', 'conditional', 'banned', 'unspecified']}, group: 'rules'}),
    defineField({name: 'agentSubmissionAllowed', type: 'string', options: {list: ['yes', 'no', 'unspecified']}, group: 'rules'}),
  ],
  preview: {select: {title: 'title', subtitle: 'closesAsWritten'}},
})

export const clause = defineType({
  name: 'clause', title: 'Clause', type: 'document',
  description: 'One rule, quoted verbatim, with a machine-readable version the agent can compute on.',
  fields: [
    defineField({name: 'topic', type: 'string', options: {list: TOPICS}, validation: (r) => r.required()}),
    defineField({name: 'quote', type: 'text', rows: 4, description: 'Verbatim from the source. Never paraphrase.', validation: (r) => r.required()}),
    defineField({name: 'source', type: 'reference', to: [{type: 'ruleSource'}], validation: (r) => r.required()}),
    defineField({name: 'contests', type: 'array', of: [{type: 'reference', to: [{type: 'contest'}]}], description: 'One clause in shared Official Rules can bind many contests.'}),
    defineField({name: 'normalized', type: 'text', rows: 3, description: 'JSON: the clause as data, e.g. {"minAge":18} or {"instant":"2026-10-05T06:59:00Z"}',
      validation: (r) => r.custom((v) => { if (!v) return true; try { JSON.parse(String(v)); return true } catch { return 'Must be valid JSON' } })}),
    defineField({name: 'note', type: 'text', rows: 2}),
  ],
  preview: {select: {topic: 'topic', quote: 'quote', src: 'source.title'}, prepare: ({topic, quote, src}) => ({title: `[${topic}] ${String(quote).slice(0, 80)}`, subtitle: src})},
})

export const conflict = defineType({
  name: 'conflict', title: 'Conflict', type: 'document',
  description: 'Two or more clauses that disagree, side by side, with the decision that carries forward.',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'contest', type: 'reference', to: [{type: 'contest'}]}),
    defineField({name: 'topic', type: 'string', options: {list: TOPICS}}),
    defineField({name: 'claims', type: 'array', of: [{type: 'reference', to: [{type: 'clause'}]}], validation: (r) => r.min(2)}),
    defineField({name: 'status', type: 'string', options: {list: ['open', 'resolved'], layout: 'radio'}, initialValue: 'open'}),
    defineField({name: 'resolvedBy', type: 'string', options: {list: ['precedence', 'precision', 'organizerAnswer', 'needsHuman']}}),
    defineField({name: 'winningClaim', type: 'reference', to: [{type: 'clause'}], hidden: ({document}) => document?.status !== 'resolved'}),
    defineField({name: 'rationale', type: 'text', rows: 4}),
    defineField({name: 'severity', type: 'string', options: {list: ['low', 'medium', 'high']}}),
  ],
  preview: {select: {title: 'title', status: 'status', severity: 'severity'}, prepare: ({title, status, severity}) => ({title, subtitle: `${status === 'open' ? '🟠 open' : '🟢 resolved'} · ${severity}`})},
})

export const entrantProfile = defineType({
  name: 'entrantProfile', title: 'Entrant profile', type: 'document',
  fields: [
    defineField({name: 'label', type: 'string'}),
    defineField({name: 'country', type: 'string', description: 'ISO 3166-1 alpha-2'}),
    defineField({name: 'timeZone', type: 'string'}),
    defineField({name: 'age', type: 'number'}),
    defineField({name: 'employer', type: 'string'}),
    defineField({name: 'employerAllowsSideProjects', type: 'string', options: {list: ['yes', 'no', 'unknown']}}),
    defineField({name: 'usesAI', type: 'boolean'}),
    defineField({name: 'wantsAgentToSubmit', type: 'boolean'}),
  ],
})

export const schemaTypes = [organizer, ruleSource, contest, clause, conflict, entrantProfile]
