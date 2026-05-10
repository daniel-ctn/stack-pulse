import Link from 'next/link'
import { ArrowRight, Zap, Bell, Sparkles } from 'lucide-react'

const features = [
  {
    index: '01',
    icon: Zap,
    title: 'Track Your Stack',
    body: 'Select the frameworks and libraries you use. We monitor their GitHub releases so you never miss a change.',
  },
  {
    index: '02',
    icon: Sparkles,
    title: 'AI Distilled',
    body: 'Every release is summarized into crisp highlights — breaking changes, new features, and relevant code. No fluff.',
  },
  {
    index: '03',
    icon: Bell,
    title: 'One Feed. Daily.',
    body: 'Open your dashboard once a day. Everything new across your entire stack, organized in a clean timeline.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-lg tracking-tight font-semibold text-fg hover:text-fg"
        >
          DevDigest
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/sign-in" className="text-fg-muted hover:text-fg transition-colors">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg hover:bg-fg-muted transition-colors"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 pt-28 pb-16">
          <div className="max-w-4xl animate-fade-up">
            <p className="font-mono text-xs text-accent tracking-[0.2em] uppercase mb-6">
              Your Stack. Summarized.
            </p>
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight">
              Release notes
              <br />
              that actually
              <br />
              <span className="text-fg-dim">get read.</span>
            </h1>
            <p className="mt-8 max-w-lg text-lg text-fg-muted leading-relaxed animate-fade-up stagger-1">
              DevDigest monitors GitHub releases for the tools you use. AI turns those walls of
              markdown into one concise daily feed with breaking changes, new features, and code you
              can use.
            </p>
            <div className="mt-10 flex items-center gap-4 animate-fade-up stagger-2">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-fg px-6 py-3 text-sm font-semibold text-bg hover:bg-fg-muted transition-colors"
              >
                Start Reading Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl border border-border-strong px-6 py-3 text-sm font-semibold hover:bg-surface transition-colors accent-glow"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border">
            {features.map(({ index, icon: Icon, title, body }, i) => (
              <div key={index} className={`bg-bg p-8 lg:p-10 animate-fade-up stagger-${i + 3}`}>
                <span className="font-mono text-xs text-fg-dim tracking-widest">{index}</span>
                <span className="block w-8 h-px bg-border-strong mt-6 mb-6" />
                <Icon className="w-6 h-6 text-fg-muted mb-4" />
                <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm text-fg-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border mx-auto max-w-7xl px-6 py-10 text-center">
          <p className="font-mono text-xs text-fg-dim tracking-widest">DEV.DIGEST — 2026</p>
        </footer>
      </main>
    </div>
  )
}
