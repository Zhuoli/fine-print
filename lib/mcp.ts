import {createMCPClient} from '@ai-sdk/mcp'
import {env, modes} from './config'

type Tools = Record<string, any>

async function connect(url: string) {
  const headers = {Authorization: `Bearer ${env.orgToken}`}
  const ic = new URL(url)
  ic.pathname = `${ic.pathname.replace(/\/$/, '')}/initial-context`
  const initialContext = await fetch(ic, {headers, signal: AbortSignal.timeout(15_000)}).then((r) => (r.ok ? r.text() : `initial-context failed: ${r.status}`))
  const client = await createMCPClient({transport: {type: 'http', url, headers}})
  try {
    const {initial_context: _drop, ...tools} = (await client.tools()) as Tools
    return {client, tools, initialContext}
  } catch (error) {
    await client.close().catch(() => {})
    throw error
  }
}

/** Connect to the two Sanity Context endpoints if configured: one GROQ-mode (dataset), one Knowledge-Base-mode. */
export async function connectContext() {
  const out: {tools: Tools; initialContext: string[]; close: () => Promise<void>; live: string[]} = {tools: {}, initialContext: [], close: async () => {}, live: []}
  const clients: {close: () => Promise<void>}[] = []
  try {
  for (const [name, url, on] of [['groq', env.contextGroqUrl, modes.contextGroq()], ['kb', env.contextKbUrl, modes.contextKb()]] as const) {
    if (!on) continue
    const c = await connect(url)
    clients.push(c.client)
    for (const [toolName, definition] of Object.entries(c.tools)) {
      // Keep Sanity's own tool names (the prompt refers to them); prefix only on a collision.
      out.tools[toolName in out.tools ? `${name}_${toolName}` : toolName] = definition
    }
    out.initialContext.push(`### Sanity Context (${name === 'groq' ? 'GROQ mode: structured dataset' : 'Knowledge Base mode: verbatim rule pages'})\n${c.initialContext}`)
    out.live.push(name)
  }
  } catch (error) {
    await Promise.allSettled(clients.map((c) => c.close()))
    throw error
  }
  out.close = async () => { await Promise.all(clients.map((c) => c.close())) }
  return out
}
