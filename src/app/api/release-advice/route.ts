import { and, desc, eq, lte, type SQL } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getDb } from '@/db'
import { releaseUpdates, technologies, userTechPreferences } from '@/db/schema'
import { adviseOnRelease } from '@/lib/ai'
import { getAuth } from '@/lib/auth'
import { compareLooseVersion, parseLooseVersion } from '@/lib/version'

const MAX_REQUEST_BYTES = 6_000
const MAX_ADVICE_ATTEMPTS_PER_WINDOW = 8
const ADVICE_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const MAX_ADVICE_RATE_LIMIT_KEYS = 5_000

const requestSchema = z.object({
  releaseId: z.uuid(),
  question: z.string().trim().min(4).max(1000),
  currentVersion: z.string().trim().max(80).optional(),
  projectContext: z.string().trim().max(2000).optional(),
})

type AdviceAttempt = { count: number; resetAt: number }
const adviceAttempts = new Map<string, AdviceAttempt>()

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'sign in to ask ai about releases' }, { status: 401 })
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0')
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: 'question is too large' }, { status: 413 })
  }

  let payload: z.infer<typeof requestSchema>
  try {
    const rawBody = await request.text()
    if (rawBody.length > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'question is too large' }, { status: 413 })
    }

    payload = requestSchema.parse(JSON.parse(rawBody))
  } catch {
    return NextResponse.json({ error: 'invalid question' }, { status: 400 })
  }

  if (isAdviceRateLimited(session.user.id)) {
    return NextResponse.json({ error: 'too many ai questions; try again later' }, { status: 429 })
  }

  try {
    const db = getDb()
    const [release] = await db
      .select({
        id: releaseUpdates.id,
        techId: releaseUpdates.techId,
        techName: technologies.name,
        version: releaseUpdates.version,
        title: releaseUpdates.title,
        summary: releaseUpdates.summary,
        newFeatures: releaseUpdates.newFeatures,
        breakingChanges: releaseUpdates.breakingChanges,
        securityNotes: releaseUpdates.securityNotes,
        deprecations: releaseUpdates.deprecations,
        migrationSteps: releaseUpdates.migrationSteps,
        impactSummary: releaseUpdates.impactSummary,
        recommendedAction: releaseUpdates.recommendedAction,
        releaseSignals: releaseUpdates.releaseSignals,
        rawReleaseBody: releaseUpdates.rawReleaseBody,
        rawReleaseUrl: releaseUpdates.rawReleaseUrl,
        publishedAt: releaseUpdates.publishedAt,
      })
      .from(releaseUpdates)
      .innerJoin(technologies, eq(releaseUpdates.techId, technologies.id))
      .innerJoin(
        userTechPreferences,
        and(
          eq(userTechPreferences.techId, releaseUpdates.techId),
          eq(userTechPreferences.userId, session.user.id),
        ),
      )
      .where(eq(releaseUpdates.id, payload.releaseId))
      .limit(1)

    if (!release) {
      return NextResponse.json({ error: 'release was not found' }, { status: 404 })
    }

    const rangeContext = await getStoredUpgradeContext({
      techId: release.techId,
      targetReleaseId: release.id,
      targetVersion: release.version,
      targetPublishedAt: release.publishedAt,
      currentVersion: payload.currentVersion,
    })

    const advice = await adviseOnRelease({
      ...release,
      question: payload.question,
      currentVersion: payload.currentVersion || null,
      projectContext: payload.projectContext || null,
      coverageNote: rangeContext.coverageNote,
      relatedReleases: rangeContext.relatedReleases,
    })

    return NextResponse.json({ advice })
  } catch (err) {
    console.error('release advice failed:', err)
    return NextResponse.json({ error: 'could not generate advice' }, { status: 500 })
  }
}

