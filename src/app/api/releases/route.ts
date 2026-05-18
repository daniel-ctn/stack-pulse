import { NextResponse } from 'next/server'

import { getAuth } from '@/lib/auth'
import { getReleaseFeedPage, getUserTechIds } from '@/lib/release-feed'
import {
  parseImportanceFilter,
  parseReadFilter,
  parseSearchFilter,
  parseSignalFilter,
  parseTechFilter,
} from '@/lib/release-feed-types'

export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers })

  if (!session) {
    return NextResponse.json({ error: 'not signed in' }, { status: 401 })
  }

  const url = new URL(request.url)
  const importance = parseImportanceFilter(url.searchParams.get('importance') ?? undefined)
  const read = parseReadFilter(url.searchParams.get('read') ?? undefined)
  const signal = parseSignalFilter(url.searchParams.get('signal') ?? undefined)
  const tech = parseTechFilter(url.searchParams.get('tech') ?? undefined)
  const search = parseSearchFilter(url.searchParams.get('q') ?? undefined)
  const cursor = url.searchParams.get('cursor')
  const techIds = await getUserTechIds(session.user.id)
  const page = await getReleaseFeedPage({
    userId: session.user.id,
    techIds,
    importance,
    read,
    signal,
    tech,
    search,
    cursor,
  })

  return NextResponse.json(page)
}
