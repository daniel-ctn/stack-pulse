'use client'

import { useEffect } from 'react'

// global-error replaces the root layout, so next/font CSS vars are unavailable —
// styles are inlined and self-contained on purpose.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const mono = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080a',
          color: '#e8e8ec',
          fontFamily: mono,
          padding: '24px',
        }}
      >
        <title>Something went wrong · StackPulse</title>
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: '#0d0d10',
            border: '1px solid #1c1c22',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              borderBottom: '1px solid #1c1c22',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#5a5a62',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 9, background: '#fb7185' }} />
            <span style={{ width: 9, height: 9, borderRadius: 9, background: '#fbbf24' }} />
            <span style={{ width: 9, height: 9, borderRadius: 9, background: '#34d399' }} />
            <span style={{ marginLeft: 6, color: '#9b9ba1' }}>~/fatal</span>
          </div>

          <div style={{ padding: '22px', fontSize: '13px', lineHeight: 1.6 }}>
            <div style={{ color: '#5a5a62' }}>{'// the app crashed at the root'}</div>
            <div style={{ marginTop: 10 }}>
              <span style={{ color: '#5a5a62' }}>$ </span>
              <span style={{ color: '#fb7185' }}>fatal</span>
              <span style={{ color: '#9b9ba1' }}>: {error.message || 'unknown error'}</span>
            </div>
            {error.digest && (
              <div style={{ marginTop: 6, color: '#5a5a62', fontSize: 11 }}>
                digest: {error.digest}
              </div>
            )}
            <button
              onClick={() => unstable_retry()}
              style={{
                marginTop: 18,
                background: '#a3e635',
                color: '#08080a',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 16px',
                fontFamily: mono,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              retry
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
