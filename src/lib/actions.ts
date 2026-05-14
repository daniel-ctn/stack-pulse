'use server'

import { db } from '@/db'
import { technologies, userTechPreferences, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

type ActionResult = { ok: true } | { ok: false; error: string }

async function requireUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user.id ?? null
}

export async function saveTechPreferences(techIds: string[]): Promise<ActionResult> {
  const userId = await requireUserId()
  if (!userId) return { ok: false, error: 'not signed in' }

  try {
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
    return { ok: true }
  } catch (err) {
    console.error('saveTechPreferences failed:', err)
    return { ok: false, error: 'could not save changes' }
  }
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

export async function addCustomTech(name: string, githubRepoUrl: string): Promise<ActionResult> {
  const userId = await requireUserId()
  if (!userId) return { ok: false, error: 'not signed in' }

  const trimmedName = name.trim()
  if (!trimmedName) return { ok: false, error: 'name is required' }
  if (trimmedName.length > 80) return { ok: false, error: 'name is too long' }

  const parsed = parseGithubRepo(githubRepoUrl)
  if (!parsed) return { ok: false, error: 'enter a valid github repo url' }

  const slug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  if (!slug) return { ok: false, error: 'name must contain letters or numbers' }

  try {
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
    return { ok: true }
  } catch (err) {
    console.error('addCustomTech failed:', err)
    return { ok: false, error: 'could not add repo — name may already be taken' }
  }
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() })
  redirect('/')
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const userId = await requireUserId()
  if (!userId) return { ok: false, error: 'not signed in' }

  try {
    // FK cascades handle: sessions, accounts, userTechPreferences, userReadReleases
    await db.delete(users).where(eq(users.id, userId))
    return { ok: true }
  } catch (err) {
    console.error('deleteAccountAction failed:', err)
    return { ok: false, error: 'could not delete account' }
  }
}
