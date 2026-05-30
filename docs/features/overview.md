# App overview

**Status:** current

## Route map

| Path | File | Auth | Purpose |
|------|------|------|---------|
| `/` | `src/app/page.tsx` | optional | Landing |
| `/sign-in` | `src/app/(auth)/sign-in/page.tsx` | no | GitHub sign-in |
| `/sign-up` | `src/app/(auth)/sign-up/page.tsx` | no | Redirects → `/sign-in` |
| `/onboarding` | `src/app/(dashboard)/onboarding/page.tsx` | yes | Stack selection |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | optional | Release feed (redirects to onboarding if signed in with no stacks) |
| `/stacks` | `src/app/stacks/page.tsx` | no | Public stack index |
| `/stacks/[slug]` | `src/app/stacks/[slug]/page.tsx` | no | Public stack release page |
| `/privacy`, `/terms` | `src/app/privacy/page.tsx`, `terms/page.tsx` | no | Legal |
| `/api/auth/[...all]` | `src/app/api/auth/[...all]/route.ts` | — | Better Auth handler |
| `/api/releases` | `src/app/api/releases/route.ts` | optional | Paginated feed JSON |
| `/api/release-advice` | `src/app/api/release-advice/route.ts` | yes | AI upgrade advice |
| `/api/cron/fetch-releases` | `src/app/api/cron/fetch-releases/route.ts` | `CRON_SECRET` | Scheduled ingestion |

## Key directories

```
src/app/          App Router pages and API routes
src/components/   UI (dashboard/, landing/, ui/)
src/db/           Drizzle schema, client, seed
src/lib/          auth, ai, github, release-feed, actions
drizzle/          SQL migrations
scripts/          backfill, icon generation
```

## Limits (from `src/lib/actions.ts`)

- 30 total followed stacks per user
- 5 custom GitHub repos per user (`category: 'custom'`)
- 5 releases fetched per tech per run (`RELEASES_PER_TECH` in `release-ingestion.ts`)
