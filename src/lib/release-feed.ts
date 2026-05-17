import { and, desc, eq, ilike, inArray, isNull, lt, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { releaseUpdates, technologies, userReadReleases, userTechPreferences } from '@/db/schema'
import type {
  ImportanceFilter,
  ReadFilter,
  ReleaseFeedPage,
  ReleaseFeedTechOption,
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
  tech,
  search,
  cursor,
  limit = RELEASE_FEED_PAGE_SIZE,
}: {
  userId: string
  techIds: string[]
  importance: ImportanceFilter
  read: ReadFilter
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

  if (tech !== 'all') {
    conditions.push(eq(technologies.slug, tech))
  }

  if (search) {
    const pattern = `%${search}%`
    conditions.push(
      or(
        ilike(releaseUpdates.title, pattern),
        ilike(releaseUpdates.summary, pattern),
        ilike(releaseUpdates.version, pattern),
        ilike(technologies.name, pattern),
        ilike(technologies.slug, pattern),
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
    items: pageRows.map((row) => ({
      ...row,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      summarizedAt: row.summarizedAt ? row.summarizedAt.toISOString() : null,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      isRead: !!row.readAt,
    })),
    nextCursor:
      hasNextPage && last?.publishedAt
        ? createCursor({ id: last.id, publishedAt: last.publishedAt })
        : null,
  }
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
