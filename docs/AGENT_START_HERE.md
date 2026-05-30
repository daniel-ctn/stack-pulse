# Agent start here

**Status:** current  
**Last verified:** 2026-05-31 (code + config in repo)

StackPulse is a Next.js app that tracks GitHub releases for developer stacks, AI-summarises them via OpenRouter, and shows a filterable feed. Non-profit, self-hostable, no billing.

---

## Required read order

1. This file (every session)
2. [`README.md`](../README.md) — product overview and quick start
3. [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) — architecture + **UI design system** (required for any UI/page work)
4. [`AGENTS.md`](../AGENTS.md) / [`CLAUDE.md`](../CLAUDE.md) — behavioral rules
5. Task-specific doc from [`docs/README.md`](./README.md)
6. Source files listed in the **source-of-truth map** below before changing behavior

Trust code over docs when they disagree. Surface drift; update docs only when the task changes durable behavior.

---

## Current product truth

| Area | Truth (verified in code) |
|------|--------------------------|
| Auth | GitHub OAuth only via Better Auth. `/sign-up` redirects to `/sign-in`. |
| Onboarding | `/onboarding` — pick up to 30 registry stacks; up to 5 custom GitHub repos. |
| Feed | `/dashboard` — virtualised release feed with importance, read/unread, signal, tech, search filters. |
| AI chat | Authenticated POST `/api/release-advice` — upgrade Q&A on a release. |
| Public SEO | `/stacks`, `/stacks/[slug]` — public release pages (20 releases/stack). |
| Digest signup | Landing + public stack pages collect emails into `digest_subscribers`. **No email sender implemented.** |
| Cron | Fetches releases for stacks **followed by at least one user**. Custom repos fetch immediately on add. |
| Billing | **None.** Lemon Squeezy columns removed in migration `0002`; do not reintroduce without explicit task. |
| Analytics | `@vercel/analytics` in root layout only. No PostHog/Sentry in app code. |

---

## Stack truth (from `package.json`, config, code)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4, shadcn (`base-nova`), hugeicons-react, motion |
| Auth | `better-auth` + `@better-auth/infra` dash plugin (optional) |
| Database | Neon Postgres (`@neondatabase/serverless`) + Drizzle ORM |
| AI | OpenRouter via OpenAI SDK (`src/lib/ai.ts`) |
| Data fetching (client) | TanStack Query, nuqs URL state |
| Hosting | Vercel + Vercel Cron (`vercel.json`) |
| Package manager | pnpm 11 |

**Not used:** Prisma (ORM is Drizzle), Clerk/Supabase auth, Stripe/Lemon Squeezy billing, PostHog, Sentry SDK.

---

## Known documentation drift

| Claim | Where | Code truth |
|-------|-------|------------|
| Cron "every 4 hours" | `README.md` (fixed 2026-05-31), `src/app/page.tsx`, `src/app/privacy/page.tsx` | `vercel.json`: `0 0,12 * * *` — **twice daily** (00:00 & 12:00 UTC) |
| "Fetch run history" UI | `README.md` features | `release_fetch_runs` table exists; **no dashboard UI** yet |
| Weekly digest emails | UI copy, privacy page | Signups stored only; **no cron/email pipeline** |
| `LICENSE` file | `README.md` | File **not present** in repo |
| GitHub OAuth "required" | README deploy section | Optional in dev (`auth.ts` skips provider if env missing); **required in production** |

Old Drizzle snapshots (`drizzle/meta/0000_snapshot.json`, `0001`) still mention `lemonsqueezy_*` — historical migration artifacts only.

---

## Source-of-truth map

