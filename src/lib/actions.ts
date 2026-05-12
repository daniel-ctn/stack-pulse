'use server'

import { db } from '@/db'
import { technologies, userTechPreferences } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function saveTechPreferences(userId: string, techIds: string[]) {
  if (!userId || !techIds.length) return

  const existingPrefs = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(eq(userTechPreferences.userId, userId))

  const existingIds = new Set(existingPrefs.map((p) => p.techId))
  const selectedIds = new Set(techIds)

  const toAdd = techIds.filter((id) => !existingIds.has(id))
  const toRemove = Array.from(existingIds).filter((id) => !selectedIds.has(id))

  for (const id of toRemove) {
    await db
      .delete(userTechPreferences)
      .where(and(eq(userTechPreferences.userId, userId), eq(userTechPreferences.techId, id)))
  }

  for (const id of toAdd) {
    await db.insert(userTechPreferences).values({ userId, techId: id })
  }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
}

export async function addCustomTech(userId: string, name: string, githubRepoUrl: string) {
  if (!name.trim() || !githubRepoUrl.trim()) return

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const existing = await db
    .select({ id: technologies.id })
    .from(technologies)
    .where(eq(technologies.slug, slug))
    .limit(1)

  let techId: string

  if (existing.length > 0) {
    techId = existing[0].id
  } else {
    const [inserted] = await db
      .insert(technologies)
      .values({
        name: name.trim(),
        slug,
        githubRepoUrl: githubRepoUrl.trim(),
        category: 'custom',
      })
      .returning({ id: technologies.id })
    techId = inserted.id
  }

  const alreadyFollowing = await db
    .select({ techId: userTechPreferences.techId })
    .from(userTechPreferences)
    .where(and(eq(userTechPreferences.userId, userId), eq(userTechPreferences.techId, techId)))
    .limit(1)

  if (alreadyFollowing.length === 0) {
    await db.insert(userTechPreferences).values({ userId, techId })
  }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
}
