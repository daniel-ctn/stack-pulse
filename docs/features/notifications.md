# Webhook notifications (Slack / Discord)

**Status:** current

Push notifications for new releases of followed stacks, delivered to a Slack or Discord channel after each cron fetch run.

## Data

`user_webhooks` (migration `0008`): one webhook per user (`user_id` unique), `kind` (`slack` | `discord`), `url`, `min_importance` (importance_level enum, default `high`).

## Flow

1. Cron run collects `insertedReleaseIds` from `processTechReleases` (`src/lib/release-ingestion.ts`).
2. `dispatchReleaseWebhooks` (`src/lib/webhooks.ts`) joins inserted releases → followed techs → webhooks and posts one message per webhook.
3. Guards: prereleases skipped; releases older than **3 days** skipped (so a stack's first-ever fetch never floods channels); max 8 releases per message ("+N more" overflow); 30s dispatch budget; per-send 6s timeout; all errors logged, never thrown.
4. `addCustomTech`'s immediate fetch does **not** dispatch (backfill, not news).

Slack messages use mrkdwn text; Discord uses embeds colored by importance.

## Settings UI

`/settings` (auth required) → `WebhookSettings` component. Server actions in `actions.ts`:

| Action | Notes |
|--------|-------|
| `saveWebhookSettings({ kind, url, minImportance })` | Upserts; URL validated against strict host allowlist (`hooks.slack.com/services/…`, `discord.com|discordapp.com/api/webhooks/…`, https only) — SSRF guard since the server fetches these URLs |
| `testWebhookSettings()` | Posts a test message to the **saved** webhook; 5/hour/user rate limit |
| `deleteWebhookSettings()` | Removes the row |