async function getStoredUpgradeContext({
  techId,
  targetReleaseId,
  targetVersion,
  targetPublishedAt,
  currentVersion,
}: {
  techId: string
  targetReleaseId: string
  targetVersion: string
  targetPublishedAt: Date | null
  currentVersion: string | undefined
}) {
  const target = parseLooseVersion(targetVersion)
  const current = currentVersion ? parseLooseVersion(currentVersion) : null

  if (!currentVersion?.trim()) {
    return {
      coverageNote:
        'No current version was provided, so this answer is based on the selected release only.',
      relatedReleases: [],
    }
  }

  const conditions: SQL[] = [eq(releaseUpdates.techId, techId)]
  if (targetPublishedAt) {
    conditions.push(lte(releaseUpdates.publishedAt, targetPublishedAt))
  }

  const storedReleases = await getDb()
    .select({
      id: releaseUpdates.id,
      version: releaseUpdates.version,
      title: releaseUpdates.title,
      summary: releaseUpdates.summary,
      breakingChanges: releaseUpdates.breakingChanges,
      securityNotes: releaseUpdates.securityNotes,
      deprecations: releaseUpdates.deprecations,
      migrationSteps: releaseUpdates.migrationSteps,
      rawReleaseBody: releaseUpdates.rawReleaseBody,
      publishedAt: releaseUpdates.publishedAt,
    })
    .from(releaseUpdates)
    .where(and(...conditions))
    .orderBy(desc(releaseUpdates.publishedAt), desc(releaseUpdates.id))
    .limit(30)

  if (!current || !target) {
    return {
      coverageNote:
        'The current or target version could not be compared safely, so this answer uses the selected release plus nearby stored releases.',
      relatedReleases: storedReleases
        .filter((release) => release.id !== targetReleaseId)
        .slice(0, 6)
        .map(toRelatedRelease),
    }
  }

  const relatedReleases = storedReleases
    .filter((release) => {
      if (release.id === targetReleaseId) return false
      const version = parseLooseVersion(release.version)
      return (
        version &&
        compareLooseVersion(version, current) > 0 &&
        compareLooseVersion(version, target) <= 0
      )
    })
    .slice(0, 8)
    .map(toRelatedRelease)

  return {
    coverageNote:
      relatedReleases.length > 0
        ? `This answer includes the selected release plus ${relatedReleases.length} stored release(s) between ${currentVersion} and ${targetVersion}. It may still miss releases that are not stored in StackPulse.`
        : `StackPulse did not find stored intermediate releases between ${currentVersion} and ${targetVersion}; this answer is based on the selected release only.`,
    relatedReleases,
  }
}

function toRelatedRelease(release: {
  version: string
  title: string | null
  summary: string | null
  breakingChanges: string[] | null
  securityNotes: string[] | null
  deprecations: string[] | null
  migrationSteps: string[] | null
  rawReleaseBody: string | null
  publishedAt: Date | null
}) {
  return {
    version: release.version,
    title: release.title,
    summary: release.summary,
    breakingChanges: release.breakingChanges,
    securityNotes: release.securityNotes,
    deprecations: release.deprecations,
    migrationSteps: release.migrationSteps,
    rawReleaseBody: release.rawReleaseBody,
    publishedAt: release.publishedAt ? release.publishedAt.toISOString() : null,
  }
}

function isAdviceRateLimited(userId: string) {
  const now = Date.now()
  pruneAdviceAttempts(now)

  const current = adviceAttempts.get(userId)
  if (!current || current.resetAt <= now) {
    adviceAttempts.set(userId, { count: 1, resetAt: now + ADVICE_RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (current.count >= MAX_ADVICE_ATTEMPTS_PER_WINDOW) return true

  current.count += 1
  return false
}

function pruneAdviceAttempts(now: number) {
  if (adviceAttempts.size < MAX_ADVICE_RATE_LIMIT_KEYS) return

  for (const [key, attempt] of adviceAttempts) {
    if (attempt.resetAt <= now) adviceAttempts.delete(key)
  }

  while (adviceAttempts.size >= MAX_ADVICE_RATE_LIMIT_KEYS) {
    const oldestKey = adviceAttempts.keys().next().value
    if (!oldestKey) break
    adviceAttempts.delete(oldestKey)
  }
}
