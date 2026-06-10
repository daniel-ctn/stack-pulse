import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import {
  createReleaseFetchRun,
  finishReleaseFetchRun,
  processTechReleases,
} from '@/lib/release-ingestion'
import { timingSafeEqual } from 'crypto'

export const maxDuration = 300

const CHUNK_SIZE = 6
// Stop starting new chunks near the duration limit; later techs catch up next
// run because already-stored releases skip the slow AI step.
const TIME_BUDGET_MS = 270_000

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

  const db = getDb()
  const [allTechRows, followedRows] = await Promise.all([
    db.select().from(technologies),
    db.selectDistinct({ techId: userTechPreferences.techId }).from(userTechPreferences),
  ])

  // Registry stacks always fetch so public pages stay fresh and a first follow
  // never lands on an empty feed; custom repos only while someone follows them.
  const followedIds = new Set(followedRows.map((row) => row.techId))
  const allTechs = allTechRows.filter(
    (tech) => tech.category !== 'custom' || followedIds.has(tech.id),
  )

  const results: { tech: string; inserted: number; errors: number }[] = []
  const runId = await createReleaseFetchRun('cron')
  const startedAt = Date.now()

  // Process techs in parallel chunks to stay under maxDuration without hammering APIs.
  for (let i = 0; i < allTechs.length; i += CHUNK_SIZE) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      console.warn(`cron time budget reached after ${results.length}/${allTechs.length} techs`)
      break
    }

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
