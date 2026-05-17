import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ZapIcon } from 'hugeicons-react'

import { Logo } from '@/components/logo'
import { ReleaseFeed } from '@/components/dashboard/release-feed'
import { UserMenu } from '@/components/dashboard/user-menu'
import { getAuth } from '@/lib/auth'
import { getReleaseFeedPage, getUserTechIds, getUserTechOptions } from '@/lib/release-feed'
import {
  parseImportanceFilter,
  parseReadFilter,
  parseSearchFilter,
  parseTechFilter,
} from '@/lib/release-feed-types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  if (!session) redirect('/sign-in')

  const params = await searchParams
  const importance = parseImportanceFilter(params?.importance)
  const read = parseReadFilter(params?.read)
  const tech = parseTechFilter(params?.tech)
  const search = parseSearchFilter(params?.q)
  const techIds = await getUserTechIds(session.user.id)

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

  const [initialPage, techOptions] = await Promise.all([
    getReleaseFeedPage({
      userId: session.user.id,
      techIds,
      importance,
      read,
      tech,
      search,
    }),
    getUserTechOptions(session.user.id),
  ])

  return (
    <div className="flex-1">
      <DashHeader email={session.user.email} />

      <main className="mx-auto max-w-4xl px-6 py-12 relative z-10">
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
        </div>

        <ReleaseFeed
          initialImportance={importance}
          initialRead={read}
          initialTech={tech}
          initialSearch={search}
          initialPage={initialPage}
          techOptions={techOptions}
        />
      </main>
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
          <Link href="/onboarding" className="text-dust hover:text-lime transition-colors">
            edit stack
          </Link>
          <span className="text-mute">·</span>
          <UserMenu email={email} />
        </div>
      </div>
    </header>
  )
}
