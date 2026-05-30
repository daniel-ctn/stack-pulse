# Digest signup

**Status:** current (capture only)

## What exists

- `digest_subscribers` table (`src/db/schema.ts`)
- `subscribeToDigest` server action (`src/lib/actions.ts`)
- `DigestSignupForm` on landing and public stack pages

Fields: `email` (unique), optional `stackSlug`, `source` (default `public`).

## What does NOT exist

- No email provider (Resend, etc.)
- No cron job to send digests
- UI says "weekly digest" — **aspirational**; only DB capture works today

Privacy page mentions sending digests to subscribers — accurate as intent, not implemented.

## Protections

- Honeypot field `website` (bots get fake success)
- IP rate limit: 5 signups/hour (`MAX_DIGEST_SIGNUPS_PER_WINDOW`)
