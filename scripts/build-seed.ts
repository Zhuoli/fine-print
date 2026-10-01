import {mkdirSync, writeFileSync} from 'node:fs'
import {docs} from '../data/seed'
const clean = (o: unknown): unknown => JSON.parse(JSON.stringify(o)) // drop undefined
mkdirSync('seed', {recursive: true})
writeFileSync('seed/production.ndjson', docs.map((d) => JSON.stringify(clean(d))).join('\n') + '\n')
console.log(`wrote ${docs.length} documents to seed/production.ndjson`)
