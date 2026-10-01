'use client'
import {useEffect, useState, type ReactNode} from 'react'

type Trace = {tool: string; input: unknown; output: unknown}
type Result = {answer: string; trace: Trace[]; modes: Record<string, string>; error?: string}

const PRESETS: Record<string, Record<string, unknown>> = {
  'SF engineer, uses AI': {country: 'US', timeZone: 'America/Los_Angeles', age: 30, employer: 'Acme Corp', usesAI: true},
  'Sanity employee': {country: 'US', timeZone: 'America/New_York', age: 34, employer: 'Sanity', usesAI: true},
  'Student in Lagos, 17': {country: 'NG', timeZone: 'Africa/Lagos', age: 17, usesAI: true},
  'Dev in Beijing, old project': {country: 'CN', timeZone: 'Asia/Shanghai', age: 26, usesAI: true, projectStartedOn: '2026-08-01'},
  'Autonomous agent': {country: 'US', timeZone: 'UTC', usesAI: true, wantsAgentToSubmit: true},
}
const QUESTIONS = [
  'Can I enter the Sanity challenge, and what is the catch?',
  'When exactly does the Sanity challenge close for me?',
  'If I win the Sanity challenge, when does the cash actually land, and what paperwork do I need?',
  'Where do the Sanity challenge pages contradict each other?',
  'TokenGems bounty: can my agent submit it, and what do I need?',
  'Kaggle challenge: when is it due?',
]

/** Tiny renderer: headings, bullets, bold, and [clause.*] citations. */
function render(md: string): ReactNode[] {
  return md.split('\n').map((line, i) => {
    const h = line.match(/^#{1,3}\s+(.*)/)
    const body = (h ? h[1] : line).split(/(\*\*[^*]+\*\*|\[(?:clause|conflict)\.[^\]]+\])/g).map((part, j) =>
      part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong>
        : /^\[(clause|conflict)\./.test(part) ? <span className="cite" key={j}>{part}</span>
        : part)
    return h ? <h3 key={i}>{body}</h3> : <div key={i}>{body}</div>
  })
}

export default function Page() {
  const [preset, setPreset] = useState('SF engineer, uses AI')
  const [profile, setProfile] = useState<Record<string, unknown>>(PRESETS['SF engineer, uses AI'])
  const [question, setQuestion] = useState(QUESTIONS[0])
  const [res, setRes] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)

  async function go(q = question, prof = profile) {
    setBusy(true); setRes(null)
    const r = await fetch('/api/ask', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({question: q, profile: prof})})
    setRes(await r.json()); setBusy(false)
  }
  // Shareable demo links: /?q=...&p=<preset name>
  useEffect(() => {
    const u = new URLSearchParams(window.location.search)
    const p = u.get('p'); const prof = p && PRESETS[p] ? PRESETS[p] : PRESETS['SF engineer, uses AI']
    if (p && PRESETS[p]) { setPreset(p); setProfile(prof) }
    const q = u.get('q'); if (q) { setQuestion(q); go(q, prof) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const set = (k: string, v: unknown) => setProfile((p) => ({...p, [k]: v === '' ? undefined : v}))

  return (
    <main>
      <h1>Fine Print <small>sanity context · knowledge base</small></h1>
      <p className="sub">An agent that reads contest rules so you don&apos;t miss the clause that disqualifies you. It shows where a contest&apos;s own pages disagree, which page wins, when it really closes in your time zone, and when the prize money actually arrives.</p>
      <div className="grid">
        <section className="panel">
          <label>Who is entering?</label>
          <select value={preset} onChange={(e) => { setPreset(e.target.value); setProfile(PRESETS[e.target.value]) }}>
            {Object.keys(PRESETS).map((k) => <option key={k}>{k}</option>)}
          </select>
          <label>Country (ISO)</label><input value={String(profile.country ?? '')} onChange={(e) => set('country', e.target.value.toUpperCase())} />
          <label>Time zone</label><input value={String(profile.timeZone ?? '')} onChange={(e) => set('timeZone', e.target.value)} />
          <label>Age</label><input type="number" value={profile.age == null ? '' : String(profile.age)} onChange={(e) => set('age', e.target.value ? Number(e.target.value) : null)} />
          <label>Employer</label><input value={String(profile.employer ?? '')} onChange={(e) => set('employer', e.target.value)} />
          <label>Project started on</label><input type="date" value={String(profile.projectStartedOn ?? '')} onChange={(e) => set('projectStartedOn', e.target.value)} />
          <div className="row"><input type="checkbox" checked={!!profile.usesAI} onChange={(e) => set('usesAI', e.target.checked)} /> I use AI tools</div>
          <div className="row"><input type="checkbox" checked={!!profile.wantsAgentToSubmit} onChange={(e) => set('wantsAgentToSubmit', e.target.checked)} /> An agent submits for me</div>
        </section>
        <section className="panel">
          <label>Ask about a contest</label>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} />
          <div className="chips">{QUESTIONS.map((q) => <button className="chip" key={q} onClick={() => { setQuestion(q); go(q) }}>{q}</button>)}</div>
          <button id="ask" disabled={busy} onClick={() => go()}>{busy ? 'Reading the fine print…' : 'Ask'}</button>
          {res?.error && <pre>{res.error}</pre>}
          {res && !res.error && (
            <>
              <div className="answer">{render(res.answer)}</div>
              <details><summary>Tool trace ({res.trace.length} calls): what the agent asked Sanity</summary>
                <pre>{res.trace.map((t) => `▶ ${t.tool} ${JSON.stringify(t.input)}\n${JSON.stringify(t.output, null, 1).slice(0, 1500)}`).join('\n\n')}</pre>
              </details>
              <div className="modes">{Object.entries(res.modes).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
