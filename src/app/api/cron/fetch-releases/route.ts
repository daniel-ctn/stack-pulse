import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { technologies, releaseUpdates } from '@/db/schema'
import { fetchLatestReleases } from '@/lib/github'
import { summarizeRelease } from '@/lib/ai'
import { and, eq } from 'drizzle-orm'
import { timingSafeEqual } from 'crypto'

export const maxDuration = 60

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
  const provided = bearer.startsWith('Bearer ')
    ? bearer.slice(7)
    : (request.nextUrl.searchParams.get('secret') ?? '')

  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: { tech: string; releases: number }[] = []
  const allTechs = await db.select().from(technologies)

  for (const tech of allTechs) {
    try {
      const releases = await fetchLatestReleases(tech.githubRepoUrl, 20)

      for (const release of releases) {
        const existing = await db
          .select({ id: releaseUpdates.id })
          .from(releaseUpdates)
          .where(
            and(
              eq(releaseUpdates.techId, tech.id),
              eq(releaseUpdates.version, release.tag_name),
            ),
          )
          .limit(1)

        if (existing.length > 0) continue

        const summary = await summarizeRelease(release.body || '', tech.name)

        await db
          .insert(releaseUpdates)
          .values({
            techId: tech.id,
            version: release.tag_name,
            title: release.name,
            summary: summary.summary,
            newFeatures: summary.new_features,
            breakingChanges: summary.breaking_changes,
            codeSnippet: summary.code_snippet,
            importanceLevel: summary.importance_level,
            rawReleaseUrl: release.html_url,
            publishedAt: new Date(release.published_at),
          })
          .onConflictDoNothing({
            target: [releaseUpdates.techId, releaseUpdates.version],
          })
      }

      results.push({ tech: tech.name, releases: releases.length })
    } catch (err) {
      console.error(`Failed to fetch releases for ${tech.name}:`, err)
    }
  }

  return NextResponse.json({ success: true, results })
}
