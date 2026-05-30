# Database

**Status:** current

## Stack

- **Postgres** on Neon (`@neondatabase/serverless`)
- **Drizzle ORM** — schema `src/db/schema.ts`, client `src/db/index.ts`
- Config: `drizzle.config.ts`, migrations in `drizzle/`

## Core tables

| Table | Purpose |
|-------|---------|
| `users`, `accounts`, `sessions`, `verifications` | Better Auth |
| `technologies` | Registry + custom repos |
| `user_tech_preferences` | User ↔ stack follows |
| `release_updates` | Ingested + AI-summarised releases |
| `user_read_releases` | Read/unread per user |
| `release_fetch_runs` | Ingestion run audit log |
| `digest_subscribers` | Email signups (no sender) |

## Migrations

```bash
pnpm db:generate   # after editing schema.ts
pnpm db:migrate    # apply
```

Initial/dev shortcut:

```bash
pnpm db:push
```

## Seed

```bash
pnpm db:seed
```

Inserts 20 registry stacks from `src/db/seed.ts` (idempotent — skips existing slugs).

## Historical note

Migration `0002_military_galactus.sql` dropped Lemon Squeezy billing columns from `users`. Old snapshots in `drizzle/meta/0000_snapshot.json` and `0001_snapshot.json` still reference them — ignore for current schema.

## Studio

```bash
pnpm db:studio
```
