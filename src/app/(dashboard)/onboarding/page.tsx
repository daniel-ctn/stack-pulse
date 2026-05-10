import { auth } from '@/lib/auth'
import { db } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  })

  if (!session) redirect('/sign-in')

  const allTechs = await db.select().from(technologies).orderBy(eq(technologies.name, 'asc'))

  const userPrefs = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, session.user.id))

  const selectedIds = new Set(userPrefs.map((p) => p.techId))

  const categories = Array.from(
    new Set(allTechs.map((t) => t.category).filter(Boolean)),
  ) as string[]

  return (
    <div className="flex-1">
      <header className="border-b border-border px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-display text-sm font-semibold tracking-tight">
          DevDigest
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-fg-dim hover:text-fg-muted transition-colors"
          >
            Skip
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="animate-fade-up">
          <p className="font-mono text-xs text-accent tracking-[0.2em] uppercase mb-3">Step One</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">Choose Your Stack</h1>
          <p className="mt-2 text-fg-muted max-w-lg">
            Select the frameworks and libraries you use. We&apos;ll track their releases and deliver
            AI summaries straight to your feed.
          </p>
        </div>

        <div className="mt-12 space-y-16">
          {categories.map((category, catIndex) => {
            const catTechs = allTechs.filter((t) => t.category === category)
            if (catTechs.length === 0) return null

            return (
              <section
                key={category}
                className="animate-fade-up"
                style={{ animationDelay: `${catIndex * 0.1}s` }}
              >
                <h2 className="font-mono text-xs text-fg-dim tracking-[0.2em] uppercase mb-4">
                  {category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catTechs.map((tech) => {
                    const isSelected = selectedIds.has(tech.id)
                    return (
                      <form key={tech.id} action={toggleTech}>
                        <input type="hidden" name="techId" value={tech.id} />
                        <input type="hidden" name="userId" value={session.user.id} />
                        <button
                          type="submit"
                          className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                            isSelected
                              ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                              : 'border-border bg-surface hover:border-border-strong hover:bg-surface-elevated'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{tech.name}</p>
                              {tech.description && (
                                <p className="text-xs text-fg-dim mt-0.5 line-clamp-2">
                                  {tech.description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
                                isSelected
                                  ? 'bg-accent border-accent text-bg'
                                  : 'border-border-strong text-transparent'
                              }`}
                            >
                              <Check className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      </form>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-16 pt-8 border-t border-border animate-fade-up stagger-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-fg px-6 py-3 text-sm font-semibold text-bg hover:bg-fg-muted transition-colors"
          >
            Go to Your Feed
            <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="ml-4 text-xs text-fg-dim">
            {selectedIds.size} {selectedIds.size === 1 ? 'technology' : 'technologies'} selected
          </span>
        </div>
      </main>
    </div>
  )
}

async function toggleTech(formData: FormData) {
  'use server'

  const techId = formData.get('techId') as string
  const userId = formData.get('userId') as string

  if (!techId || !userId) return

  const existing = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(and(eq(userTechPreferences.userId, userId), eq(userTechPreferences.techId, techId)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .delete(userTechPreferences)
      .where(and(eq(userTechPreferences.userId, userId), eq(userTechPreferences.techId, techId)))
  } else {
    await db.insert(userTechPreferences).values({ userId, techId })
  }

  revalidatePath('/onboarding')
}
