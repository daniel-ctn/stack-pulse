import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import {
  ReactIcon,
  TailwindcssIcon,
  Typescript03Icon,
  Database02Icon,
  SourceCodeIcon,
  ZapIcon,
  ShadcnIcon,
  ServerStack01Icon,
  RocketIcon,
  Package01Icon,
  Atom01Icon,
  Flag03Icon,
} from 'hugeicons-react'
import { Logo } from '@/components/logo'
import { StackPulseHero } from '@/components/stack-pulse-hero'

const steps = [
  {
    n: '01',
    cmd: 'stack add <tool>',
    title: 'pick your stack',
    body: 'Select the frameworks, libraries, and tools you actually ship with. Or paste any GitHub repo URL — we’ll follow it.',
  },
  {
    n: '02',
    cmd: 'pulse --watch',
    title: 'we watch the releases',
    body: 'Every new release on GitHub is fetched, parsed, and run through an AI summarizer tuned for changelogs. No noise, no marketing.',
  },
  {
    n: '03',
    cmd: 'feed --read',
    title: 'read one feed',
    body: 'A clean, scannable timeline across your entire stack. Breaking changes flagged, code snippets included, sources linked.',
  },
]

const trackedStacks = [
  { name: 'react', icon: ReactIcon },
  { name: 'next', icon: SourceCodeIcon },
  { name: 'tailwind', icon: TailwindcssIcon },
  { name: 'shadcn', icon: ShadcnIcon },
  { name: 'typescript', icon: Typescript03Icon },
  { name: 'drizzle', icon: Database02Icon },
  { name: 'remix', icon: ServerStack01Icon },
  { name: 'astro', icon: RocketIcon },
  { name: 'vite', icon: ZapIcon },
  { name: 'bun', icon: Package01Icon },
  { name: 'svelte', icon: Flag03Icon },
  { name: 'solid', icon: Atom01Icon },
]

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) redirect('/dashboard')

  return (
    <div className="relative flex-1">
      <header className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between relative z-20 border-b border-line/60">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="md" />
        </Link>
        <nav className="flex items-center gap-2 font-mono text-[12px]">
          <span className="hidden sm:inline text-fade">v0.1.0</span>
          <span className="hidden sm:inline text-mute mx-2">·</span>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 rounded-md border border-ruling bg-shade px-3 py-1.5 text-ink hover:border-edge hover:bg-lift transition-colors"
          >
            <span className="text-lime">$</span>
            <span>continue with github</span>
          </Link>
        </nav>
      </header>

      <main className="relative z-10">
        <StackPulseHero />

        {/* Divider with section anchor */}
        <div className="mx-auto max-w-7xl px-6 mt-16 sm:mt-24">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-fade tracking-[0.25em] uppercase">
              §&nbsp;how_it_works
            </span>
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-[11px] text-mute">3 steps</span>
          </div>
        </div>

        {/* Steps */}
        <section className="mx-auto max-w-7xl px-6 pt-10 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
            {steps.map((s) => (
              <div
                key={s.n}
                className="group relative bg-shade p-7 lg:p-8 hover:bg-lift transition-colors"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-fade">
                  <span className="text-lime">{s.n}</span>
                  <span>step</span>
                </div>
                <div className="mt-6 font-mono text-[12px] text-dust">
                  <span className="text-fade">$ </span>
                  <span className="text-lime">{s.cmd.split(' ')[0]}</span>{' '}
                  <span>{s.cmd.split(' ').slice(1).join(' ')}</span>
                </div>
                <h3 className="mt-4 font-mono text-[20px] font-semibold tracking-tight text-ink lowercase">
                  {s.title}
                </h3>
                <p className="mt-3 text-[14px] text-dust leading-relaxed">{s.body}</p>
                <div className="mt-8 h-px w-8 bg-ruling group-hover:bg-lime group-hover:w-14 transition-all duration-300" />
              </div>
            ))}
          </div>
        </section>

        {/* Tracked stacks */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-fade tracking-[0.25em] uppercase">
              §&nbsp;tracked_stacks
            </span>
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-[11px] text-mute">+ custom repos</span>
          </div>
        </div>

        <section className="mx-auto max-w-7xl px-6 pt-10 pb-24">
          <div className="frame overflow-hidden">
            <div className="frame-titlebar">
              <span className="win-dots">
                <span style={{ background: '#fb7185' }} />
                <span style={{ background: '#fbbf24' }} />
                <span style={{ background: '#34d399' }} />
              </span>
              <span className="text-dust">~/registry.json</span>
              <span className="ml-auto text-mute">+ {trackedStacks.length - 6} more</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-line">
              {trackedStacks.map(({ name, icon: Icon }) => (
                <div
                  key={name}
                  className="bg-shade hover:bg-lift transition-colors px-4 py-5 flex items-center gap-3 group"
                >
                  <Icon className="w-5 h-5 text-dust group-hover:text-lime transition-colors" />
                  <span className="font-mono text-[13px] text-ink">{name}</span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-line font-mono text-[11px] text-fade flex items-center justify-between">
              <span>missing one? add any github repo from onboarding</span>
              <Link href="/sign-in" className="text-lime hover:underline">
                add custom →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA bar */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="frame relative overflow-hidden p-8 sm:p-12 text-center">
            <div className="font-mono text-[11px] text-fade tracking-[0.25em] uppercase mb-4">
              ready?
            </div>
            <h2 className="font-mono text-3xl sm:text-5xl font-bold tracking-tight text-ink">
              stop scrolling release notes.
            </h2>
            <p className="mt-3 text-dust">Start with three clicks. Free forever for individuals.</p>
            <Link
              href="/sign-in"
              className="mt-7 inline-flex items-center gap-2 rounded-md bg-lime px-5 py-3 font-mono text-[13px] font-semibold text-void hover:bg-lime/85 transition-colors"
            >
              <span className="text-void/60">$</span>
              <span>./start</span>
              <span>→</span>
            </Link>
          </div>
        </section>

        <footer className="border-t border-line">
          <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-fade">
            <Logo size="sm" />
            <p className="tracking-widest">{'// built for developers, by a developer'}</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-ink transition-colors">
                privacy
              </Link>
              <Link href="/terms" className="hover:text-ink transition-colors">
                terms
              </Link>
              <a
                href="https://github.com/daniel-ctn/stack-pulse"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors"
              >
                source ↗
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
