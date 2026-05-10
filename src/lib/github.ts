const GITHUB_API = 'https://api.github.com'

interface GithubRelease {
  id: number
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
}

export async function fetchLatestReleases(repoUrl: string, perPage = 5): Promise<GithubRelease[]> {
  const [, , , owner, repo] = repoUrl.replace(/\/$/, '').split('/')

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevDigest',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=${perPage}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error(`GitHub API error for ${owner}/${repo}: ${res.status} ${res.statusText}`)
  }

  return res.json()
}