| Area | Code truth | Docs | Notes |
|------|------------|------|-------|
| Routes & pages | `src/app/**` | [features/overview.md](./features/overview.md) | App Router route groups |
| Auth | `src/lib/auth.ts`, `src/app/api/auth/[...all]/route.ts` | [features/auth.md](./features/auth.md) | GitHub OAuth, Better Auth tables |
| DB schema | `src/db/schema.ts`, `drizzle/` | [operations/database.md](./operations/database.md) | Migrations in `drizzle/` |
| Release ingestion | `src/lib/release-ingestion.ts`, `src/lib/github.ts` | [features/release-ingestion.md](./features/release-ingestion.md) | Cron + custom-repo trigger |
| AI summarisation | `src/lib/ai.ts` | [features/ai-summarization.md](./features/ai-summarization.md) | OpenRouter, Zod validation |
| Release feed | `src/lib/release-feed.ts`, `src/components/dashboard/release-feed.tsx` | [features/release-feed.md](./features/release-feed.md) | Filters, virtualisation, advice UI |
| Public stacks | `src/lib/public-stacks.ts`, `src/app/stacks/**` | [features/public-stacks.md](./features/public-stacks.md) | SEO pages, JSON-LD |
| Server actions | `src/lib/actions.ts` | [features/server-actions.md](./features/server-actions.md) | Prefs, digest, read state, custom repos |
| Env vars | `.env.example` | [operations/environment-variables.md](./operations/environment-variables.md) | Canonical list |
| Deploy & cron | `vercel.json`, README | [operations/deployment.md](./operations/deployment.md) | Vercel Cron auth via `CRON_SECRET` |
| Local dev | `package.json` scripts | [operations/local-development.md](./operations/local-development.md) | No test suite in repo |
| Digest capture | `digestSubscribers` table, `subscribeToDigest` | [features/digest-signup.md](./features/digest-signup.md) | Capture only |
| System + UI design | `globals.css`, `src/components/**` | [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Tokens, layout, copy voice, badges |

---

## Doc status guide

| Folder | Purpose | Status labels |
|--------|---------|---------------|
| `docs/features/` | How each system works today | `current` |
| `docs/operations/` | Setup, deploy, env, DB, verification | `current` |
| `docs/strategy/` | Roadmap / product direction | `planned` or `current` when added |
| `docs/archive/` | Shipped plans, old audits, superseded docs | `historical`, `shipped`, `superseded` |

When editing a doc, set status in the first lines. Move completed plans to `docs/archive/`.

---

## Work rules for agents

- Read this file + task doc before non-trivial changes.
- For UI, pages, or styling: read [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) and match tokens, frames, typography, and badge tones.
- Match existing patterns in neighboring files; minimal diff.
- Update docs when changing routes, APIs, env vars, schema, auth, cron, or user-visible behavior.
- Do not update docs for tiny refactors or obvious code-only changes.
- On Windows, prefer `cmd.exe` for shell commands.
- Next.js 16 APIs may differ from training data — check `node_modules/next/dist/docs/` when unsure.
- No commits unless the user asks.

---

## Verification commands

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
git diff --check
```

Database (requires `.env` with `DATABASE_URL`):

```bash
pnpm db:push          # dev schema sync
pnpm db:migrate       # apply migrations
pnpm db:seed          # seed 20 registry stacks
pnpm db:studio        # Drizzle Studio
```

Manual cron (requires `CRON_SECRET`):

```bash
curl -H "Authorization: Bearer %CRON_SECRET%" "http://localhost:3000/api/cron/fetch-releases"
```

Backfill AI summaries for existing releases:

```bash
pnpm releases:backfill -- --limit=10
```

**No automated test suite** exists (`vitest`/`jest` not configured).

---

## Environment variables

See [operations/environment-variables.md](./operations/environment-variables.md). Quick reference:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Neon Postgres |
| `BETTER_AUTH_SECRET` | prod | Session signing |
| `BETTER_AUTH_URL` | prod | Auth origin |
| `NEXT_PUBLIC_APP_URL` | prod | Public origin + AI referer |
| `GITHUB_CLIENT_ID/SECRET` | prod | GitHub OAuth |
| `OPENROUTER_API_KEY` | yes (for AI) | Release summarisation |
| `CRON_SECRET` | yes (cron) | Protects `/api/cron/fetch-releases` |
| `OPENROUTER_MODEL` | no | Default `deepseek/deepseek-chat` |
| `GITHUB_TOKEN` | no | Raises GitHub API rate limit |
| `BETTER_AUTH_API_KEY` | no | Better Auth Dash plugin |

---

## Before ending a task

- [ ] Changed behavior matches code paths you touched
- [ ] `pnpm exec tsc --noEmit && pnpm lint` pass (or note why not run)
- [ ] Docs updated if routes/APIs/env/schema/user-visible behavior changed
- [ ] Doc status + paths correct; no broken relative links in edited docs
- [ ] UI changes follow [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) (tokens, frames, copy voice)
- [ ] Drift called out to user if docs/copy still disagree with code
