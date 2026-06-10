import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

/** Returns an error response when the request is not an authorized cron call, null when it is. */
export function requireCronAuth(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const bearer = request.headers.get('authorization') ?? ''
  const provided = bearer.startsWith('Bearer ') ? bearer.slice(7) : ''

  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
