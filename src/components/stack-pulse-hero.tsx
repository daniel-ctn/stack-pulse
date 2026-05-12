'use client'

import { useRef, type RefObject } from 'react'
import { motion } from 'motion/react'
import { AnimatedBeam } from '@/components/ui/animated-beam'
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
} from 'hugeicons-react'

type TechNode = {
  name: string
  icon: React.ComponentType<{ className?: string }>
  position: { x: string; y: string }
}

const techNodes: TechNode[] = [
  { name: 'React', icon: ReactIcon, position: { x: '50%', y: '6%' } },
  { name: 'Next.js', icon: SourceCodeIcon, position: { x: '80%', y: '12%' } },
  { name: 'Tailwind', icon: TailwindcssIcon, position: { x: '94%', y: '30%' } },
  { name: 'shadcn/ui', icon: ShadcnIcon, position: { x: '94%', y: '50%' } },
  { name: 'Prisma', icon: Database02Icon, position: { x: '94%', y: '70%' } },
  { name: 'TypeScript', icon: Typescript03Icon, position: { x: '80%', y: '88%' } },
  { name: 'Astro', icon: RocketIcon, position: { x: '50%', y: '94%' } },
  { name: 'Svelte', icon: SourceCodeIcon, position: { x: '20%', y: '88%' } },
  { name: 'Drizzle', icon: Database02Icon, position: { x: '6%', y: '70%' } },
  { name: 'Remix', icon: ServerStack01Icon, position: { x: '6%', y: '50%' } },
  { name: 'Vite', icon: ZapIcon, position: { x: '6%', y: '30%' } },
  { name: 'Bun', icon: Package01Icon, position: { x: '20%', y: '12%' } },
]

function TechNodeButton({
  node,
  nodeRef,
}: {
  node: TechNode
  nodeRef: RefObject<HTMLDivElement | null>
}) {
  const Icon = node.icon
  return (
    <div
      ref={nodeRef}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: node.position.x, top: node.position.y }}
    >
      <motion.div
        className="flex items-center justify-center w-12 h-12 rounded-full bg-shade border border-ruling shadow-lg"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(212,160,23,0)',
            '0 0 14px 3px rgba(212,160,23,0.12)',
            '0 0 0 0 rgba(212,160,23,0)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="w-5 h-5 text-dust" />
      </motion.div>
      <p className="mt-1.5 text-[10px] font-medium text-fade text-center leading-tight">
        {node.name}
      </p>
    </div>
  )
}

export function StackPulseHero() {
  const containerRef = useRef<HTMLDivElement>(null!)
  const hubRef = useRef<HTMLDivElement>(null!)
  const nodeRefs = useRef<Array<RefObject<HTMLDivElement | null>>>(
    techNodes.map(() => ({ current: null })),
  )

  return (
    <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-6 sm:pt-24 sm:pb-8">
      <div ref={containerRef} className="relative h-[340px] sm:h-[420px] lg:h-[480px]">
        {techNodes.map((node, i) => (
          <AnimatedBeam
            key={node.name}
            containerRef={containerRef}
            fromRef={nodeRefs.current[i]}
            toRef={hubRef}
            curvature={-40 + i * 10}
            duration={4 + i * 0.5}
            delay={i * 0.3}
            pathColor="#323235"
            pathWidth={1.5}
            pathOpacity={0.4}
            gradientStartColor="#d4a017"
            gradientStopColor="#d4a017"
          />
        ))}

        {techNodes.map((node, i) => (
          <TechNodeButton key={node.name} node={node} nodeRef={nodeRefs.current[i]} />
        ))}

        <div
          ref={hubRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        >
          <motion.div
            className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber text-void shadow-[0_0_60px_rgba(212,160,23,0.3)]"
            animate={{
              scale: [1, 1.04, 1],
              boxShadow: [
                '0 0 40px rgba(212,160,23,0.3)',
                '0 0 64px rgba(212,160,23,0.45)',
                '0 0 40px rgba(212,160,23,0.3)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="8" width="20" height="4" rx="2" fill="#09090b" />
              <rect x="6" y="14" width="16" height="4" rx="2" fill="#09090b" opacity="0.7" />
              <rect x="6" y="20" width="12" height="4" rx="2" fill="#09090b" opacity="0.4" />
            </svg>
          </motion.div>
        </div>
      </div>

      <div className="text-center relative z-10 py-10 sm:py-12">
        <motion.p
          className="font-mono text-xs text-amber tracking-[0.2em] uppercase mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Connect your entire stack
        </motion.p>
        <motion.h1
          className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-ink"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Every release.
          <br />
          <span className="text-amber">One feed.</span>
        </motion.h1>
        <motion.p
          className="mt-5 max-w-lg mx-auto text-base sm:text-lg text-dust leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          StackPulse watches your frameworks on GitHub and turns release notes into AI-powered daily
          digests — breaking changes, new features, and code you can use.
        </motion.p>
        <motion.div
          className="mt-8 flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-amber px-6 py-3 text-sm font-semibold text-void hover:bg-amber/80 transition-colors"
          >
            Start Reading Free
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-xl border border-ruling px-6 py-3 text-sm font-semibold text-ink hover:bg-shade transition-colors"
          >
            Sign In
          </a>
        </motion.div>
      </div>
    </div>
  )
}
