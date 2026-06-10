import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

// Errors only — tracing/replay stay off to keep the bundle and quota lean.
Sentry.init({
  dsn,
  enabled: Boolean(dsn),
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
