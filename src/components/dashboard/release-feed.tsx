'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Link01Icon } from 'hugeicons-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useEffect, useMemo, useTransition, type ReactNode } from 'react'

import { markReleaseUnread, markReleasesRead } from '@/lib/actions'
import {
  importanceFilters,
  readFilters,
  type ImportanceFilter,
  type ReadFilter,
  type ReleaseFeedItem,
  type ReleaseFeedPage,
  type ReleaseFeedTechOption,
} from '@/lib/release-feed-types'
import { cn } from '@/lib/utils'

function sha(id: string) {
  return id.replace(/-/g, '').slice(0, 7)
}

const importanceTone: Record<string, { label: string; pill: string; dot: string }> = {
  critical: {
    label: 'CRITICAL',
    pill: 'bg-rose/10 text-rose border-rose/30',
    dot: 'bg-rose',
  },
  high: {
    label: 'HIGH',
    pill: 'bg-amber/10 text-amber border-amber/30',
    dot: 'bg-amber',
  },
  medium: {
    label: 'MEDIUM',
    pill: 'bg-cyan/10 text-cyan border-cyan/30',
    dot: 'bg-cyan',
  },
  low: {
    label: 'LOW',
    pill: 'bg-dust/10 text-fade border-fade/20',
    dot: 'bg-mute',
  },
}

const filterLabels: Record<ImportanceFilter, string> = {
  all: 'all',
  medium: 'medium+',
  high: 'high+',
  critical: 'critical',
}

