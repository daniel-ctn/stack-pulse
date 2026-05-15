'use server'

import { getDb } from '@/db'
import { technologies, userTechPreferences, users } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getAuth } from '@/lib/auth'

type ActionResult<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string }

const MAX_TECH_PREFERENCES = 30
const MAX_CUSTOM_TECH_PREFERENCES = 5
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function requireUserId(): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: await headers() })
  return session?.user.id ?? null
}

export async function saveTechPreferences(techIds: string[]): Promise<ActionResult> {
  const userId = await requireUserId()
  if (!userId) return { ok: false, error: 'not signed in' }
  if (techIds.length > MAX_TECH_PREFERENCES) {
    return { ok: false, error: `choose ${MAX_TECH_PREFERENCES} packages or fewer` }
  }

  try {
    const uniqueIds = Array.from(new Set(techIds))
    if (uniqueIds.some((id) => !UUID.test(id))) {
      return { ok: false, error: 'invalid package selection' }
    }

    const db = getDb()
    const selectedTechs =
      uniqueIds.length > 0
        ? await db
            .select({ id: technologies.id, category: technologies.category })
            .from(technologies)
            .where(inArray(technologies.id, uniqueIds))
        : []

    if (selectedTechs.length !== uniqueIds.length) {
      return { ok: false, error: 'one or more packages no longer exist' }
    }

    const customCount = selectedTechs.filter((tech) => tech.category === 'custom').length
    if (customCount > MAX_CUSTOM_TECH_PREFERENCES) {
      return { ok: false, error: `choose ${MAX_CUSTOM_TECH_PREFERENCES} custom repos or fewer` }
    }

    const existingPrefs = await db
      .select({ techId: userTechPreferences.techId })
      .from(userTechPreferences)
      .where(eq(userTechPreferences.userId, userId))

    const existingIds = new Set(existingPrefs.map((p) => p.techId))
    const selectedIds = new Set(uniqueIds)

    const toAdd = uniqueIds.filter((id) => !existingIds.has(id))
    const toRemove = Array.from(existingIds).filter((id) => !selectedIds.has(id))

    for (const id of toRemove) {
      await db
        .delete(userTechPreferences)
        .where(and(eq(userTechPreferences.userId, userId), eq(userTechPreferences.techId, id)))
    }

    for (const id of toAdd) {
      await db.insert(userTechPreferences).values({ userId, techId: id }).onConflictDoNothing()
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
    const trimmed = input.trim()
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
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

export async function addCustomTech(
  name: string,
  githubRepoUrl: string,
): Promise<
  ActionResult<{
    id: string
    name: string
    slug: string
    description: string | null
    category: string | null
  }>
> {
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
    const db = getDb()
    const customPrefs = await db
      .select({ techId: userTechPreferences.techId })
      .from(userTechPreferences)
      .innerJoin(technologies, eq(userTechPreferences.techId, technologies.id))
      .where(and(eq(userTechPreferences.userId, userId), eq(technologies.category, 'custom')))

    if (customPrefs.length >= MAX_CUSTOM_TECH_PREFERENCES) {
      return { ok: false, error: `custom repo limit is ${MAX_CUSTOM_TECH_PREFERENCES}` }
    }

    const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'StackPulse',
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
      signal: AbortSignal.timeout(8000),
    })

    if (res.status === 404) return { ok: false, error: 'github repo was not found' }
    if (!res.ok) return { ok: false, error: 'could not verify github repo' }

    const existing = await db
      .select({
        id: technologies.id,
        name: technologies.name,
        slug: technologies.slug,
        description: technologies.description,
        category: technologies.category,
      })
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
      await db.insert(userTechPreferences).values({ userId, techId }).onConflictDoNothing()
    }

    revalidatePath('/onboarding')
    revalidatePath('/dashboard')
    const [tech] = await db
      .select({
        id: technologies.id,
        name: technologies.name,
        slug: technologies.slug,
        description: technologies.description,
        category: technologies.category,
      })
      .from(technologies)
      .where(eq(technologies.id, techId))
      .limit(1)

    return { ok: true, data: tech }
  } catch (err) {
    console.error('addCustomTech failed:', err)
    return { ok: false, error: 'could not add repo — name may already be taken' }
  }
}

export async function signOutAction() {
  await getAuth().api.signOut({ headers: await headers() })
  redirect('/')
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const userId = await requireUserId()
  if (!userId) return { ok: false, error: 'not signed in' }

  try {
    // FK cascades handle: sessions, accounts, userTechPreferences, userReadReleases
    await getDb().delete(users).where(eq(users.id, userId))
    return { ok: true }
  } catch (err) {
    console.error('deleteAccountAction failed:', err)
    return { ok: false, error: 'could not delete account' }
  }
}
