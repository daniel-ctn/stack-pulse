import { auth } from '@/lib/auth'
import { db } from '@/db'
import { releaseUpdates, userTechPreferences, technologies } from '@/db/schema'
import { headers } from 'next/headers'
import { eq, inArray, desc } from 'drizzle-orm'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  })

  if (!session) return null

  const prefs = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, session.user.id))

  const techIds = prefs.map((p) => p.techId)

  if (techIds.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">Your Feed</h1>
        <p className="mt-4 text-muted-foreground">
          You haven&apos;t selected any technologies yet. Head to onboarding to pick your stack.
        </p>
        <a
          href="/onboarding"
          className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Set Up Your Stack
        </a>
      </main>
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
    })
    .from(releaseUpdates)
    .innerJoin(technologies, eq(releaseUpdates.techId, technologies.id))
    .where(inArray(releaseUpdates.techId, techIds))
    .orderBy(desc(releaseUpdates.publishedAt))
    .limit(30)

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Your Feed</h1>
      <p className="mt-1 text-sm text-muted-foreground">Latest releases from your stack</p>

      <div className="mt-8 space-y-6">
        {releases.map((release) => {
          const importanceColor = {
            critical: 'border-l-red-500',
            high: 'border-l-amber-500',
            medium: 'border-l-blue-500',
            low: 'border-l-muted-foreground',
          }[release.importanceLevel || 'medium']

          return (
            <article
              key={release.id}
              className={`border border-border rounded-lg pl-4 pr-6 py-4 border-l-4 ${importanceColor}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {release.techName}
                  </span>
                  <h2 className="text-lg font-semibold mt-0.5">
                    {release.title || release.version}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {release.publishedAt ? new Date(release.publishedAt).toLocaleDateString() : ''}
                </span>
              </div>

              {release.summary && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {release.summary}
                </p>
              )}

              {release.breakingChanges &&
                Array.isArray(release.breakingChanges) &&
                release.breakingChanges.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
                      Breaking Changes
                    </span>
                    <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
                      {release.breakingChanges.map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {release.newFeatures &&
                Array.isArray(release.newFeatures) &&
                release.newFeatures.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                      New Features
                    </span>
                    <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
                      {release.newFeatures.map((feature, i) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {release.codeSnippet && (
                <pre className="mt-3 rounded-lg bg-muted p-3 text-xs overflow-x-auto">
                  <code>{release.codeSnippet}</code>
                </pre>
              )}

              {release.rawReleaseUrl && (
                <a
                  href={release.rawReleaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  View full release &rarr;
                </a>
              )}
            </article>
          )
        })}
      </div>
    </main>
  )
}
