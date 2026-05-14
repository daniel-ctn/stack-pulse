'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft01Icon } from 'hugeicons-react'
import { authClient } from '@/lib/auth-client'
import { Logo } from '@/components/logo'

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
      setError('invalid email or password')
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
    if (error) setError('could not sign in with github')
  }

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fade hover:text-dust transition-colors"
          >
            <ArrowLeft01Icon className="w-3 h-3" />
            cd ..
          </Link>
        </div>

        <div className="frame overflow-hidden">
          <div className="frame-titlebar">
            <span className="win-dots">
              <span style={{ background: '#fb7185' }} />
              <span style={{ background: '#fbbf24' }} />
              <span style={{ background: '#34d399' }} />
            </span>
            <span className="text-dust">~/auth/sign-in.sh</span>
            <span className="ml-auto text-mute">secure</span>
          </div>

          <div className="px-6 py-7">
            <div className="font-mono text-[11px] text-fade tracking-[0.2em] uppercase">
              <span className="text-lime">$</span> auth --login
            </div>
            <h1 className="mt-2 font-mono text-2xl font-bold tracking-tight text-ink lowercase">
              welcome back<span className="text-lime caret" />
            </h1>
            <p className="mt-1.5 text-[13px] text-dust">pick up where you left off.</p>

            <form onSubmit={handleEmailSignIn} className="mt-7 space-y-4">
              <Field label="email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <Field label="password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

              {error && (
                <p
                  className="font-mono text-[12px] text-rose"
                  role="alert"
                >
                  <span className="text-fade">→ </span>
                  <span>error: {error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-lime px-4 py-2.5 font-mono text-[13px] font-semibold text-void hover:bg-lime/85 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                <span className="text-void/60">$</span>
                <span>{loading ? './login --pending' : './login'}</span>
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 font-mono text-[10px] text-mute tracking-widest">
              <span className="h-px flex-1 bg-line" />
              <span>OR</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={handleGithubSignIn}
              className="w-full rounded-md border border-ruling bg-shade px-4 py-2.5 font-mono text-[13px] font-medium text-ink hover:border-edge hover:bg-lift transition-colors flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>oauth --provider github</span>
            </button>
          </div>

          <div className="px-6 py-4 border-t border-line bg-void/40 font-mono text-[12px] text-fade flex items-center justify-between">
            <span>no account?</span>
            <Link
              href="/sign-up"
              className="text-lime hover:underline"
            >
              ./register →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block font-mono text-[11px] text-dust mb-1.5">
        <span className="text-fade">{'> '}</span>
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-md border border-line bg-void px-3 py-2 text-[13px] placeholder:text-mute"
        autoComplete={type === 'password' ? 'current-password' : 'email'}
      />
    </div>
  )
}
