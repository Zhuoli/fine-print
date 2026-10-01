import {createClient, type SanityClient} from '@sanity/client'
import {evaluate, parse} from 'groq-js'
import {readFileSync, existsSync} from 'node:fs'
import path from 'node:path'
import {env, modes} from './config'

let client: SanityClient | null = null
let seedCache: unknown[] | null = null

function seedDocs(): unknown[] {
  if (seedCache) return seedCache
  const file = path.join(process.cwd(), 'seed', 'production.ndjson')
  if (!existsSync(file)) throw new Error('seed/production.ndjson missing. Run `npm run seed:build`.')
  seedCache = readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  return seedCache
}

/** Run GROQ against the live Content Lake when a project id is set, otherwise against the local seed with groq-js. */
export async function runGroq<T = unknown>(query: string, params: Record<string, unknown> = {}): Promise<T> {
  if (modes.liveDataset()) {
    client ??= createClient({
      projectId: env.projectId,
      dataset: env.dataset,
      apiVersion: env.apiVersion,
      useCdn: !env.readToken,
      token: env.readToken || undefined,
    })
    return client.fetch<T>(query, params)
  }
  const tree = parse(query, {params})
  const value = await evaluate(tree, {dataset: seedDocs(), params})
  return (await value.get()) as T
}
