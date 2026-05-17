const GITHUB_API = 'https://api.github.com'

export interface GithubRelease {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  published_at: string | null
  html_url: string
}

const TIMEOUT_MS = 8000

export function parseGithubRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const [, , , owner, repo] = repoUrl.replace(/\/$/, '').split('/')
  if (!owner || !repo) {
    throw new Error(`Invalid GitHub repo URL: ${repoUrl}`)
  }
  return { owner, repo }
}

export async function fetchLatestReleases(repoUrl: string, perPage = 5): Promise<GithubRelease[]> {
  const { owner, repo } = parseGithubRepoUrl(repoUrl)

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'StackPulse',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const url = `${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=${perPage}`

  // One retry on network error or 5xx.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })

      if (res.status >= 500 && attempt === 0) continue
      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          const reset = res.headers.get('x-ratelimit-reset')
          const remaining = res.headers.get('x-ratelimit-remaining')
          console.warn(
            `GitHub rate limit hit for ${owner}/${repo} (remaining=${remaining}, resets at ${reset})`,
          )
        }
        throw new Error(`GitHub API ${res.status} for ${owner}/${repo}`)
      }

      const remaining = Number(res.headers.get('x-ratelimit-remaining') ?? '5000')
      if (remaining < 50) {
        console.warn(`GitHub rate limit low: ${remaining} remaining`)
      }

      return res.json()
    } catch (err) {
      if (attempt === 1) throw err
    }
  }

  // Unreachable, but satisfies TS.
  throw new Error(`unreachable`)
}
