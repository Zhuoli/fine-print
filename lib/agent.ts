import {generateText, stepCountIs} from 'ai'
import {anthropic} from '@ai-sdk/anthropic'
import {openai} from '@ai-sdk/openai'
import {describeModes, env, modes} from './config'
import {connectContext} from './mcp'
import {contextShims, kbOutline, ruleTools, type TraceEntry} from './tools'
import {cashTimeline, checklist, conflictReport, deadlineStatus, eligibility, getContest, listContests, type Profile} from './rules'
import {SCHEMA_OVERVIEW} from './schema-overview'

export type AgentResult = {answer: string; trace: TraceEntry[]; modes: ReturnType<typeof describeModes>; contest?: string}

const SYSTEM = `You are Fine Print, an agent that reads contest and bounty rules so entrants don't miss the clause that disqualifies them.

Hard rules:
- Answer only from tool results. Every factual sentence must cite a clause id (clause.*) or conflict id (conflict.*) in [brackets].
- Never do date or time-zone math yourself. Use check_deadline. Never decide eligibility yourself. Use check_eligibility.
- When sources disagree, call source_conflicts, show both claims, and say which one governs and why (precedence rank: 1 = Official Rules, which win).
- If a conflict is "open", say plainly that the rules don't settle it and the user should ask the organizers. Don't guess.
- Use knowledge_base_read only to quote surrounding text from the original page when a clause isn't enough.
- End with "What to do next": at most 3 bullets.
Be brief. Lead with the verdict.`

function pickModel() {
  if (env.anthropicKey) return anthropic(env.model || 'claude-sonnet-4-6')
  return openai(env.model || 'gpt-5-mini')
}

export async function ask(question: string, profile: Profile = {}): Promise<AgentResult> {
  const trace: TraceEntry[] = []
  if (!modes.llm()) return offlinePlanner(question, profile, trace)

  const ctx = await connectContext()
  try {
    const tools = {
      ...ruleTools(trace, profile),
      ...(ctx.live.includes('groq') ? {} : {groq_query: contextShims(trace).groq_query}),
      ...(ctx.live.includes('kb') ? {} : {knowledge_base_read: contextShims(trace).knowledge_base_read}),
      ...wrapMcp(ctx.tools, trace),
    }
    const system = [
      SYSTEM,
      `\n# Entrant profile\n${JSON.stringify(profile)}`,
      `\n# Today\n${new Date().toISOString()}`,
      ctx.live.includes('groq') ? '' : `\n# Data reference (offline)\n${SCHEMA_OVERVIEW}`,
      ctx.live.includes('kb') ? '' : `\n# Knowledge Base outline (offline)\n${kbOutline()}`,
      ...ctx.initialContext,
    ].join('\n')
    const {text} = await generateText({model: pickModel(), system, tools, prompt: question, stopWhen: stepCountIs(10)})
    return {answer: text, trace, modes: describeModes()}
  } finally {
    await ctx.close()
  }
}

/** Record MCP tool calls in the trace so the UI can show what the agent asked Sanity. */
function wrapMcp(tools: Record<string, any>, trace: TraceEntry[]) {
  return Object.fromEntries(Object.entries(tools).map(([name, t]) => [name, {
    ...t,
    execute: async (input: unknown, opts: unknown) => {
      const output = await t.execute(input, opts)
      trace.push({tool: `sanity-context:${name}`, input, output: typeof output === 'string' ? output.slice(0, 2000) : output})
      return output
    },
  }]))
}

// ---------- no-LLM fallback: a keyword router over the same deterministic tools ----------
const ICON = {pass: '✅', fail: '❌', warn: '⚠️', unknown: '❔'} as const

