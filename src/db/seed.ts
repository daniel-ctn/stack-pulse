import { db } from './index'
import { technologies } from './schema'
import { eq } from 'drizzle-orm'
import 'dotenv/config'

const seedTechnologies = [
  {
    name: 'Next.js',
    slug: 'nextjs',
    githubRepoUrl: 'https://github.com/vercel/next.js',
    description: 'The React Framework for the Web',
    category: 'framework',
  },
  {
    name: 'React',
    slug: 'react',
    githubRepoUrl: 'https://github.com/facebook/react',
    description: 'The library for web and native user interfaces',
    category: 'library',
  },
  {
    name: 'Tailwind CSS',
    slug: 'tailwindcss',
    githubRepoUrl: 'https://github.com/tailwindlabs/tailwindcss',
    description: 'A utility-first CSS framework',
    category: 'styling',
  },
  {
    name: 'Drizzle ORM',
    slug: 'drizzle-orm',
    githubRepoUrl: 'https://github.com/drizzle-team/drizzle-orm',
    description: 'TypeScript ORM for SQL databases',
    category: 'orm',
  },
  {
    name: 'TypeScript',
    slug: 'typescript',
    githubRepoUrl: 'https://github.com/microsoft/typescript',
    description: 'JavaScript with syntax for types',
    category: 'language',
  },
  {
    name: 'Prisma',
    slug: 'prisma',
    githubRepoUrl: 'https://github.com/prisma/prisma',
    description: 'Next-generation Node.js and TypeScript ORM',
    category: 'orm',
  },
  {
    name: 'shadcn/ui',
    slug: 'shadcn-ui',
    githubRepoUrl: 'https://github.com/shadcn-ui/ui',
    description: 'Beautifully designed components built with Radix UI and Tailwind CSS',
    category: 'styling',
  },
  {
    name: 'Vite',
    slug: 'vite',
    githubRepoUrl: 'https://github.com/vitejs/vite',
    description: 'Next Generation Frontend Tooling',
    category: 'tooling',
  },
  {
    name: 'Astro',
    slug: 'astro',
    githubRepoUrl: 'https://github.com/withastro/astro',
    description: 'The web framework for content-driven websites',
    category: 'framework',
  },
  {
    name: 'Bun',
    slug: 'bun',
    githubRepoUrl: 'https://github.com/oven-sh/bun',
    description: 'Incredibly fast JavaScript runtime, bundler, test runner, and package manager',
    category: 'tooling',
  },
  {
    name: 'Svelte',
    slug: 'svelte',
    githubRepoUrl: 'https://github.com/sveltejs/svelte',
    description: 'Cybernetically enhanced web apps',
    category: 'framework',
  },
  {
    name: 'Remix',
    slug: 'remix',
    githubRepoUrl: 'https://github.com/remix-run/remix',
    description: 'Full stack web framework with focus on web standards',
    category: 'framework',
  },
  {
    name: 'SolidJS',
    slug: 'solidjs',
    githubRepoUrl: 'https://github.com/solidjs/solid',
    description: 'Simple and performant reactivity for building user interfaces',
    category: 'library',
  },
  {
    name: 'tRPC',
    slug: 'trpc',
    githubRepoUrl: 'https://github.com/trpc/trpc',
    description: 'End-to-end typesafe APIs made easy',
    category: 'library',
  },
  {
    name: 'Zod',
    slug: 'zod',
    githubRepoUrl: 'https://github.com/colinhacks/zod',
    description: 'TypeScript-first schema validation with static type inference',
    category: 'library',
  },
  {
    name: 'Turborepo',
    slug: 'turborepo',
    githubRepoUrl: 'https://github.com/vercel/turborepo',
    description: 'High-performance build system for JavaScript and TypeScript monorepos',
    category: 'tooling',
  },
  {
    name: 'TanStack Query',
    slug: 'tanstack-query',
    githubRepoUrl: 'https://github.com/tanstack/query',
    description: 'Powerful asynchronous state management for TS/JS',
    category: 'library',
  },
  {
    name: 'Hono',
    slug: 'hono',
    githubRepoUrl: 'https://github.com/honojs/hono',
    description: 'Ultrafast web framework for the Edges',
    category: 'framework',
  },
  {
    name: 'Better Auth',
    slug: 'better-auth',
    githubRepoUrl: 'https://github.com/better-auth/better-auth',
    description: 'The most comprehensive authentication framework for TypeScript',
    category: 'library',
  },
  {
    name: 'pnpm',
    slug: 'pnpm',
    githubRepoUrl: 'https://github.com/pnpm/pnpm',
    description: 'Fast, disk space efficient package manager',
    category: 'tooling',
  },
]

async function main() {
  console.log('Seeding technologies...')

  for (const tech of seedTechnologies) {
    const existing = await db
      .select({ id: technologies.id })
      .from(technologies)
      .where(eq(technologies.slug, tech.slug))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(technologies).values(tech)
      console.log(`  Inserted: ${tech.name}`)
    } else {
      console.log(`  Skipped (exists): ${tech.name}`)
    }
  }

  console.log('Seed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
