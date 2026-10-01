import {requestSchema} from '../../../lib/validation'
import {ask} from '../../../lib/agent'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({error: 'Invalid request', issues: parsed.error.issues}, {status: 400})
  }
  const {question, profile} = parsed.data
  try {
    return Response.json(await ask(question, profile || {}))
  } catch (e) {
    console.error(e)
    return Response.json({error: 'Unable to complete the request. Check server configuration and try again.'}, {status: 500})
  }
}
