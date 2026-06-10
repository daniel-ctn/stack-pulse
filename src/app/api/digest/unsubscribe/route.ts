import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { getDb } from '@/db'
import { digestSubscribers } from '@/db/schema'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// RFC 8058 one-click unsubscribe target (List-Unsubscribe-Post). Always
// responds 200 so token validity is not leaked to probes.
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''

  if (UUID.test(token)) {
    try {
      await getDb()
        .delete(digestSubscribers)
        .where(eq(digestSubscribers.unsubscribeToken, token))
    } catch (err) {
      console.error('one-click unsubscribe failed:', err)
      return NextResponse.json({ error: 'could not unsubscribe' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
