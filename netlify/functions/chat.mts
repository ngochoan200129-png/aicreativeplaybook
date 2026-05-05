import type { Context } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 1024

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let body: { system?: string; messages?: Array<{ role: 'user' | 'assistant'; content: string }>; message?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messages = body.messages?.length
    ? body.messages
    : body.message
      ? [{ role: 'user' as const, content: body.message }]
      : null

  if (!messages) {
    return Response.json({ error: 'Missing messages' }, { status: 400 })
  }

  try {
    const reply = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: body.system,
      messages,
    })
    const text = reply.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
    return Response.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}

export const config = {
  path: '/api/chat',
}
