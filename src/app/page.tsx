import Link from 'next/link'
import { ArrowRight, GitFork, Zap, Globe, Bell } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="flex-1">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Zap className="w-5 h-5" />
            DevDigest
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/sign-in">Sign In</Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Stay ahead of the <span className="text-muted-foreground">release curve.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            DevDigest watches the GitHub releases of the frameworks and libraries you care about.
            Every change is summarized by AI into a concise daily feed — breaking changes, new
            features, and code snippets you can apply in seconds.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Start Reading Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: GitFork,
              title: 'Track Your Stack',
              body: "Select the technologies you use — Next.js, React, Drizzle, Tailwind, and more. We monitor their releases so you don't have to.",
            },
            {
              icon: Bell,
              title: 'AI-Powered Summaries',
              body: 'Each release is distilled into a concise summary with breaking changes, new features, and relevant code snippets.',
            },
            {
              icon: Globe,
              title: 'One Daily Feed',
              body: 'Visit your dashboard once a day. Everything new across your entire stack, organized in a clean, readable timeline.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border p-6">
              <Icon className="w-8 h-8 text-muted-foreground mb-3" />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
        DevDigest &mdash; Built for developers who want to stay current without the noise.
      </footer>
    </main>
  )
}
