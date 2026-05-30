# Deployment

**Status:** current

## Platform

**Vercel** — import GitHub repo, set env vars from [environment-variables.md](./environment-variables.md).

## Cron

[`vercel.json`](../../vercel.json):

```json
{
  "crons": [{ "path": "/api/cron/fetch-releases", "schedule": "0 0,12 * * *" }]
}
```

Runs at **00:00 and 12:00 UTC** daily. Authenticated with `CRON_SECRET` bearer header.

## Deploy checklist

1. Push to GitHub
2. Import repo in Vercel
3. Set all production env vars
4. Run migrations against production DB: `pnpm db:migrate` (CI or local with prod `DATABASE_URL`)
5. Seed registry if empty: `pnpm db:seed`
6. GitHub OAuth callback: `https://<domain>/api/auth/callback/github`
7. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to production origin

## Analytics

`@vercel/analytics` included in `src/app/layout.tsx` — no extra env vars.

## Self-hosting

README describes Vercel + Neon free tier. Other Node hosts work if cron can hit `/api/cron/fetch-releases` on schedule with correct auth.
