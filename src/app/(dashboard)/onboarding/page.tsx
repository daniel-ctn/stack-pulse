import { auth } from '@/lib/auth'
import { db } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight01Icon } from 'hugeicons-react'
import { Logo } from '@/components/logo'
import { TechSelector } from '@/components/tech-selector'

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect('/sign-in')

  const allTechs = await db.select().from(technologies)
  const userPrefs = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, session.user.id))

  return (
    <div className="flex-1">
      <header className="border-b border-line px-6 h-14 flex items-center justify-between">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-fade hover:text-dust transition-colors"
          >
            Skip
            <ArrowRight01Icon className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="animate-fade-up">
          <p className="font-mono text-xs text-amber tracking-[0.2em] uppercase mb-3">Step One</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
            Choose Your Stack
          </h1>
          <p className="mt-2 text-dust max-w-lg">
            Select the frameworks and libraries you use. We&apos;ll track their releases and deliver
            AI summaries straight to your feed.
          </p>
        </div>

        <div className="mt-12">
          <TechSelector
            userId={session.user.id}
            allTechs={allTechs}
            initialSelectedIds={userPrefs.map((p) => p.techId)}
          />
        </div>
      </main>
    </div>
  )
}
