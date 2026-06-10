# Weekly digest

**Status:** current

## What exists

### Capture

- `digest_subscribers` table (`src/db/schema.ts`) — `email` (unique), optional `stackSlug`, `source`, `unsubscribeToken` (uuid, unique), `lastSentAt`
- `subscribeToDigest` server action (`src/lib/actions.ts`)
- `DigestSignupForm` on landing and public stack pages

### Sending

- `sendWeeklyDigest` in `src/lib/digest.ts` — builds and sends one email per subscriber via Resend
- Cron: `GET /api/cron/send-digest` (Bearer `CRON_SECRET`), scheduled **Mondays 14:00 UTC** in `vercel.json` (2h after the Monday fetch run)
- Stack-scoped subscribers (`stackSlug` set) get that stack's releases from the last 7 days (max 10); general subscribers get the most important releases across all registry stacks (max 12, sorted critical → low)
- Subscribers with no matching releases in the window are skipped — no empty emails
- `lastSentAt` guard: anyone mailed in the last 5 days is skipped, so manual reruns never double-send
- Sends are sequential with a 600ms delay (Resend rate limit) under a 270s time budget; deferred subscribers catch up next run
- Custom repos (`category: 'custom'`) are excluded from digests

Requires `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL`; the cron no-ops with a warning when any are missing.

### Unsubscribe

- Every email carries `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers (RFC 8058) pointing at `POST /api/digest/unsubscribe?token=…`, which deletes the subscriber row and always returns 200 (token validity is not leaked)
- Footer link goes to `/digest/unsubscribe?token=…` — a confirmation page whose button submits the `unsubscribeFromDigest` server action

## Protections

- Honeypot field `website` (bots get fake success)
- IP rate limit: 5 signups/hour (`MAX_DIGEST_SIGNUPS_PER_WINDOW`)
- Unsubscribe tokens are v4 UUIDs validated by regex before any DB query
