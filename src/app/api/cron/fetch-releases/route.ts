import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import {
  createReleaseFetchRun,
  finishReleaseFetchRun,
  processTechReleases,
} from '@/lib/release-ingestion'
import { requireCronAuth } from '@/lib/cron-auth'
import { dispatchReleaseWebhooks } from '@/lib/webhooks'

export const maxDuration = 300

const CHUNK_SIZE = 6
// Stop starting new chunks near the duration limit; later techs catch up next
// run because already-stored releases skip the slow AI step.
const TIME_BUDGET_MS = 270_000

export async function GET(request: NextRequest) {
  const denied = requireCronAuth(request)
  if (denied) return denied

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
  const insertedReleaseIds: string[] = []
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
        results.push(r.value.detail)
        insertedReleaseIds.push(...r.value.insertedReleaseIds)
      } else {
        console.error('processTech rejected:', r.reason)
      }
    }
  }

  const summary = await finishReleaseFetchRun({ runId, details: results })
  const webhooks = await dispatchReleaseWebhooks(insertedReleaseIds)

  return NextResponse.json({ success: true, runId, ...summary, webhooks, results })
}
