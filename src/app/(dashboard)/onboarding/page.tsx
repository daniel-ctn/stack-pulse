import { auth } from '@/lib/auth'
import { db } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import { headers } from 'next/headers'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  })

  if (!session) redirect('/sign-in')

  const allTechs = await db.select().from(technologies)
  const userPrefs = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, session.user.id))

  const selectedIds = new Set(userPrefs.map((p) => p.techId))

  async function toggleTech(formData: FormData) {
    'use server'
    const techId = formData.get('techId') as string
    const userId = session!.user.id

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

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Choose Your Stack</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Select the frameworks and libraries you use. We&apos;ll track releases for these
        technologies.
      </p>

      <form className="mt-8 space-y-3">
        {allTechs.map((tech) => {
          const isSelected = selectedIds.has(tech.id)
          return (
            <button
              key={tech.id}
              formAction={toggleTech}
              name="techId"
              value={tech.id}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${
                isSelected ? 'border-foreground bg-muted' : 'border-border hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{tech.name}</span>
                  {tech.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{tech.description}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {isSelected ? 'Following' : 'Follow'}
                </span>
              </div>
            </button>
          )
        })}
      </form>

      <a
        href="/dashboard"
        className="mt-8 inline-block rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
      >
        Go to Feed
      </a>
    </main>
  )
}
