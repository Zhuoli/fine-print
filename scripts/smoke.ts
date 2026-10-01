import assert from 'node:assert/strict'
import {cashTimeline, checklist, conflictReport, deadlineStatus, eligibility, getContest} from '../lib/rules'
import {ask} from '../lib/agent'

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
assert.equal(c.notifyBy, '2026-11-05')
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
