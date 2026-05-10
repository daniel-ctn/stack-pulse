'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft01Icon } from 'hugeicons-react'
import { authClient } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await authClient.signIn.email({ email, password })
    if (error) {
      setError(error.message ?? 'Failed to sign in')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGithubSignIn() {
    setError(null)
    const { error } = await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    })
    if (error) setError(error.message ?? 'Failed to sign in with GitHub')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-fade hover:text-dust transition-colors mb-8"
        >
          <ArrowLeft01Icon className="w-3 h-3" />
          Back
        </Link>

        <div className="mb-8">
          <p className="font-mono text-xs text-amber tracking-[0.2em] uppercase mb-3">
            Welcome Back
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Sign In</h1>
          <p className="mt-2 text-sm text-dust">Pick up where you left off</p>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-dust mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-line bg-shade px-3.5 py-2.5 text-sm placeholder:text-fade transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-dust mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-line bg-shade px-3.5 py-2.5 text-sm placeholder:text-fade transition-colors"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-void hover:bg-amber/80 transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs text-fade">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={handleGithubSignIn}
          className="w-full rounded-lg border border-ruling bg-shade px-4 py-2.5 text-sm font-medium text-ink hover:bg-lift transition-colors flex items-center justify-center gap-2.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Continue with GitHub
        </button>

        <p className="mt-6 text-center text-sm text-fade">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="text-dust underline underline-offset-4 hover:text-ink transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  )
}
