import {ask} from '../lib/agent'
const args = process.argv.slice(2)
const pIdx = args.indexOf('--profile')
const profile = pIdx >= 0 ? JSON.parse(args.splice(pIdx, 2)[1]) : {country: 'US', timeZone: 'America/Los_Angeles', age: 30, employer: 'Acme Corp', usesAI: true}
const question = args.join(' ') || 'Can I enter the Sanity challenge, and what is the catch?'
const r = await ask(question, profile)
console.log(r.answer)
console.error('\n--- trace:', r.trace.map((t) => t.tool).join(' → '), '\n--- modes:', r.modes)
