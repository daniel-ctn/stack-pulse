import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { technologies, releaseUpdates, userTechPreferences } from '@/db/schema'
import { fetchLatestReleases, type GithubRelease } from '@/lib/github'
import { summarizeRelease } from '@/lib/ai'
import { and, eq } from 'drizzle-orm'
import { timingSafeEqual } from 'crypto'

export const maxDuration = 60

const CHUNK_SIZE = 6
const RELEASES_PER_TECH = 5

type Tech = typeof technologies.$inferSelect

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

function isPublishable(r: GithubRelease): boolean {
  return !r.draft && !!r.published_at && !!r.tag_name
}

async function processTech(
  tech: Tech,
): Promise<{ tech: string; inserted: number; errors: number }> {
  let inserted = 0
  let errors = 0

  let releases: GithubRelease[]
  try {
    releases = await fetchLatestReleases(tech.githubRepoUrl, RELEASES_PER_TECH)
  } catch (err) {
    console.error(`fetch failed for ${tech.name}:`, err)
    return { tech: tech.name, inserted, errors: 1 }
  }

  for (const release of releases) {
    if (!isPublishable(release)) continue

    try {
      const db = getDb()
      const existing = await db
        .select({ id: releaseUpdates.id })
        .from(releaseUpdates)
        .where(
          and(eq(releaseUpdates.techId, tech.id), eq(releaseUpdates.version, release.tag_name)),
        )
        .limit(1)

      if (existing.length > 0) continue

      const summary = await summarizeRelease(release.body || '', tech.name)

      const result = await db
        .insert(releaseUpdates)
        .values({
          techId: tech.id,
          version: release.tag_name,
          title: release.name || release.tag_name,
          summary: summary.summary,
          newFeatures: summary.new_features,
          breakingChanges: summary.breaking_changes,
          codeSnippet: summary.code_snippet ?? null,
          importanceLevel: summary.importance_level,
          rawReleaseUrl: release.html_url,
          publishedAt: new Date(release.published_at!),
        })
        .onConflictDoNothing({
          target: [releaseUpdates.techId, releaseUpdates.version],
        })
        .returning({ id: releaseUpdates.id })

      if (result.length > 0) inserted++
    } catch (err) {
      errors++
      console.error(`insert failed for ${tech.name}@${release.tag_name}:`, err)
    }
  }

  return { tech: tech.name, inserted, errors }
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

  // Process techs in parallel chunks to stay under maxDuration without hammering APIs.
  for (let i = 0; i < allTechs.length; i += CHUNK_SIZE) {
    const chunk = allTechs.slice(i, i + CHUNK_SIZE)
    const settled = await Promise.allSettled(chunk.map(processTech))
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        results.push(r.value)
      } else {
        console.error('processTech rejected:', r.reason)
      }
    }
  }

  return NextResponse.json({ success: true, results })
}