export function ReleaseFeed({
  initialImportance,
  initialRead,
  initialTech,
  initialSearch,
  initialPage,
  techOptions,
}: {
  initialImportance: ImportanceFilter
  initialRead: ReadFilter
  initialTech: string
  initialSearch: string
  initialPage: ReleaseFeedPage
  techOptions: ReleaseFeedTechOption[]
}) {
  const queryClient = useQueryClient()
  const [isMarking, startMarking] = useTransition()
  const [importance, setImportance] = useQueryState(
    'importance',
    parseAsStringLiteral(importanceFilters).withDefault('all'),
  )
  const [read, setRead] = useQueryState(
    'read',
    parseAsStringLiteral(readFilters).withDefault('all'),
  )
  const [tech, setTech] = useQueryState('tech')
  const [search, setSearch] = useQueryState('q')
  const techFilter = tech || 'all'
  const searchFilter = search || ''

  const query = useInfiniteQuery({
    queryKey: ['release-feed', importance, read, techFilter, searchFilter],
    queryFn: ({ pageParam }) =>
      fetchReleasePage({
        importance,
        read,
        tech: techFilter,
        search: searchFilter,
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData:
      importance === initialImportance &&
      read === initialRead &&
      techFilter === initialTech &&
      searchFilter === initialSearch
        ? {
            pages: [initialPage],
            pageParams: [null],
          }
        : undefined,
  })

  const releases = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )
  const rowCount = query.hasNextPage ? releases.length + 1 : releases.length
  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 360,
    overscan: 4,
    getItemKey: (index) => releases[index]?.id ?? `loader-${importance}`,
  })
  const virtualItems = rowVirtualizer.getVirtualItems()
  const lastVirtualItem = virtualItems[virtualItems.length - 1]

  useEffect(() => {
    if (
      lastVirtualItem &&
      lastVirtualItem.index >= releases.length - 1 &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      query.fetchNextPage()
    }
  }, [lastVirtualItem, releases.length, query])

  const breakingCount = releases.filter(
    (release) => release.importanceLevel === 'critical' || release.importanceLevel === 'high',
  ).length
  const unreadCount = releases.filter((release) => !release.isRead).length
  const today = new Date()
  const todayCount = releases.filter((release) => {
    if (!release.publishedAt) return false
    return new Date(release.publishedAt).toDateString() === today.toDateString()
  }).length

  const refreshFeed = () => queryClient.invalidateQueries({ queryKey: ['release-feed'] })

  const handleMarkVisibleRead = () => {
    const unreadIds = releases.filter((release) => !release.isRead).map((release) => release.id)
    if (unreadIds.length === 0) return

    startMarking(async () => {
      const result = await markReleasesRead(unreadIds)
      if (result.ok) refreshFeed()
    })
  }

  const handleToggleRead = (release: ReleaseFeedItem) => {
    startMarking(async () => {
      const result = release.isRead
        ? await markReleaseUnread(release.id)
        : await markReleasesRead([release.id])
      if (result.ok) refreshFeed()
    })
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-md overflow-hidden">
        <Stat label="loaded" value={String(releases.length)} tone="ink" />
        <Stat label="unread" value={String(unreadCount)} tone="cyan" />
        <Stat label="today" value={String(todayCount)} tone="lime" />
        <Stat label="breaking" value={String(breakingCount)} tone="rose" />
      </div>

      <div className="mt-4 frame p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="text-fade tracking-[0.16em] uppercase">importance</span>
            <Segmented>
              {importanceFilters.map((filter) => (
                <SegmentButton
                  key={filter}
                  active={importance === filter}
                  onClick={() => setImportance(filter)}
                >
                  {filterLabels[filter]}
                </SegmentButton>
              ))}
            </Segmented>

            <span className="ml-0 text-fade tracking-[0.16em] uppercase sm:ml-2">status</span>
            <Segmented>
              {readFilters.map((filter) => (
                <SegmentButton
                  key={filter}
                  active={read === filter}
                  onClick={() => setRead(filter)}
                >
                  {filter}
                </SegmentButton>
              ))}
            </Segmented>
          </div>

          <button
            type="button"
            onClick={handleMarkVisibleRead}
            disabled={isMarking || unreadCount === 0}
            className="justify-self-start rounded-md border border-ruling bg-shade px-3 py-1.5 font-mono text-[11px] text-dust transition-colors hover:border-lime hover:text-lime disabled:opacity-50 lg:justify-self-end"
          >
            mark visible read
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[190px_1fr]">
          <select
            value={techFilter}
            onChange={(e) => setTech(e.target.value === 'all' ? null : e.target.value)}
            className="h-9 rounded-md border border-line bg-void px-3 font-mono text-[12px] text-dust"
          >
            <option value="all">all stacks</option>
            {techOptions.map((option) => (
              <option key={option.id} value={option.slug}>
                {option.slug}
              </option>
            ))}
          </select>
          <input
            value={searchFilter}
            onChange={(e) => setSearch(e.target.value || null)}
            placeholder="search releases, versions, summaries..."
            className="h-9 rounded-md border border-line bg-void px-3 font-mono text-[12px] text-dust placeholder:text-fade"
          />
        </div>
      </div>

      {query.isLoading ? (
        <FeedStatus label="loading feed..." />
      ) : query.isError ? (
        <FeedStatus label="could not load releases" tone="rose" />
      ) : releases.length === 0 ? (
        <EmptyFilteredFeed importance={importance} />
      ) : (
        <div className="mt-10 relative">
          <div
            className="absolute left-[7px] top-2 w-px bg-line"
            style={{ height: rowVirtualizer.getTotalSize() }}
            aria-hidden
          />

          <div
            className="relative"
            style={{
              height: rowVirtualizer.getTotalSize(),
            }}
          >
            {virtualItems.map((virtualItem) => {
              const release = releases[virtualItem.index]

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 top-0 w-full pb-6"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  {release ? (
                    <ReleaseCard
                      release={release}
                      index={virtualItem.index}
                      onToggleRead={handleToggleRead}
                      isMarking={isMarking}
                    />
                  ) : (
                    <FeedStatus label="loading more..." compact />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

async function fetchReleasePage({
  importance,
  read,
  tech,
  search,
  cursor,
}: {
  importance: ImportanceFilter
  read: ReadFilter
  tech: string
  search: string
  cursor: string | null
}) {
  const params = new URLSearchParams()
  params.set('importance', importance)
  params.set('read', read)
  params.set('tech', tech)
  if (search) params.set('q', search)
  if (cursor) params.set('cursor', cursor)

  const response = await fetch(`/api/releases?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to load releases')

  return (await response.json()) as ReleaseFeedPage
}

function ReleaseCard({
  release,
  index,
  onToggleRead,
  isMarking,
}: {
  release: ReleaseFeedItem
  index: number
  onToggleRead: (release: ReleaseFeedItem) => void
  isMarking: boolean
}) {
  const tone = importanceTone[release.importanceLevel || 'medium'] || importanceTone.medium
  const hasBreaking =
    release.breakingChanges &&
    Array.isArray(release.breakingChanges) &&
    release.breakingChanges.length > 0
  const hasNewFeatures =
    release.newFeatures && Array.isArray(release.newFeatures) && release.newFeatures.length > 0

  return (
    <article className={`relative pl-10 animate-fade-up stagger-${Math.min(index + 1, 10)}`}>
      <span
        className={`absolute left-0 top-[18px] w-3.5 h-3.5 rounded-full border-2 border-void ${tone.dot} ring-1 ring-line`}
        aria-hidden
      />

      <div className="frame overflow-hidden">
        <div className="px-4 py-3 border-b border-line flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px]">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${tone.dot}`} />
          <span className="text-fade">{sha(release.id)}</span>
          <span className="text-cyan">{release.techName.toLowerCase()}</span>
          <span className="text-dust">@</span>
          <span className="text-amber">{release.version}</span>
          <span
            className={`ml-1 inline-flex items-center rounded-[3px] border px-1.5 py-0.5 text-[9px] font-bold tracking-widest ${tone.pill}`}
          >
            {tone.label}
          </span>
          {release.publishedAt && (
            <span className="ml-auto text-fade">
              {new Date(release.publishedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        <div className="px-5 py-5">
          <h2 className="font-mono text-[18px] font-semibold tracking-tight text-ink">
            {release.title || release.version}
          </h2>

          {release.summary && (
            <p className="mt-2.5 text-[14px] text-dust leading-relaxed">{release.summary}</p>
          )}

          {(release.isPrerelease || release.summaryModel || release.summarizedAt) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] text-fade">
              {release.isPrerelease && (
                <span className="rounded-[3px] border border-violet/30 bg-violet/10 px-1.5 py-0.5 text-violet">
                  prerelease
                </span>
              )}
              {release.summaryModel && <span>model: {release.summaryModel}</span>}
              {release.summarizedAt && (
                <span>
                  summarized{' '}
                  {new Date(release.summarizedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          )}

          {(hasBreaking || hasNewFeatures) && (
            <div className="mt-5 rounded-md border border-line bg-void overflow-hidden">
              <div className="px-3 py-2 border-b border-line flex items-center justify-between font-mono text-[10px] text-fade">
                <span>diff</span>
                <span>
                  {(hasBreaking ? release.breakingChanges!.length : 0) +
                    (hasNewFeatures ? release.newFeatures!.length : 0)}{' '}
                  changes
                </span>
              </div>
              <div className="font-mono text-[12.5px] leading-[1.7]">
                {hasBreaking &&
                  release.breakingChanges!.map((change, j) => (
                    <div
                      key={`b-${j}`}
                      className="px-3 py-1 bg-rose/[0.04] border-l-2 border-rose flex gap-3"
                    >
                      <span className="text-rose select-none shrink-0">-</span>
                      <span className="text-ink">{change}</span>
                    </div>
                  ))}
                {hasNewFeatures &&
                  release.newFeatures!.map((feature, j) => (
                    <div
                      key={`n-${j}`}
                      className="px-3 py-1 bg-emerald/[0.04] border-l-2 border-emerald flex gap-3"
                    >
                      <span className="text-emerald select-none shrink-0">+</span>
                      <span className="text-ink">{feature}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {release.codeSnippet && (
            <div className="mt-5 rounded-md border border-line bg-void overflow-hidden">
              <div className="px-3 py-2 border-b border-line flex items-center justify-between font-mono text-[10px] text-fade">
                <span>snippet.ts</span>
                <span className="text-mute">readonly</span>
              </div>
              <pre className="!m-0 !border-0 !rounded-none !bg-void px-4 py-3 text-[12.5px]">
                <code>{release.codeSnippet}</code>
              </pre>
            </div>
          )}

          {release.rawReleaseUrl && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <a
                href={release.rawReleaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fade hover:text-lime transition-colors"
              >
                <Link01Icon className="w-3 h-3" />
                view source on github
                <span className="text-mute">↗</span>
              </a>
              <button
                type="button"
                onClick={() => onToggleRead(release)}
                disabled={isMarking}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors disabled:opacity-50',
                  release.isRead
                    ? 'border-ruling text-fade hover:border-cyan hover:text-cyan'
                    : 'border-lime/30 bg-lime-dim text-lime hover:bg-lime/15',
                )}
              >
                {release.isRead ? 'mark unread' : 'mark read'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'ink' | 'lime' | 'rose' | 'cyan'
}) {
  const toneClass =
    tone === 'lime'
      ? 'text-lime'
      : tone === 'rose'
        ? 'text-rose'
        : tone === 'cyan'
          ? 'text-cyan'
          : 'text-ink'
  return (
    <div className="bg-shade px-4 py-3">
      <div className="font-mono text-[10px] text-fade tracking-[0.2em] uppercase">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function Segmented({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-md border border-line bg-void p-1">
      {children}
    </div>
  )
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-[3px] px-2.5 py-1 text-fade transition-colors hover:text-ink',
        active && 'bg-lift text-lime shadow-[inset_0_0_0_1px_var(--line)]',
      )}
    >
      {children}
    </button>
  )
}

function EmptyFilteredFeed({ importance }: { importance: ImportanceFilter }) {
  return (
    <div className="mt-12 frame">
      <div className="frame-titlebar">
        <span className="text-dust">~/feed/{filterLabels[importance]}</span>
        <span className="ml-auto text-mute">empty</span>
      </div>
      <div className="px-6 py-16 text-center">
        <p className="font-mono text-[13px] text-dust">no releases match this filter.</p>
        <p className="font-mono text-[11px] text-fade mt-1">try widening importance.</p>
      </div>
    </div>
  )
}

function FeedStatus({
  label,
  tone = 'lime',
  compact = false,
}: {
  label: string
  tone?: 'lime' | 'rose'
  compact?: boolean
}) {
  return (
    <div className={cn('font-mono text-[12px]', compact ? 'pl-10 py-4' : 'mt-12 frame p-6')}>
      <span className={tone === 'rose' ? 'text-rose' : 'text-lime'}>$ </span>
      <span className="text-dust">{label}</span>
    </div>
  )
}
