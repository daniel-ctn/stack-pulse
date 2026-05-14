import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { releaseUpdates, userTechPreferences, technologies } from '@/db/schema'
import { headers } from 'next/headers'
import { eq, inArray, desc } from 'drizzle-orm'
import Link from 'next/link'
import { SparklesIcon, Link01Icon, ZapIcon } from 'hugeicons-react'
import { Logo } from '@/components/logo'
import { UserMenu } from '@/components/dashboard/user-menu'

function sha(id: string) {
  return id.replace(/-/g, '').slice(0, 7)
}

const importanceTone: Record<string, { label: string; pill: string; bar: string; dot: string }> = {
  critical: {
    label: 'CRITICAL',
    pill: 'bg-rose/10 text-rose border-rose/30',
    bar: 'bg-rose',
    dot: 'bg-rose',
  },
  high: {
    label: 'HIGH',
    pill: 'bg-amber/10 text-amber border-amber/30',
    bar: 'bg-amber',
    dot: 'bg-amber',
  },
  medium: {
    label: 'MEDIUM',
    pill: 'bg-cyan/10 text-cyan border-cyan/30',
    bar: 'bg-cyan',
    dot: 'bg-cyan',
  },
  low: {
    label: 'LOW',
    pill: 'bg-dust/10 text-fade border-fade/20',
    bar: 'bg-ruling',
    dot: 'bg-mute',
  },
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect('/sign-in')

  const prefs = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, session.user.id))

  const techIds = prefs.map((p) => p.techId)

  if (techIds.length === 0) {
    return (
      <div className="flex-1">
        <DashHeader email={session.user.email} />
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
          <div className="max-w-md w-full animate-fade-up">
            <div className="frame">
              <div className="frame-titlebar">
                <span className="win-dots">
                  <span style={{ background: '#fb7185' }} />
                  <span style={{ background: '#fbbf24' }} />
                  <span style={{ background: '#34d399' }} />
                </span>
                <span className="text-dust">~/feed</span>
                <span className="ml-auto text-mute">empty</span>
              </div>
              <div className="p-6 font-mono text-[13px] leading-relaxed">
                <div className="text-fade">{'// no stacks configured'}</div>
                <div className="mt-2">
                  <span className="text-fade">$ </span>
                  <span className="text-rose">error</span>
                  <span className="text-dust">: stack is empty.</span>
                </div>
                <div className="mt-1">
                  <span className="text-fade">$ </span>
                  <span className="text-dust">hint: run </span>
                  <span className="text-lime">stack add &lt;tool&gt;</span>
                  <span className="text-dust"> to begin watching releases.</span>
                </div>
                <Link
                  href="/onboarding"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2.5 text-sm font-semibold text-void hover:bg-lime/85 transition-colors"
                >
                  <span className="text-void/60">$</span>
                  <span>configure stack</span>
                  <ZapIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
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

  // Compute simple stats
  const breakingCount = releases.filter(
    (r) => r.importanceLevel === 'critical' || r.importanceLevel === 'high',
  ).length
  const today = new Date()
  const todayCount = releases.filter((r) => {
    if (!r.publishedAt) return false
    const d = new Date(r.publishedAt)
    return d.toDateString() === today.toDateString()
  }).length

  return (
    <div className="flex-1">
      <DashHeader email={session.user.email} />

      <main className="mx-auto max-w-4xl px-6 py-12 relative z-10">
        {/* Section heading */}
        <div className="animate-fade-up">
          <div className="flex items-center gap-3 font-mono text-[11px] text-fade tracking-[0.2em] uppercase">
            <span className="text-lime">§</span>
            <span>feed</span>
            <span className="text-mute">/</span>
            <span>today</span>
          </div>
          <h1 className="mt-3 font-mono text-3xl sm:text-[40px] font-bold tracking-tight text-ink lowercase">
            your feed<span className="text-lime">.</span>
          </h1>
          <p className="mt-2 text-dust text-[14px]">
            Latest releases across your stack — AI-summarized, scannable, sourced.
          </p>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-px bg-line border border-line rounded-md overflow-hidden">
            <Stat label="releases" value={String(releases.length)} tone="ink" />
            <Stat label="today" value={String(todayCount)} tone="lime" />
            <Stat label="breaking" value={String(breakingCount)} tone="rose" />
          </div>
        </div>

        {releases.length === 0 ? (
          <div className="mt-12 frame">
            <div className="frame-titlebar">
              <span className="text-dust">~/feed/today</span>
              <span className="ml-auto text-mute">empty</span>
            </div>
            <div className="px-6 py-16 text-center">
              <SparklesIcon className="w-7 h-7 text-fade mx-auto mb-3" />
              <p className="font-mono text-[13px] text-dust">no releases yet — we&apos;re watching.</p>
              <p className="font-mono text-[11px] text-fade mt-1">poll interval: every 4h</p>
            </div>
          </div>
        ) : (
          <div className="mt-10 relative">
            {/* Timeline rail */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-line" aria-hidden />

            <div className="space-y-6">
              {releases.map((release, i) => {
                const tone =
                  importanceTone[release.importanceLevel || 'medium'] || importanceTone.medium

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
                    className={`relative pl-10 animate-fade-up stagger-${Math.min(i + 1, 10)}`}
                  >
                    {/* Timeline dot */}
                    <span
                      className={`absolute left-0 top-[18px] w-3.5 h-3.5 rounded-full border-2 border-void ${tone.dot} ring-1 ring-line`}
                      aria-hidden
                    />

                    <div className="frame overflow-hidden">
                      {/* Card header — looks like a commit row */}
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

                      {/* Body */}
                      <div className="px-5 py-5">
                        <h2 className="font-mono text-[18px] font-semibold tracking-tight text-ink">
                          {release.title || release.version}
                        </h2>

                        {release.summary && (
                          <p className="mt-2.5 text-[14px] text-dust leading-relaxed">
                            {release.summary}
                          </p>
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
                          <a
                            href={release.rawReleaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] text-fade hover:text-lime transition-colors"
                          >
                            <Link01Icon className="w-3 h-3" />
                            view source on github
                            <span className="text-mute">↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'ink' | 'lime' | 'rose' }) {
  const toneClass = tone === 'lime' ? 'text-lime' : tone === 'rose' ? 'text-rose' : 'text-ink'
  return (
    <div className="bg-shade px-4 py-3">
      <div className="font-mono text-[10px] text-fade tracking-[0.2em] uppercase">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  )
}

function DashHeader({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </Link>
        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-fade">
          <span className="text-mute">~/</span>
          <span className="text-dust">dashboard</span>
          <span className="text-mute">/</span>
          <span className="text-lime">feed</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <Link
            href="/onboarding"
            className="text-dust hover:text-lime transition-colors"
          >
            edit stack
          </Link>
          <span className="text-mute">·</span>
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  )
}
