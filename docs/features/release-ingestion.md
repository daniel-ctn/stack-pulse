# Release ingestion

**Status:** current

## Flow

1. Resolve list of `technologies` rows followed by ≥1 user (`user_tech_preferences`)
2. For each tech, fetch up to 5 latest GitHub releases (`src/lib/github.ts`)
3. Skip drafts and duplicates (`techId` + `version` unique)
4. Summarise via OpenRouter (`summarizeRelease` in `src/lib/ai.ts`)
5. Insert into `release_updates`

## Triggers

| Trigger | Entry point | `release_fetch_runs.trigger` |
|---------|-------------|-------------------------------|
| Vercel Cron | `GET /api/cron/fetch-releases` | `cron` |
| Custom repo add | `addCustomTech` in `actions.ts` | `custom_repo` |

Cron auth: `Authorization: Bearer {CRON_SECRET}` (timing-safe compare).

Processing runs in chunks of 6 techs in parallel (`CHUNK_SIZE` in cron route). `maxDuration = 60`.

## Schedule (code truth)

`vercel.json`:

```json
{ "path": "/api/cron/fetch-releases", "schedule": "0 0,12 * * *" }
```

Twice daily at **00:00 and 12:00 UTC** — not every 4 hours (marketing copy may be wrong).

## Fetch run logging

`release_fetch_runs` stores run metadata and per-tech `{ tech, inserted, errors }` in `details` JSON. **No UI** exposes this yet.

## GitHub API

- Optional `GITHUB_TOKEN` for 5000/h rate limit vs 60/h
- 8s timeout, one retry on network/5xx

## Backfill

`pnpm releases:backfill` — re-summarise existing rows missing intelligence (`scripts/backfill-release-intelligence.ts`).
