'use client'

import { ErrorView } from '@/components/ui/error-view'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <ErrorView
      error={error}
      retry={unstable_retry}
      context="failed to load your feed"
      homeHref="/dashboard"
      homeLabel="cd ~/dashboard"
    />
  )
}
