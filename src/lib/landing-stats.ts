import { sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { releaseUpdates, technologies } from '@/db/schema'

export type LandingStats = {
  releases: number
  breaking: number
  stacks: number
}

const STATS_TTL_MS = 10 * 60 * 1000

let cached: { value: LandingStats; expires: number } | null = null

export async function getLandingStats(): Promise<LandingStats | null> {
  if (cached && cached.expires > Date.now()) return cached.value

  try {
    const [row] = await getDb()
      .select({
        releases: sql<number>`count(*)::int`,
        breaking: sql<number>`(count(*) filter (where ${releaseUpdates.releaseSignals} ? 'breaking' or coalesce(jsonb_array_length(${releaseUpdates.breakingChanges}), 0) > 0))::int`,
        stacks: sql<number>`(select count(*) from ${technologies} where ${technologies.category} is distinct from 'custom')::int`,
      })
      .from(releaseUpdates)

    const value = row ?? { releases: 0, breaking: 0, stacks: 0 }
    cached = { value, expires: Date.now() + STATS_TTL_MS }
    return value
  } catch (err) {
    console.error('getLandingStats failed:', err)
    return cached?.value ?? null
  }
}
