import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import {
  createReleaseFetchRun,
  finishReleaseFetchRun,
  processTechReleases,
} from '@/lib/release-ingestion'
import { eq } from 'drizzle-orm'
import { timingSafeEqual } from 'crypto'

export const maxDuration = 60

const CHUNK_SIZE = 6

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const bearer = request.headers.get('authorization') ?? ''
  const provided = bearer.startsWith('Bearer ') ? bearer.slice(7) : ''

  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const followedRows = await getDb()
    .select({ tech: technologies })
    .from(technologies)
    .innerJoin(userTechPreferences, eq(technologies.id, userTechPreferences.techId))

  const allTechs = Array.from(new Map(followedRows.map((row) => [row.tech.id, row.tech])).values())
  const results: { tech: string; inserted: number; errors: number }[] = []
  const runId = await createReleaseFetchRun('cron')

  // Process techs in parallel chunks to stay under maxDuration without hammering APIs.
  for (let i = 0; i < allTechs.length; i += CHUNK_SIZE) {
    const chunk = allTechs.slice(i, i + CHUNK_SIZE)
    const settled = await Promise.allSettled(chunk.map(processTechReleases))
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        results.push(r.value)
      } else {
        console.error('processTech rejected:', r.reason)
      }
    }
  }

  const summary = await finishReleaseFetchRun({ runId, details: results })

  return NextResponse.json({ success: true, runId, ...summary, results })
}
