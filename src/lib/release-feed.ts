import { and, desc, eq, ilike, inArray, isNull, lt, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { releaseUpdates, technologies, userReadReleases, userTechPreferences } from '@/db/schema'
import type {
  ImportanceFilter,
  ReadFilter,
  ReleaseFeedPage,
  ReleaseFeedTechOption,
  SignalFilter,
} from '@/lib/release-feed-types'

export const RELEASE_FEED_PAGE_SIZE = 30

type FeedCursor = {
  publishedAt: string
  id: string
}

const filterLevels: Record<ImportanceFilter, Array<'low' | 'medium' | 'high' | 'critical'> | null> =
  {
    all: null,
    medium: ['medium', 'high', 'critical'],
    high: ['high', 'critical'],
    critical: ['critical'],
  }

export async function getUserTechIds(userId: string) {
  const prefs = await getDb()
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, userId))

  return prefs.map((p) => p.techId)
}

export async function getUserTechOptions(userId: string): Promise<ReleaseFeedTechOption[]> {
  return getDb()
    .select({
      id: technologies.id,
      name: technologies.name,
      slug: technologies.slug,
    })
    .from(userTechPreferences)
    .innerJoin(technologies, eq(userTechPreferences.techId, technologies.id))
    .where(eq(userTechPreferences.userId, userId))
    .orderBy(technologies.name)
}

export async function getReleaseFeedPage({
  userId,
  techIds,
  importance,
  read,
  signal,
  tech,
  search,
  cursor,
  limit = RELEASE_FEED_PAGE_SIZE,
}: {
  userId: string
  techIds: string[]
  importance: ImportanceFilter
  read: ReadFilter
  signal: SignalFilter
  tech: string
  search: string
  cursor?: string | null
  limit?: number
}): Promise<ReleaseFeedPage> {
  if (techIds.length === 0) {
    return { items: [], nextCursor: null }
  }

  const levels = filterLevels[importance]
  const cursorValue = parseCursor(cursor)
  const conditions = [inArray(releaseUpdates.techId, techIds)]

  if (levels) {
    conditions.push(inArray(releaseUpdates.importanceLevel, levels))
  }

  if (read === 'unread') {
    conditions.push(isNull(userReadReleases.releaseId))
  }

  if (signal !== 'all') {
    conditions.push(createSignalCondition(signal))
  }

  if (tech !== 'all') {
    conditions.push(eq(technologies.slug, tech))
  }

  if (search) {
    const pattern = `%${search}%`
    conditions.push(
      or(
        ilike(releaseUpdates.title, pattern),
        ilike(releaseUpdates.summary, pattern),
        ilike(releaseUpdates.impactSummary, pattern),
        ilike(releaseUpdates.recommendedAction, pattern),
        ilike(releaseUpdates.version, pattern),
        ilike(technologies.name, pattern),
        ilike(technologies.slug, pattern),
        sql`${releaseUpdates.securityNotes}::text ILIKE ${pattern}`,
        sql`${releaseUpdates.deprecations}::text ILIKE ${pattern}`,
        sql`${releaseUpdates.migrationSteps}::text ILIKE ${pattern}`,
      )!,
    )
  }

  if (cursorValue) {
    const cursorDate = new Date(cursorValue.publishedAt)
    conditions.push(
      or(
        lt(releaseUpdates.publishedAt, cursorDate),
        and(eq(releaseUpdates.publishedAt, cursorDate), lt(releaseUpdates.id, cursorValue.id)),
      )!,
    )
  }

  const rows = await getDb()
    .select({
      id: releaseUpdates.id,
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
      codeSnippet: releaseUpdates.codeSnippet,
      importanceLevel: releaseUpdates.importanceLevel,
      publishedAt: releaseUpdates.publishedAt,
      rawReleaseUrl: releaseUpdates.rawReleaseUrl,
      isPrerelease: releaseUpdates.isPrerelease,
      summaryModel: releaseUpdates.summaryModel,
      summarizedAt: releaseUpdates.summarizedAt,
      readAt: userReadReleases.readAt,
      techName: technologies.name,
      techSlug: technologies.slug,
    })
    .from(releaseUpdates)
    .innerJoin(technologies, eq(releaseUpdates.techId, technologies.id))
    .leftJoin(
      userReadReleases,
      and(eq(userReadReleases.releaseId, releaseUpdates.id), eq(userReadReleases.userId, userId)),
    )
    .where(and(...conditions))
    .orderBy(desc(releaseUpdates.publishedAt), desc(releaseUpdates.id))
    .limit(limit + 1)

  const pageRows = rows.slice(0, limit)
  const last = pageRows[pageRows.length - 1]
  const hasNextPage = rows.length > limit

  return {
    items: pageRows.map((row) => {
      const releaseSignals = createReleaseSignals(row)

      return {
        ...row,
        releaseSignals,
        publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        summarizedAt: row.summarizedAt ? row.summarizedAt.toISOString() : null,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        isRead: !!row.readAt,
      }
    }),
    nextCursor:
      hasNextPage && last?.publishedAt
        ? createCursor({ id: last.id, publishedAt: last.publishedAt })
        : null,
  }
}

function createSignalCondition(signal: Exclude<SignalFilter, 'all'>) {
  if (signal === 'breaking') {
    return or(
      sql`${releaseUpdates.releaseSignals} ? ${signal}`,
      sql`coalesce(jsonb_array_length(${releaseUpdates.breakingChanges}), 0) > 0`,
    )!
  }

  if (signal === 'deprecation') {
    return or(
      sql`${releaseUpdates.releaseSignals} ? ${signal}`,
      sql`coalesce(jsonb_array_length(${releaseUpdates.deprecations}), 0) > 0`,
    )!
  }

  if (signal === 'migration') {
    return or(
      sql`${releaseUpdates.releaseSignals} ? ${signal}`,
      sql`coalesce(jsonb_array_length(${releaseUpdates.migrationSteps}), 0) > 0`,
    )!
  }

  if (signal === 'feature') {
    return or(
      sql`${releaseUpdates.releaseSignals} ? ${signal}`,
      sql`coalesce(jsonb_array_length(${releaseUpdates.newFeatures}), 0) > 0`,
    )!
  }

  if (signal === 'security') {
    return or(
      sql`${releaseUpdates.releaseSignals} ? ${signal}`,
      sql`coalesce(jsonb_array_length(${releaseUpdates.securityNotes}), 0) > 0`,
    )!
  }

  return sql`${releaseUpdates.releaseSignals} ? ${signal}`
}

function createReleaseSignals(row: {
  releaseSignals: string[] | null
  breakingChanges: string[] | null
  securityNotes: string[] | null
  deprecations: string[] | null
  migrationSteps: string[] | null
  newFeatures: string[] | null
}) {
  const signals = new Set(row.releaseSignals ?? [])

  if (row.breakingChanges?.length) signals.add('breaking')
  if (row.securityNotes?.length) signals.add('security')
  if (row.deprecations?.length) signals.add('deprecation')
  if (row.migrationSteps?.length) signals.add('migration')
  if (row.newFeatures?.length) signals.add('feature')

  return Array.from(signals)
}

function createCursor(item: { publishedAt: Date; id: string }) {
  return Buffer.from(
    JSON.stringify({ publishedAt: item.publishedAt.toISOString(), id: item.id }),
  ).toString('base64url')
}

function parseCursor(cursor: string | null | undefined): FeedCursor | null {
  if (!cursor) return null

  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as FeedCursor
    if (!parsed.id || !parsed.publishedAt || Number.isNaN(Date.parse(parsed.publishedAt))) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}
