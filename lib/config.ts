/** Central place for env vars. Everything is optional: missing values switch that layer to offline mode. */
export const env = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: process.env.SANITY_API_VERSION || '2026-09-24',
  readToken: process.env.SANITY_API_READ_TOKEN || '', // only needed if the dataset is private
  // Sanity Context MCP (needs an *organization* token with Context Viewer)
  contextGroqUrl: process.env.SANITY_CONTEXT_MCP_URL || '', // MCP whose source is the dataset (GROQ mode)
  contextKbUrl: process.env.SANITY_CONTEXT_KB_MCP_URL || '', // MCP whose source is the Knowledge Base
  orgToken: process.env.SANITY_ORGANIZATION_TOKEN || '',
  // LLM
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  openaiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.FINE_PRINT_MODEL || '',
}

const isPlaceholder = (v: string) => !v || /^(your|xxx|placeholder|changeme)/i.test(v)

export const modes = {
  liveDataset: () => !isPlaceholder(env.projectId),
  contextGroq: () => !isPlaceholder(env.contextGroqUrl) && !isPlaceholder(env.orgToken),
  contextKb: () => !isPlaceholder(env.contextKbUrl) && !isPlaceholder(env.orgToken),
  llm: () => !isPlaceholder(env.anthropicKey) || !isPlaceholder(env.openaiKey),
}

export function describeModes() {
  return {
    dataset: modes.liveDataset() ? `sanity:${env.projectId}/${env.dataset}` : 'offline seed (groq-js over seed/production.ndjson)',
    contextGroq: modes.contextGroq() ? 'Sanity Context MCP (GROQ mode)' : 'local groq_query shim',
    contextKb: modes.contextKb() ? 'Sanity Context MCP (Knowledge Base mode)' : 'local knowledge_base_read shim over /sources',
    llm: modes.llm() ? (env.anthropicKey ? 'anthropic' : 'openai') : 'none (deterministic planner)',
  }
}
