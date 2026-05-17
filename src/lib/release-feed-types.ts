export const importanceFilters = ['all', 'medium', 'high', 'critical'] as const
export const readFilters = ['all', 'unread'] as const

export type ImportanceFilter = (typeof importanceFilters)[number]
export type ReadFilter = (typeof readFilters)[number]

export type ReleaseFeedTechOption = {
  id: string
  name: string
  slug: string
}

export type ReleaseFeedItem = {
  id: string
  version: string
  title: string | null
  summary: string | null
  newFeatures: string[] | null
  breakingChanges: string[] | null
  codeSnippet: string | null
  importanceLevel: string | null
  publishedAt: string | null
  rawReleaseUrl: string | null
  techName: string
  techSlug: string
  isRead: boolean
  readAt: string | null
  isPrerelease: boolean
  summaryModel: string | null
  summarizedAt: string | null
}

export type ReleaseFeedPage = {
  items: ReleaseFeedItem[]
  nextCursor: string | null
}

export function parseImportanceFilter(value: string | string[] | undefined): ImportanceFilter {
  const raw = Array.isArray(value) ? value[0] : value
  return importanceFilters.includes(raw as ImportanceFilter) ? (raw as ImportanceFilter) : 'all'
}

export function parseReadFilter(value: string | string[] | undefined): ReadFilter {
  const raw = Array.isArray(value) ? value[0] : value
  return readFilters.includes(raw as ReadFilter) ? (raw as ReadFilter) : 'all'
}

export function parseTechFilter(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && /^[a-z0-9-]+$/.test(raw) ? raw : 'all'
}

export function parseSearchFilter(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ? raw.trim().slice(0, 80) : ''
}
