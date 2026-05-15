import { NextResponse } from 'next/server'

import { getAuth } from '@/lib/auth'
import { getReleaseFeedPage, getUserTechIds } from '@/lib/release-feed'
import { parseImportanceFilter } from '@/lib/release-feed-types'

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers })

  if (!session) {
    return NextResponse.json({ error: 'not signed in' }, { status: 401 })
  }

  const url = new URL(request.url)
  const importance = parseImportanceFilter(url.searchParams.get('importance') ?? undefined)
  const cursor = url.searchParams.get('cursor')
  const techIds = await getUserTechIds(session.user.id)
  const page = await getReleaseFeedPage({ techIds, importance, cursor })

  return NextResponse.json(page)
}
