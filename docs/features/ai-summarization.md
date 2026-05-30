# AI summarization

**Status:** current

## Provider

- **OpenRouter** via OpenAI SDK (`src/lib/ai.ts`)
- Base URL: `https://openrouter.ai/api/v1`
- Model: `OPENROUTER_MODEL` env or default `deepseek/deepseek-chat`
- Requires `OPENROUTER_API_KEY`

## Release summarisation

`summarizeRelease()` — called during ingestion. Returns structured JSON validated with Zod:

- summary, new features, breaking changes, security notes, deprecations, migration steps
- importance level, release signals, optional code snippet
- Stored on `release_updates` including `summary_model`, `summarized_at`, `raw_release_body`

## Upgrade advice

`adviseOnRelease()` — used by `POST /api/release-advice`:

- Input: release ID, question, optional `currentVersion`, `projectContext`
- Loads related releases in upgrade range for coverage context
- Output: risk level, answer, blockers, next steps

Rate limits and payload caps in `src/app/api/release-advice/route.ts`.

## Backfill

`pnpm releases:backfill [--limit=N] [--tech=slug] [--dry-run]` for rows missing summaries.
