import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { releaseUpdates, userTechPreferences, technologies } from '@/db/schema'
import { headers } from 'next/headers'
import { eq, inArray, desc } from 'drizzle-orm'
import Link from 'next/link'
import { SparklesIcon, Link01Icon, ZapIcon } from 'hugeicons-react'
import { Logo } from '@/components/logo'

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
          <p className="font-mono text-xs text-amber tracking-[0.2em] uppercase mb-4">Your Feed</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            Choose your stack first
          </h1>
          <p className="mt-3 text-dust">
            You haven&apos;t selected any technologies yet. Pick the frameworks and libraries you
            use to get started.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber px-6 py-3 text-sm font-semibold text-void hover:bg-amber/80 transition-colors"
          >
            Set Up Your Stack
            <ZapIcon className="w-4 h-4" />
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

  const borderMap: Record<string, string> = {
    critical: 'border-amber',
    high: 'border-amber/60',
    medium: 'border-sky-500',
    low: 'border-ruling',
  }

  const badgeMap: Record<string, string> = {
    critical: 'bg-amber/10 text-amber border-amber/20',
    high: 'bg-amber/5 text-amber border-amber/20',
    medium: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    low: 'bg-dust/10 text-fade border-fade/20',
  }

  return (
    <div className="flex-1">
      <header className="border-b border-line px-6 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/onboarding" className="text-xs text-fade hover:text-dust transition-colors">
            Edit Stack
          </Link>
          <span className="text-xs text-fade">{session.user.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="animate-fade-up">
          <p className="font-mono text-xs text-amber tracking-[0.2em] uppercase mb-3">
            Daily Digest
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">Your Feed</h1>
          <p className="mt-2 text-dust">
            Latest releases across your stack — AI-summarized for quick reading
          </p>
        </div>

        {releases.length === 0 ? (
          <div className="mt-16 text-center py-20 border border-line rounded-2xl animate-fade-up stagger-1">
            <SparklesIcon className="w-8 h-8 text-fade mx-auto mb-3" />
            <p className="text-dust">No releases yet. We&apos;re monitoring your stack.</p>
            <p className="text-xs text-fade mt-1">
              New releases will appear here as they&apos;re published.
            </p>
          </div>
        ) : (
          <div className="mt-12 space-y-8">
            {releases.map((release, i) => {
              const borderClass = borderMap[release.importanceLevel || 'medium'] || borderMap.medium
              const badgeClass = badgeMap[release.importanceLevel || 'medium'] || badgeMap.medium

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
                  className={`border border-line rounded-xl bg-shade p-6 border-l-4 ${borderClass} animate-fade-up stagger-${Math.min(i + 1, 10)}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center rounded-md border border-line bg-lift px-2.5 py-0.5 text-xs font-medium text-dust">
                        {release.techName}
                      </span>
                      <span className="font-mono text-sm font-medium text-ink">
                        {release.version}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${badgeClass}`}
                      >
                        {release.importanceLevel}
                      </span>
                    </div>
                    {release.publishedAt && (
                      <span className="text-xs text-fade shrink-0">
                        {new Date(release.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink mt-2">
                    {release.title || release.version}
                  </h2>

                  {release.summary && (
                    <p className="mt-3 text-sm text-dust leading-relaxed">{release.summary}</p>
                  )}

                  {hasBreaking && (
                    <div className="mt-5 rounded-lg border border-rose/20 bg-rose/5 p-4">
                      <p className="text-xs font-semibold text-rose uppercase tracking-widest mb-2">
                        Breaking Changes
                      </p>
                      <ul className="space-y-1">
                        {release.breakingChanges!.map((change, j) => (
                          <li key={j} className="text-sm text-dust pl-3 border-l-2 border-rose/30">
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {hasNewFeatures && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-emerald uppercase tracking-widest mb-2">
                        What&apos;s New
                      </p>
                      <ul className="space-y-1">
                        {release.newFeatures!.map((feature, j) => (
                          <li
                            key={j}
                            className="text-sm text-dust pl-3 border-l-2 border-emerald/30"
                          >
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {release.codeSnippet && (
                    <div className="mt-4">
                      <pre className="!bg-[#0a0a0b] !border-ruling">
                        <code>{release.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {release.rawReleaseUrl && (
                    <a
                      href={release.rawReleaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-fade hover:text-amber transition-colors"
                    >
                      <Link01Icon className="w-3 h-3" />
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
