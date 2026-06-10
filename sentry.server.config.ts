import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN

// Errors only; no tracing. No-op when SENTRY_DSN is unset (self-hosting default).
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
})
