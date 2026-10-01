import assert from 'node:assert/strict'
import {cashTimeline, checklist, conflictReport, deadlineStatus, eligibility, getContest} from '../lib/rules'
import {ask} from '../lib/agent'

// Pin tests to the local fixture, regardless of developer credentials.
const {env} = await import('../lib/config')
Object.assign(env, {projectId: '', anthropicKey: '', openaiKey: '', contextGroqUrl: '', contextKbUrl: '', orgToken: ''})

const s = (await getContest('dev-sanity-2026'))!
assert.equal(s.sources[0].kind, 'officialRules', 'sources ordered by precedence')
const d = deadlineStatus(s, 'Asia/Shanghai', new Date('2026-10-01T00:00:00Z'))
assert.ok(d.known && d.inYourZone?.includes('Oct 5') && d.inYourZone.includes('2:59 PM'), 'PDT deadline → Beijing next afternoon')
const st = eligibility(s, {country: 'US', age: 17})
assert.equal(st.find((x) => x.check === 'Age')?.status, 'fail')
assert.equal(eligibility(s, {country: 'RU', age: 30}).find((x) => x.check === 'Residency')?.status, 'fail')
assert.equal(eligibility(s, {country: 'US', age: 30, employer: 'Sanity'}).find((x) => x.check === 'Sponsor employee')?.status, 'warn')
assert.equal(eligibility(s, {country: 'US', age: 30, employer: 'Major League Hacking'}).find((x) => x.check === 'Sponsor employee')?.status, 'fail')
assert.equal(eligibility(s, {projectStartedOn: '2026-09-01'}).find((x) => x.check === 'Project start date')?.status, 'fail')
const c = cashTimeline(s) as any
assert.equal(c.known, false)
assert.match(c.detail, /selection/)
assert.equal(c.notifyBy, undefined, 'never substitute announcement for selection')
assert.ok(checklist(s).items.some((i) => /project ID/.test(i.item)))
const docs = conflictReport(s).find((x) => x.id === 'conflict.sanity-docs-anchor')!
assert.equal(docs.claims.find((k) => k.wins)?.rank, 1, 'Official Rules win')
const k = (await getContest('dev-kaggle-2026'))!
assert.equal(deadlineStatus(k).known, false, 'date-only deadline is reported as unknown time')
const tg = (await getContest('tokengems-feedback'))!
assert.equal(eligibility(tg, {wantsAgentToSubmit: true}).find((x) => x.check === 'Agent submits on its own')?.status, 'fail')
const r = await ask('Where do the sanity pages contradict each other?', {})
assert.ok(r.trace.some((t) => t.tool === 'source_conflicts') && !r.trace.some((t) => t.tool === 'check_eligibility'))
console.log('✓ all smoke checks passed')

const {POST} = await import('../app/api/ask/route')
for (const body of [null, {question: ' '}, {question: 'deadline', profile: {age: -1}}, {question: 'deadline', profile: {timeZone: 'Mars/Olympus'}}, {question: 'eligibility', profile: {projectStartedOn: '2026-02-30'}}, {question: 'test', profile: 'bad'}]) {
  const response = await POST(new Request('http://localhost/api/ask', {method: 'POST', body: JSON.stringify(body)}))
  assert.equal(response.status, 400, JSON.stringify(body))
}
assert.equal(eligibility(s, {projectStartedOn: '2026-10-10'}).find(x => x.check === 'Project start date')?.status, 'fail')
assert.equal(eligibility(s, {}).find(x => x.check === 'Project start date')?.status, 'unknown')
assert.equal(eligibility(s, {projectStartedOn: '2026-09-18'}).find(x => x.check === 'Project start date')?.status, 'unknown')
assert.equal(deadlineStatus(s, 'UTC', new Date(s.entryCloses!)).closed, true)
const incomplete = await ask('Can I enter Sanity?', {})
assert.match(incomplete.answer, /Eligibility not confirmed/)
assert.ok(r.trace.some(t => t.tool === 'contest_evidence'))
// Structural counterfactual: same prose, changed normalized fact => changed verdict.
const changed = structuredClone(s)
for (const clause of changed.clauses) {
  if (clause.normalized && JSON.parse(clause.normalized).minAge) {
    clause.normalized = JSON.stringify({...JSON.parse(clause.normalized), minAge: 35})
  }
}
assert.equal(eligibility(s, {age: 30}).find(x => x.check === 'Age')?.status, 'pass')
assert.equal(eligibility(changed, {age: 30}).find(x => x.check === 'Age')?.status, 'fail')
const {docs: seed} = await import('../data/seed')
const {readFileSync} = await import('node:fs')
assert.deepEqual(JSON.parse(JSON.stringify(seed)), readFileSync('seed/production.ndjson', 'utf8').trim().split('\n').map(line => JSON.parse(line)))
const ids = new Set(seed.map(d => d._id))
assert.equal(ids.size, seed.length, 'unique document IDs')
function refs(value: unknown): void {
  if (!value || typeof value !== 'object') return
  if ('_ref' in value) assert.ok(ids.has(String(value._ref)), `dangling reference ${value._ref}`)
  for (const nested of Object.values(value)) refs(nested)
}
seed.forEach(refs)
for (const conflict of s.conflicts) {
  if (conflict.status === 'resolved') assert.ok(conflict.claims.some(claim => claim._id === conflict.winningClaim))
}
console.log('✓ request validation, uncertainty, boundaries, structural counterfactual and seed integrity passed')
