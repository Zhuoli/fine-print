import {createMCPClient} from '@ai-sdk/mcp'
import {env, modes} from './config'

type Tools = Record<string, any>

async function connect(url: string) {
  const headers = {Authorization: `Bearer ${env.orgToken}`}
  const ic = new URL(url)
  ic.pathname = `${ic.pathname.replace(/\/$/, '')}/initial-context`
  const initialContext = await fetch(ic, {headers}).then((r) => (r.ok ? r.text() : `initial-context failed: ${r.status}`))
  const client = await createMCPClient({transport: {type: 'http', url, headers}})
  const {initial_context: _drop, ...tools} = (await client.tools()) as Tools
  return {client, tools, initialContext}
}

/** Connect to the two Sanity Context endpoints if configured: one GROQ-mode (dataset), one Knowledge-Base-mode. */
export async function connectContext() {
  const out: {tools: Tools; initialContext: string[]; close: () => Promise<void>; live: string[]} = {tools: {}, initialContext: [], close: async () => {}, live: []}
  const clients: {close: () => Promise<void>}[] = []
  for (const [name, url, on] of [['groq', env.contextGroqUrl, modes.contextGroq()], ['kb', env.contextKbUrl, modes.contextKb()]] as const) {
    if (!on) continue
    const c = await connect(url)
    clients.push(c.client)
    Object.assign(out.tools, c.tools)
    out.initialContext.push(`### Sanity Context (${name === 'groq' ? 'GROQ mode: structured dataset' : 'Knowledge Base mode: verbatim rule pages'})\n${c.initialContext}`)
    out.live.push(name)
  }
  out.close = async () => { await Promise.all(clients.map((c) => c.close())) }
  return out
}
