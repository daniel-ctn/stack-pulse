# Public stacks

**Status:** current

## Routes

- `/stacks` — index of seeded/ingested stacks with stats (`src/app/stacks/page.tsx`)
- `/stacks/[slug]` — up to 20 releases per stack (`PUBLIC_STACK_RELEASE_LIMIT` in `src/lib/public-stacks.ts`)
- `/stacks/[slug]/rss.xml` — RSS 2.0 feed of the same releases (route handler, `Cache-Control: s-maxage=3600`); advertised via `alternates.types` metadata and an `rss` button on the stack page
- `/stacks/[slug]/upgrade` — public upgrade planner; `?from=<version>` filters stored releases above that version (`src/lib/upgrade-plan.ts`, loose version compare from `src/lib/version.ts`) and aggregates breaking changes, security notes, deprecations, and a migration checklist in upgrade order. Canonical always points at the param-less page; both stack page button and sitemap link it

## Data

`getPublicStackIndex()` and stack page loaders in `src/lib/public-stacks.ts` query `technologies` + `release_updates`.

## SEO

- `revalidate = 3600` on stacks pages
- JSON-LD (`CollectionPage`, `SoftwareSourceCode`) on index
- Metadata in page files; sitemap at `src/app/sitemap.ts`

## Digest signup

`DigestSignupForm` on landing, stacks index, and stack detail pages — see [digest-signup.md](./digest-signup.md).

## Registry seed

90 default stacks in `src/db/seed.ts` across 15 categories (frameworks, libraries, ui, state, data, orm, testing, mobile, desktop, ai, auth, …). The seed syncs existing rows by slug; `scripts/check-seed-releases.mjs` audits that every repo publishes GitHub releases. Custom user repos use `category: 'custom'` and appear in DB but are not part of the public index unless ingested and surfaced by queries.
