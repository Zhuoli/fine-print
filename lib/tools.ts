import {tool} from 'ai'
import {z} from 'zod'
import {readdirSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {runGroq} from './store'
import {cashTimeline, checklist, conflictReport, deadlineStatus, eligibility, getContest, listContests, type Profile} from './rules'

export type TraceEntry = {tool: string; input: unknown; output: unknown}

const profileSchema = z.object({
  country: z.string().optional().describe('ISO 3166-1 alpha-2, e.g. US'),
  timeZone: z.string().optional().describe('IANA zone, e.g. America/Los_Angeles'),
  age: z.number().nullable().optional(),
  employer: z.string().nullable().optional(),
  usesAI: z.boolean().optional(),
  wantsAgentToSubmit: z.boolean().optional(),
  projectStartedOn: z.string().nullable().optional().describe('YYYY-MM-DD'),
  affiliatedProjects: z.array(z.string()).optional(),
})

async function contestOrThrow(slug: string) {
  const c = await getContest(slug)
  if (!c) throw new Error(`No contest with slug "${slug}". Call list_contests first.`)
  return c
}

/** Deterministic tools. They read Sanity through GROQ and never let the model do date math or eligibility logic. */
export function ruleTools(trace: TraceEntry[], defaults: Profile) {
  const wrap = <I, O>(name: string, fn: (i: I) => Promise<O>) => async (i: I) => {
    const output = await fn(i)
    trace.push({tool: name, input: i, output})
    return output
  }
  return {
    list_contests: tool({
      description: 'List the contests in the dataset, with slugs and deadlines. Call this first if you don\'t know the slug.',
      inputSchema: z.object({}),
      execute: wrap('list_contests', async () => listContests()),
    }),
    check_deadline: tool({
      description: 'Exact close time of a contest in the user\'s time zone, hours left, and a safe target. Never compute times yourself.',
      inputSchema: z.object({slug: z.string(), timeZone: z.string().optional()}),
      execute: wrap('check_deadline', async ({slug, timeZone}: {slug: string; timeZone?: string}) =>
        deadlineStatus(await contestOrThrow(slug), timeZone || defaults.timeZone || 'UTC')),
    }),
    check_eligibility: tool({
      description: 'Run every eligibility clause for a contest against an entrant profile. Returns pass/fail/warn/unknown per check, with clause ids.',
      inputSchema: z.object({slug: z.string(), profile: profileSchema.optional()}),
      execute: wrap('check_eligibility', async ({slug, profile}: {slug: string; profile?: Profile}) =>
        eligibility(await contestOrThrow(slug), {...defaults, ...(profile || {})})),
    }),
    cash_timeline: tool({
      description: 'When the money actually arrives if you win: notification window, paperwork deadline, and delivery window, with the conflicts that affect them.',
      inputSchema: z.object({slug: z.string()}),
      execute: wrap('cash_timeline', async ({slug}: {slug: string}) => cashTimeline(await contestOrThrow(slug))),
    }),
    submission_checklist: tool({
      description: 'Every required artifact for a valid entry, each tied to the clause that requires it, plus open questions.',
      inputSchema: z.object({slug: z.string()}),
      execute: wrap('submission_checklist', async ({slug}: {slug: string}) => checklist(await contestOrThrow(slug))),
    }),
    source_conflicts: tool({
      description: 'Places where the contest\'s own pages disagree. Shows the claims side by side, which one wins by precedence, and which are still open.',
      inputSchema: z.object({slug: z.string()}),
      execute: wrap('source_conflicts', async ({slug}: {slug: string}) => conflictReport(await contestOrThrow(slug))),
    }),
  }
}

// ---------- offline shims with the same names/shapes as Sanity Context MCP tools ----------
const SOURCES_DIR = path.join(process.cwd(), 'sources')

export function kbOutline() {
  const files = readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.txt'))
  return [
    '## Fine Print sources (offline snapshot): verbatim rule pages, fetched 2026-09-30',
    'Knowledge base id: kb-offline',
    ...files.map((f) => `rules/${f.replace(/\.txt$/, '')}\n  ${readFileSync(path.join(SOURCES_DIR, f), 'utf8').split('\n').find((l) => l.trim())?.trim().slice(0, 100)}`),
  ].join('\n')
}

export function contextShims(trace: TraceEntry[]) {
  return {
    groq_query: tool({
      description: 'Execute a GROQ query against the Fine Print dataset (offline shim of the Sanity Context groq_query tool).',
      inputSchema: z.object({query: z.string()}),
      execute: async ({query}: {query: string}) => {
        let output: unknown
        try { output = {result: await runGroq(query)} } catch (e) { output = {error: String(e)} }
        trace.push({tool: 'groq_query', input: {query}, output})
        return output
      },
    }),
    knowledge_base_read: tool({
      description: 'Read full source entries by path from the outline (offline shim of the Sanity Context knowledge_base_read tool).',
      inputSchema: z.object({knowledgeBase: z.string(), paths: z.array(z.string()).min(1).max(20)}),
      execute: async ({knowledgeBase, paths}: {knowledgeBase: string; paths: string[]}) => {
        const entries = paths.map((p) => {
          const f = path.join(SOURCES_DIR, path.basename(p) + '.txt')
          try { return {path: p, content: readFileSync(f, 'utf8').slice(0, 12000)} } catch { return {path: p, error: 'not found'} }
        })
        trace.push({tool: 'knowledge_base_read', input: {knowledgeBase, paths}, output: entries.map((e) => ({path: e.path, chars: 'content' in e ? e.content?.length : 0}))})
        return {entries}
      },
    }),
  }
}
