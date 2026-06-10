# Product Hunt launch plan

**Status:** current (Phases 0–1 shipped)
**Created:** 2026-06-11
**Goal:** Make StackPulse powerful and trustworthy enough for a Product Hunt launch.

> **Progress 2026-06-11:** Phase 0 (all of 0.1–0.6) and Phase 1 (all of 1.1–1.5) shipped.
> Remaining: Phase 2 growth loops, plus deploy steps — run `pnpm db:migrate` (migration 0007)
> and `pnpm db:seed` (90-stack registry) against production, set `RESEND_API_KEY`,
> `DIGEST_FROM_EMAIL`, `GITHUB_TOKEN`, and optionally `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`.

---

## Where the product stands today

The core loop works and is well-engineered: cron → GitHub releases → structured AI summaries (breaking changes, deprecations, migrations, security, importance) → filterable feed, plus per-release AI upgrade advice with version-range context. Security posture (rate limits, validation, prompt-injection guards) is above average for a side project.

What's missing is not engineering quality — it's **breadth** (20 stacks), **retention** (no email ever sends), and **a hero feature** that makes the demo memorable.

### Positioning angle for the launch

> Dependabot tells you a new version exists. StackPulse tells you whether it will break you.

---

## Phase 0 — Launch blockers (trust & first impressions)

These are broken promises or launch-day failure modes. All must ship before announcing.

| # | Item | Why | Effort |
|---|------|-----|--------|
| 0.1 | **Ship the digest email pipeline** (Resend + React Email + weekly cron) | Landing + stack pages collect emails promising a digest that never arrives. Worst possible state to launch in: PH users will sign up and notice. | M |
| 0.2 | **Cron fetches all registry stacks**, not only followed ones | Today a new user following a never-followed stack sees an empty feed for up to 12h. Also guarantees public `/stacks/[slug]` SEO pages always have fresh content. 20–80 stacks is well within budget. | S |
| 0.3 | **Fix "every 4 hours" copy** (`src/app/page.tsx:34`, `src/app/privacy/page.tsx:62`) | Cron is twice daily (`vercel.json`). Known drift, still live. | S |
| 0.4 | **Add `LICENSE` (MIT)** | README claims MIT; the PH dev audience will check the repo. | S |
| 0.5 | **Error monitoring** (Sentry free tier) | No visibility today. Launch-day spike with zero observability is flying blind. | S |
| 0.6 | **Raise cron `maxDuration`** (60 → 300) and verify a full cold run | First fetch of a new tech = up to 5 AI calls; more registry stacks after 0.2 means longer runs. | S |

## Phase 1 — Power features (the "wow")

Ranked by impact-to-effort. 1.1 and 1.2 are the demo moments for the PH video.

| # | Item | Why | Effort |
|---|------|-----|--------|
| 1.1 | **package.json import** — paste a `package.json` (or repo URL), resolve deps via npm registry → repo URLs, match registry stacks + offer the rest as custom follows | Onboarding goes from "browse a list" to "your stack's feed in 30 seconds". The single most demo-able feature. | M |
| 1.2 | **Upgrade planner** — pick stack + current version → aggregated breaking changes / deprecations / migration checklist across all stored releases up to latest | The version-range logic already exists in `/api/release-advice` (`getStoredUpgradeContext`). Promote it from chat answer to a first-class page with a shareable URL. | M |
| 1.3 | **Expand registry 20 → ~80 stacks** (Vue, Nuxt, Angular, Node, Deno, Express, NestJS, Fastify, Playwright, Vitest, Storybook, Expo, React Native, Electron, Tauri, Biome, ESLint, Zustand, React Router, TanStack Router/Table, Supabase, Vercel AI SDK, LangChain, OpenAI/Anthropic SDKs, …) | Breadth is the #1 perceived-usefulness lever and it's seed data. More public pages = more SEO surface. | S |
| 1.4 | **RSS/Atom feed per stack** (`/stacks/[slug]/rss.xml`) | Devs love RSS; zero-friction distribution; trivially cacheable. | S |
| 1.5 | **Keyboard navigation** in the feed (j/k move, enter expand, r read, a ask AI) | Cheap dev delight; reviewers notice. | S |

## Phase 2 — Growth loops (stretch / post-launch)

| # | Item | Why | Effort |
|---|------|-----|--------|
| 2.1 | **MCP server** — query your release feed / upgrade risk from Claude, Cursor, etc. | Strong hook for the 2026 dev audience; "ask your editor what's new in your stack". | M |
| 2.2 | **Slack/Discord webhook notifications** | Team distribution; natural "upgrade to teams" path later. | M |
| 2.3 | **Live stats on landing** (releases tracked, summaries generated, stacks followed) | Social proof from data that already exists. | S |
| 2.4 | **Dynamic per-stack OG images** | Better share cards when stack pages circulate. | S |
| 2.5 | **Fetch run history / status page** | Closes the README claim ("Fetch run history"); doubles as a public trust signal. | S |

## Non-goals (explicitly out of scope for launch)

- Billing of any kind (project is non-profit; Lemon Squeezy was removed in migration `0002`).
- Email/password auth — GitHub-only is the identity.
- Mobile apps, browser extensions.

## Scale notes for launch day

- In-memory rate-limit maps (`actions.ts`, `release-advice/route.ts`) reset per serverless instance — acceptable, documented tradeoff.
- `GITHUB_TOKEN` must be set in production (5000 req/h vs 60).
- Custom-repo fetch-on-add runs synchronously in the action — fine at current limits (5/user), revisit if limits rise.
- No automated tests exist. Minimum before launch: unit tests for `parseLooseVersion`/`compareLooseVersion`, `parseGithubRepo`, and AI schema normalization — the logic most likely to corrupt the feed silently.

## Suggested order of work

1. Phase 0 entirely (0.3/0.4 are minutes; 0.1 is the long pole — start it first).
2. 1.3 (registry expansion) and 1.4 (RSS) — small, immediate breadth.
3. 1.1 (package.json import) → 1.2 (upgrade planner) — the launch story.
4. 1.5 + Phase 2 as time allows.

When items ship, move them to `docs/archive/implementation/` per docs convention.
