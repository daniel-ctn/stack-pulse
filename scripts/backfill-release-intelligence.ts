import 'dotenv/config'
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm'

import { getDb } from '../src/db'
import { releaseUpdates, technologies } from '../src/db/schema'
import { summarizeRelease } from '../src/lib/ai'

const DEFAULT_LIMIT = 10

type Args = {
  dryRun: boolean
  limit: number
  techSlug: string | null
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  let limit = DEFAULT_LIMIT
  let techSlug: string | null = null

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      const parsed = Number(arg.slice('--limit='.length))
      if (Number.isInteger(parsed) && parsed > 0) limit = parsed
    }

    if (arg.startsWith('--tech=')) {
      const slug = arg.slice('--tech='.length).trim()
      if (slug) techSlug = slug
    }
  }

  return {
    dryRun: args.includes('--dry-run'),
    limit,
    techSlug,
  }
}

async function main() {
  const args = parseArgs()
  const db = getDb()
  const conditions = [
    isNull(releaseUpdates.releaseSignals),
    isNotNull(releaseUpdates.rawReleaseUrl),
  ]

  if (args.techSlug) {
    conditions.push(eq(technologies.slug, args.techSlug))
  }

  const releases = await db
    .select({
      id: releaseUpdates.id,
      version: releaseUpdates.version,
      title: releaseUpdates.title,
      rawReleaseBody: releaseUpdates.rawReleaseBody,
      rawReleaseUrl: releaseUpdates.rawReleaseUrl,
      isPrerelease: releaseUpdates.isPrerelease,
      publishedAt: releaseUpdates.publishedAt,
      techName: technologies.name,
      techSlug: technologies.slug,
    })
    .from(releaseUpdates)
    .innerJoin(technologies, eq(releaseUpdates.techId, technologies.id))
    .where(and(...conditions))
    .orderBy(desc(releaseUpdates.publishedAt), desc(releaseUpdates.id))
    .limit(args.limit)

  console.log(
    `Found ${releases.length} release(s) to backfill` +
      `${args.techSlug ? ` for ${args.techSlug}` : ''}` +
      `${args.dryRun ? ' (dry run)' : ''}.`,
  )

  if (args.dryRun) {
    for (const release of releases) {
      console.log(`- ${release.techSlug}@${release.version} ${release.rawReleaseUrl}`)
    }
    return
  }

  let updated = 0
  let failed = 0

  for (const release of releases) {
    try {
      console.log(`Backfilling ${release.techSlug}@${release.version}...`)
      const summary = await summarizeRelease({
        repoName: release.techName,
        version: release.version,
        title: release.title,
        body: release.rawReleaseBody,
        url: release.rawReleaseUrl!,
        prerelease: release.isPrerelease,
      })

      await db
        .update(releaseUpdates)
        .set({
          securityNotes: summary.security_notes,
          deprecations: summary.deprecations,
          migrationSteps: summary.migration_steps,
          impactSummary: summary.impact_summary ?? null,
          recommendedAction: summary.recommended_action ?? null,
          releaseSignals: summary.release_signals,
          summaryModel: process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat',
          summarizedAt: new Date(),
        })
        .where(eq(releaseUpdates.id, release.id))

      updated++
    } catch (err) {
      failed++
      console.error(`Failed ${release.techSlug}@${release.version}:`, err)
    }
  }

  console.log(`Backfill complete. updated=${updated}, failed=${failed}`)
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
