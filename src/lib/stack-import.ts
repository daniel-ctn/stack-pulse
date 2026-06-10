import { getDb } from '@/db'
import { technologies } from '@/db/schema'

const MAX_DEPENDENCIES = 120
const NPM_FETCH_CONCURRENCY = 10
const NPM_TIMEOUT_MS = 5_000
// Valid npm package name (scoped or not), conservative.
const NPM_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

export type StackImportMatch = {
  id: string
  name: string
  slug: string
  category: string | null
  packages: string[]
}

export type StackImportCustomCandidate = {
  name: string
  url: string
  packages: string[]
}

export type StackImportResult = {
  matched: StackImportMatch[]
  custom: StackImportCustomCandidate[]
  unresolved: string[]
  scanned: number
}

export function extractDependencyNames(packageJsonText: string): string[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(packageJsonText)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null

  const json = parsed as Record<string, unknown>
  const names = new Set<string>()

  for (const key of ['dependencies', 'devDependencies'] as const) {
    const section = json[key]
    if (typeof section !== 'object' || section === null) continue
    for (const name of Object.keys(section)) {
      // @types/* all resolve to the DefinitelyTyped monorepo — noise here.
      if (name.startsWith('@types/')) continue
      if (NPM_NAME.test(name)) names.add(name)
    }
  }

  return Array.from(names).slice(0, MAX_DEPENDENCIES)
}

/** Normalizes the many shapes of npm `repository` urls to `owner/repo`, or null. */
function parseRepoField(repository: unknown): { owner: string; repo: string } | null {
  let url: string | null = null

  if (typeof repository === 'string') url = repository
  else if (
    typeof repository === 'object' &&
    repository !== null &&
    typeof (repository as { url?: unknown }).url === 'string'
  ) {
    url = (repository as { url: string }).url
  }

  if (!url) return null

  // Shorthand: "github:owner/repo" or bare "owner/repo"
  const shorthand = url.match(/^(?:github:)?([\w.-]+)\/([\w.-]+)$/)
  if (shorthand) return { owner: shorthand[1], repo: cleanRepoName(shorthand[2]) }

  const match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/i)
  if (!match) return null

  return { owner: match[1], repo: cleanRepoName(match[2]) }
}

function cleanRepoName(repo: string): string {
  return repo.replace(/\.git$/i, '')
}

async function resolveNpmRepo(name: string): Promise<{ owner: string; repo: string } | null> {
  const encoded = name.startsWith('@')
    ? `@${encodeURIComponent(name.slice(1))}`
    : encodeURIComponent(name)

  try {
    const res = await fetch(`https://registry.npmjs.org/${encoded}/latest`, {
      headers: { Accept: 'application/json', 'User-Agent': 'StackPulse' },
      signal: AbortSignal.timeout(NPM_TIMEOUT_MS),
    })
    if (!res.ok) return null

    const data = (await res.json()) as { repository?: unknown }
    return parseRepoField(data.repository)
  } catch {
    return null
  }
}

export async function resolveDependencies(names: string[]): Promise<StackImportResult> {
  // Resolve npm packages to GitHub repos with a small concurrency pool.
  const resolved = new Map<string, { owner: string; repo: string } | null>()
  let cursor = 0

  async function worker() {
    while (cursor < names.length) {
      const name = names[cursor++]
      resolved.set(name, await resolveNpmRepo(name))
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(NPM_FETCH_CONCURRENCY, names.length) }, () => worker()),
  )

  // Group packages by repo (monorepos collapse to one entry).
  const byRepo = new Map<string, { owner: string; repo: string; packages: string[] }>()
  const unresolved: string[] = []

  for (const name of names) {
    const repo = resolved.get(name)
    if (!repo) {
      unresolved.push(name)
      continue
    }
    const key = `${repo.owner.toLowerCase()}/${repo.repo.toLowerCase()}`
    const entry = byRepo.get(key) ?? { ...repo, packages: [] }
    entry.packages.push(name)
    byRepo.set(key, entry)
  }

  // Match repos against the registry by normalized owner/repo.
  const registry = await getDb()
    .select({
      id: technologies.id,
      name: technologies.name,
      slug: technologies.slug,
      category: technologies.category,
      githubRepoUrl: technologies.githubRepoUrl,
    })
    .from(technologies)

  const registryByRepo = new Map<string, (typeof registry)[number]>()
  for (const tech of registry) {
    const match = tech.githubRepoUrl.match(/github\.com\/([\w.-]+)\/([\w.-]+)/i)
    if (match) {
      registryByRepo.set(`${match[1].toLowerCase()}/${cleanRepoName(match[2]).toLowerCase()}`, tech)
    }
  }

  const matched: StackImportMatch[] = []
  const custom: StackImportCustomCandidate[] = []

  for (const [key, entry] of byRepo) {
    const tech = registryByRepo.get(key)
    if (tech) {
      matched.push({
        id: tech.id,
        name: tech.name,
        slug: tech.slug,
        category: tech.category,
        packages: entry.packages,
      })
    } else {
      custom.push({
        name: entry.repo,
        url: `https://github.com/${entry.owner}/${entry.repo}`,
        packages: entry.packages,
      })
    }
  }

  matched.sort((a, b) => a.name.localeCompare(b.name))
  // Repos that more of the project's packages point at come first.
  custom.sort((a, b) => b.packages.length - a.packages.length || a.name.localeCompare(b.name))

  return { matched, custom, unresolved, scanned: names.length }
}
