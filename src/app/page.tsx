import Link from 'next/link'
import { ZapIcon, Notification03Icon, SparklesIcon } from 'hugeicons-react'
import { Logo } from '@/components/logo'
import { StackPulseHero } from '@/components/stack-pulse-hero'

const features = [
  {
    index: '01',
    icon: ZapIcon,
    title: 'Track Your Stack',
    body: 'Select the frameworks and libraries you use. We monitor their GitHub releases so you never miss a change.',
  },
  {
    index: '02',
    icon: SparklesIcon,
    title: 'AI Distilled',
    body: 'Every release is summarized into crisp highlights — breaking changes, new features, and relevant code. No fluff.',
  },
  {
    index: '03',
    icon: Notification03Icon,
    title: 'One Feed. Daily.',
    body: 'Open your dashboard once a day. Everything new across your entire stack, organized in a clean timeline.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex-1">
      <header className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between relative z-20">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="md" />
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/sign-in" className="text-dust hover:text-ink transition-colors">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border border-ruling px-4 py-1.5 text-sm font-medium text-ink hover:bg-shade transition-colors"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      <main>
        <StackPulseHero />

        <div className="mx-auto max-w-7xl px-6 -mt-4 sm:-mt-6">
          <div className="relative h-px bg-gradient-to-r from-transparent via-ruling to-transparent" />
          <p className="text-center mt-12 font-mono text-xs text-fade tracking-[0.25em] uppercase">
            How it works
          </p>
        </div>

        <section className="mx-auto max-w-7xl px-6 pt-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {features.map(({ index, icon: Icon, title, body }, i) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-line bg-shade/50 p-8 lg:p-10 hover:border-ruling hover:bg-shade transition-all duration-300"
              >
                <span className="font-mono text-xs text-fade tracking-widest">{index}</span>
                <span className="block w-8 h-px bg-ruling mt-6 mb-6 group-hover:w-12 group-hover:bg-amber transition-all duration-300" />
                <Icon className="w-6 h-6 text-dust mb-4 group-hover:text-amber transition-colors duration-300" />
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h3>
                <p className="mt-3 text-sm text-dust leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-line mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="font-mono text-xs text-fade tracking-widest">STACK.PULSE</p>
            <p className="font-mono text-[10px] text-fade/60">Built for developers</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