async function offlinePlanner(question: string, profile: Profile, trace: TraceEntry[]): Promise<AgentResult> {
  const q = question.toLowerCase()
  const contests = await listContests()
  trace.push({tool: 'list_contests', input: {}, output: contests})
  const slug = contests.find((c) => q.includes(c.slug) || c.title.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 4 && !['challenge', 'project', 'useful', 'feedback', 'solana'].includes(w)).some((w) => q.includes(w)))?.slug
    ?? (q.includes('token') || q.includes('superteam') ? 'tokengems-feedback' : 'dev-sanity-2026')
  const c = await getContest(slug)
  if (!c) return {answer: 'No contest found.', trace, modes: describeModes()}
  const tz = profile.timeZone || 'UTC'
  const want = {
    deadline: /deadline|\bdue\b|when (is|does)|clos|\btime\b|\blate\b|hours/.test(q),
    elig: /eligib|\bcan (i|my)\b|allowed|\benter|\bage\b|\bold\b|country|employ|\bai\b|\bagent\b|qualif/.test(q),
    cash: /cash|paid|payout|money|prize|w-9|tax|win/.test(q),
    list: /checklist|submit|need|require|post|tag/.test(q),
    conflict: /conflict|contradict|disagree|which page|fine print|catch|gotcha/.test(q),
  }
  if (!Object.values(want).some(Boolean)) Object.assign(want, {deadline: true, elig: true, list: true, conflict: true})
  const lines: string[] = [`**${c.title}** (${c.platform}) · sources: ${c.sources.map((s) => `${s.title} [rank ${s.precedenceRank}]`).join('; ')}`]

  if (want.elig) {
    const r = eligibility(c, profile); trace.push({tool: 'check_eligibility', input: {slug, profile}, output: r})
    const verdict = r.some((x) => x.status === 'fail') ? '❌ Not eligible as described' : r.some((x) => x.status === 'warn' || x.status === 'unknown') ? '⚠️ Eligible, with caveats' : '✅ Eligible'
    lines.push(`\n### Eligibility: ${verdict}`, ...r.map((x) => `- ${ICON[x.status]} **${x.check}**: ${x.detail} [${x.clauses.join(', ')}]`))
  }
  if (want.deadline) {
    const d = deadlineStatus(c, tz); trace.push({tool: 'check_deadline', input: {slug, timeZone: tz}, output: d})
    lines.push('\n### Deadline', d.known
      ? `- Closes **${d.inYourZone}** (your zone) = ${d.inSourceZone} = ${d.utc} UTC. ${d.closed ? '**Closed.**' : `${d.hoursLeft} h left. Aim for **${d.safeTarget}**.`} [${d.clauses.join(', ')}]${d.note ? `\n- ${d.note}` : ''}`
      : `- ${d.advice} [${d.clauses.join(', ')}]`)
  }
  if (want.list) {
    const k = checklist(c); trace.push({tool: 'submission_checklist', input: {slug}, output: k})
    lines.push('\n### Submission checklist', ...k.items.map((i) => `- [ ] ${i.item} [${i.clause}]`),
      ...(k.maxEntriesPerTrack ? [`- One entry per track${k.maxTeamSize ? `; teams of up to ${k.maxTeamSize}` : ''}.`] : []))
  }
  if (want.conflict) {
    const x = conflictReport(c); trace.push({tool: 'source_conflicts', input: {slug}, output: x})
    if (x.length) lines.push('\n### Where the pages disagree', ...x.map((y) => `- **${y.title}** (${y.status}${y.status === 'resolved' ? `, by ${y.resolvedBy}` : ''}): ${y.rationale} [${y.id}]`))
  }
  if (want.cash) {
    const t = cashTimeline(c); trace.push({tool: 'cash_timeline', input: {slug}, output: t})
    lines.push('\n### If you win', 'cashWindow' in t && t.cashWindow
      ? `- Notified by ${t.notifyBy}; paperwork due ${t.paperworkDueBy}; cash likely **${t.cashWindow}**. Docs: ${(t.requiredDocs || []).join(', ')}. ${t.caveat} [${t.clauses.join(', ')}]`
      : `- Paid within ${'paidWithinDaysOfAnnouncement' in t ? t.paidWithinDaysOfAnnouncement : '?'} days of the announcement. [${t.clauses.join(', ')}]`)
  }
  lines.push('\n_Offline planner: no LLM key set, so a keyword router picked the tools above. Every line comes from a clause in Sanity._')
  return {answer: lines.join('\n'), trace, modes: describeModes(), contest: slug}
}
