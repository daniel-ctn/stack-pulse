import { auth } from '@/lib/auth'
import { db } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Tick01Icon, ArrowRight01Icon } from 'hugeicons-react'
import { Logo } from '@/components/logo'

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  })

  if (!session) redirect('/sign-in')

  const allTechs = (await db.select().from(technologies)).sort(() => Math.random() - 0.5)

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
                <h2 className="font-mono text-xs text-fade tracking-[0.2em] uppercase mb-4">
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
                              ? 'border-amber bg-amber-dim ring-1 ring-amber/20'
                              : 'border-line bg-shade hover:border-ruling hover:bg-lift'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-ink truncate">{tech.name}</p>
                              {tech.description && (
                                <p className="text-xs text-fade mt-0.5 line-clamp-2">
                                  {tech.description}
                                </p>
                              )}
                            </div>
                            <span
                              className={`shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
                                isSelected
                                  ? 'bg-amber border-amber text-void'
                                  : 'border-ruling text-transparent'
                              }`}
                            >
                              <Tick01Icon className="w-3 h-3" />
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

        <div className="mt-16 pt-8 border-t border-line animate-fade-up stagger-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-amber px-6 py-3 text-sm font-semibold text-void hover:bg-amber/80 transition-colors"
          >
            Go to Your Feed
            <ArrowRight01Icon className="w-4 h-4" />
          </Link>
          <span className="ml-4 text-xs text-fade">
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
