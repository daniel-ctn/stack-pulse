import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { summarizeRelease } from '@/lib/ai'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { releaseBody, repoName } = await request.json()

  if (!releaseBody || !repoName) {
    return NextResponse.json({ error: 'Missing releaseBody or repoName' }, { status: 400 })
  }

  const summary = await summarizeRelease(releaseBody, repoName)
  return NextResponse.json(summary)
}
