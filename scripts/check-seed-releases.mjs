// One-off audit: verify every seed repo publishes GitHub releases.
// Usage: node --env-file=.env scripts/check-seed-releases.mjs
import { readFileSync } from 'node:fs'

const seed = readFileSync(new URL('../src/db/seed.ts', import.meta.url), 'utf8')
const repos = [...new Set([...seed.matchAll(/github\.com\/([\w.-]+\/[\w.-]+)/g)].map((m) => m[1]))]

const headers = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'StackPulse-audit' }
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

console.log(`Checking ${repos.length} repos...`)
const bad = []

for (const repo of repos) {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=1`, { headers })
  if (!res.ok) {
    bad.push(`${repo} — HTTP ${res.status}`)
    continue
  }
  const releases = await res.json()
  if (!Array.isArray(releases) || releases.length === 0) {
    bad.push(`${repo} — no releases published`)
    continue
  }
  const latest = releases[0]
  const age = Math.round((Date.now() - new Date(latest.published_at)) / 86_400_000)
  console.log(`ok  ${repo.padEnd(40)} latest=${latest.tag_name} (${age}d ago)`)
}

if (bad.length > 0) {
  console.log('\nPROBLEMS:')
  for (const line of bad) console.log(`  ${line}`)
  process.exit(1)
}
console.log('\nAll repos publish releases.')
