import {ask} from '../../../lib/agent'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const {question, profile} = await req.json().catch(() => ({}))
  if (!question || typeof question !== 'string' || question.length > 2000) {
    return Response.json({error: 'question (string, ≤2000 chars) required'}, {status: 400})
  }
  try {
    return Response.json(await ask(question, profile || {}))
  } catch (e) {
    console.error(e)
    return Response.json({error: e instanceof Error ? e.message : String(e)}, {status: 500})
  }
}
