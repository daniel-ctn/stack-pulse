'use client'

import { useState, useTransition } from 'react'

import { subscribeToDigest } from '@/lib/actions'

export function DigestSignupForm({
  stackSlug,
  source = 'public',
}: {
  stackSlug?: string
  source?: string
}) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="frame p-4"
      onSubmit={(event) => {
        event.preventDefault()
        setMessage(null)

        startTransition(async () => {
          const result = await subscribeToDigest({ email, stackSlug, source, website })
          setIsSuccess(result.ok)
          setMessage(result.ok ? 'saved. weekly digest signup recorded.' : result.error)
          if (result.ok) {
            setEmail('')
            setWebsite('')
          }
        })
      }}
    >
      <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-fade">
        weekly upgrade digest
      </label>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="h-10 rounded-md border border-line bg-void px-3 font-mono text-[12px] text-dust placeholder:text-fade"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-10 rounded-md bg-lime px-4 font-mono text-[12px] font-semibold text-void transition-colors hover:bg-lime/85 disabled:opacity-60"
        >
          {isPending ? 'saving...' : 'notify me'}
        </button>
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-fade">
        Get source-linked upgrade notes and occasional sponsor recommendations. No GitHub login
        required.
      </p>
      {message && (
        <p className={`mt-2 font-mono text-[11px] ${isSuccess ? 'text-lime' : 'text-rose'}`}>
          {message}
        </p>
      )}
    </form>
  )
}
