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

// GitHub username/repo: alphanumeric + dash/underscore/dot, no leading dash/dot, length <= 100.
const GH_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/

function parseGithubRepo(input: string): { owner: string; repo: string; canonical: string } | null {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.host !== 'github.com' && url.host !== 'www.github.com') return null

  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2) return null

  const owner = parts[0]
  const repo = parts[1].replace(/\.git$/, '')
  if (!GH_NAME.test(owner) || !GH_NAME.test(repo)) return null

  return { owner, repo, canonical: `https://github.com/${owner}/${repo}` }
}

export async function addCustomTech(userId: string, name: string, githubRepoUrl: string) {
  if (!userId) return
  const trimmedName = name.trim()
  if (!trimmedName || trimmedName.length > 80) return

  const parsed = parseGithubRepo(githubRepoUrl)
  if (!parsed) return

  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  if (!slug) return

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
        name: trimmedName,
        slug,
        githubRepoUrl: parsed.canonical,
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
