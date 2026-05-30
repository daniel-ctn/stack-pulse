# Release feed

**Status:** current

## Pages & API

- Server page: `src/app/(dashboard)/dashboard/page.tsx`
- Client component: `src/components/dashboard/release-feed.tsx`
- Infinite scroll API: `GET /api/releases` (`src/lib/release-feed.ts`)

## Scope

- **Signed in:** releases for user's followed stacks only
- **Signed out:** public feed (all ingested releases)

## Filters (URL via nuqs + API query params)

| Param | Values |
|-------|--------|
| `importance` | low, medium, high, critical |
| `read` | all, unread, read (auth only) |
| `signal` | breaking, deprecation, migration, feature, security |
| `tech` | tech slug |
| `q` | text search |
| `cursor` | pagination |

Types/parsers: `src/lib/release-feed-types.ts`

## Read state

- `user_read_releases` join table
- `markReleasesRead` / `markReleaseUnread` server actions

## AI advice (in feed UI)

Authenticated users can ask upgrade questions; POST `/api/release-advice` with rate limit (8/hour/user). See [ai-summarization.md](./ai-summarization.md).

## Virtualisation

`@tanstack/react-virtual` window virtualizer for long feeds; `@tanstack/react-query` for pagination.
