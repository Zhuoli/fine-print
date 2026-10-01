// Verifies both Sanity Context endpoints answer tools/list with the org token.
import {env} from '../lib/config'
for (const [name, url] of [['GROQ mode', env.contextGroqUrl], ['Knowledge Base mode', env.contextKbUrl]]) {
  if (!url) { console.log(`${name}: not configured`); continue }
  const r = await fetch(url, {method: 'POST', headers: {Authorization: `Bearer ${env.orgToken}`, Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json'},
    body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/list'})})
  const t = await r.text()
  console.log(`${name}: HTTP ${r.status}`, (t.match(/"name":"[a-z_]+"/g) || []).join(' ') || t.slice(0, 300))
}
