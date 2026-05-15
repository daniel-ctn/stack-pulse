export const importanceFilters = ['all', 'medium', 'high', 'critical'] as const

export type ImportanceFilter = (typeof importanceFilters)[number]

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
}

export type ReleaseFeedPage = {
  items: ReleaseFeedItem[]
  nextCursor: string | null
}

export function parseImportanceFilter(value: string | string[] | undefined): ImportanceFilter {
  const raw = Array.isArray(value) ? value[0] : value
  return importanceFilters.includes(raw as ImportanceFilter) ? (raw as ImportanceFilter) : 'all'
}
