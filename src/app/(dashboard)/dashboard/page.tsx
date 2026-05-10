import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { releaseUpdates, userTechPreferences, technologies } from '@/db/schema'
import { headers } from 'next/headers'
import { eq, inArray, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Sparkles, ExternalLink, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  })

  if (!session) redirect('/sign-in')

  const prefs = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, session.user.id))

  const techIds = prefs.map((p) => p.techId)

  if (techIds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center animate-fade-up">
          <p className="font-mono text-xs text-accent tracking-[0.2em] uppercase mb-4">Your Feed</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Choose your stack first
          </h1>
          <p className="mt-3 text-fg-muted">
            You haven&apos;t selected any technologies yet. Pick the frameworks and libraries you
            use to get started.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-fg px-6 py-3 text-sm font-semibold text-bg hover:bg-fg-muted transition-colors"
          >
            Set Up Your Stack
            <Zap className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const releases = await db
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
      techName: technologies.name,
      techSlug: technologies.slug,
    })
    .from(releaseUpdates)
    .innerJoin(technologies, eq(releaseUpdates.techId, technologies.id))
    .where(inArray(releaseUpdates.techId, techIds))
    .orderBy(desc(releaseUpdates.publishedAt))
    .limit(30)

  const borderColorMap: Record<string, string> = {
    critical: 'border-accent',
    high: 'border-amber-500',
    medium: 'border-blue-500',
    low: 'border-border-strong',
  }

  const badgeColorMap: Record<string, string> = {
    critical: 'bg-accent/10 text-accent border-accent/20',
    high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    low: 'bg-fg-dim/10 text-fg-dim border-fg-dim/20',
  }

  return (
    <div className="flex-1">
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-display text-sm font-semibold tracking-tight">
          DevDigest
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/onboarding"
            className="text-xs text-fg-dim hover:text-fg-muted transition-colors"
          >
            Edit Stack
          </Link>
          <span className="text-xs text-fg-dim">{session.user.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="animate-fade-up">
          <p className="font-mono text-xs text-accent tracking-[0.2em] uppercase mb-3">
            Daily Digest
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Your Feed</h1>
          <p className="mt-2 text-fg-muted">
            Latest releases across your stack — AI-summarized for quick reading
          </p>
        </div>

        {releases.length === 0 ? (
          <div className="mt-16 text-center py-20 border border-border rounded-2xl animate-fade-up stagger-1">
            <Sparkles className="w-8 h-8 text-fg-dim mx-auto mb-3" />
            <p className="text-fg-muted">No releases yet. We&apos;re monitoring your stack.</p>
            <p className="text-xs text-fg-dim mt-1">
              New releases will appear here as they&apos;re published.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-8">
            {releases.map((release, i) => {
              const borderClass =
                borderColorMap[release.importanceLevel || 'medium'] || borderColorMap.medium
              const badgeClass =
                badgeColorMap[release.importanceLevel || 'medium'] || badgeColorMap.medium

              const hasBreaking =
                release.breakingChanges &&
                Array.isArray(release.breakingChanges) &&
                release.breakingChanges.length > 0

              const hasNewFeatures =
                release.newFeatures &&
                Array.isArray(release.newFeatures) &&
                release.newFeatures.length > 0

              return (
                <article
                  key={release.id}
                  className={`border border-border rounded-xl bg-surface p-6 border-l-4 ${borderClass} animate-fade-up stagger-${Math.min(i + 1, 10)}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center rounded-md border border-border bg-surface-elevated px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                        {release.techName}
                      </span>
                      <span className="font-mono text-sm font-medium">{release.version}</span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${badgeClass}`}
                      >
                        {release.importanceLevel}
                      </span>
                    </div>
                    {release.publishedAt && (
                      <span className="text-xs text-fg-dim shrink-0">
                        {new Date(release.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-xl font-semibold tracking-tight mt-2">
                    {release.title || release.version}
                  </h2>

                  {release.summary && (
                    <p className="mt-3 text-sm text-fg-muted leading-relaxed">{release.summary}</p>
                  )}

                  {hasBreaking && (
                    <div className="mt-5 rounded-lg border border-danger/20 bg-danger/5 p-4">
                      <p className="text-xs font-semibold text-danger uppercase tracking-widest mb-2">
                        Breaking Changes
                      </p>
                      <ul className="space-y-1">
                        {release.breakingChanges!.map((change, j) => (
                          <li
                            key={j}
                            className="text-sm text-fg-muted pl-3 border-l-2 border-danger/30"
                          >
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {hasNewFeatures && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-success uppercase tracking-widest mb-2">
                        What&apos;s New
                      </p>
                      <ul className="space-y-1">
                        {release.newFeatures!.map((feature, j) => (
                          <li
                            key={j}
                            className="text-sm text-fg-muted pl-3 border-l-2 border-success/30"
                          >
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {release.codeSnippet && (
                    <div className="mt-4">
                      <pre className="!bg-[#0a0a0b] !border-border-strong">
                        <code>{release.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {release.rawReleaseUrl && (
                    <a
                      href={release.rawReleaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-fg-dim hover:text-fg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View full release
                    </a>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
