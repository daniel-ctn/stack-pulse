import { and, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import {
  releaseFetchRuns,
  releaseUpdates,
  technologies,
  type ReleaseFetchRunDetail,
} from '@/db/schema'
import { summarizeRelease } from '@/lib/ai'
import { fetchLatestReleases, type GithubRelease } from '@/lib/github'

export const RELEASES_PER_TECH = 5

type Tech = typeof technologies.$inferSelect

function isPublishable(release: GithubRelease): boolean {
  return !release.draft && !!release.published_at && !!release.tag_name
}

export async function processTechReleases(tech: Tech): Promise<ReleaseFetchRunDetail> {
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

      const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat'
      const summary = await summarizeRelease({
        repoName: tech.name,
        version: release.tag_name,
        title: release.name,
        body: release.body,
        url: release.html_url,
        prerelease: release.prerelease,
      })

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
          summaryModel: model,
          summarizedAt: new Date(),
          rawReleaseBody: release.body,
          isPrerelease: release.prerelease,
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

export async function createReleaseFetchRun(trigger: string) {
  const [run] = await getDb()
    .insert(releaseFetchRuns)
    .values({ trigger })
    .returning({ id: releaseFetchRuns.id })

  return run.id
}

export async function finishReleaseFetchRun({
  runId,
  details,
}: {
  runId: string
  details: ReleaseFetchRunDetail[]
}) {
  const releasesInserted = details.reduce((sum, detail) => sum + detail.inserted, 0)
  const errors = details.reduce((sum, detail) => sum + detail.errors, 0)

  await getDb()
    .update(releaseFetchRuns)
    .set({
      status: errors > 0 ? 'completed_with_errors' : 'completed',
      technologiesScanned: details.length,
      releasesInserted,
      errors,
      details,
      finishedAt: new Date(),
    })
    .where(eq(releaseFetchRuns.id, runId))

  return { releasesInserted, errors }
}
