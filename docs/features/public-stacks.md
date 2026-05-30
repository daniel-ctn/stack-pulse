# Public stacks

**Status:** current

## Routes

- `/stacks` — index of seeded/ingested stacks with stats (`src/app/stacks/page.tsx`)
- `/stacks/[slug]` — up to 20 releases per stack (`PUBLIC_STACK_RELEASE_LIMIT` in `src/lib/public-stacks.ts`)

## Data

`getPublicStackIndex()` and stack page loaders in `src/lib/public-stacks.ts` query `technologies` + `release_updates`.

## SEO

- `revalidate = 3600` on stacks pages
- JSON-LD (`CollectionPage`, `SoftwareSourceCode`) on index
- Metadata in page files; sitemap at `src/app/sitemap.ts`

## Digest signup

`DigestSignupForm` on landing, stacks index, and stack detail pages — see [digest-signup.md](./digest-signup.md).

## Registry seed

20 default stacks in `src/db/seed.ts` (Next.js, React, Tailwind, Drizzle, etc.). Custom user repos use `category: 'custom'` and appear in DB but are not part of the public index unless ingested and surfaced by queries.
