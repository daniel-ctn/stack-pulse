import 'dotenv/config'
import { getDb } from './index'
import { technologies } from './schema'
import { eq } from 'drizzle-orm'

type SeedTech = {
  name: string
  slug: string
  githubRepoUrl: string
  description: string
  category: string
}

const seedTechnologies: SeedTech[] = [
  // frameworks
  {
    name: 'Next.js',
    slug: 'nextjs',
    githubRepoUrl: 'https://github.com/vercel/next.js',
    description: 'The React Framework for the Web',
    category: 'framework',
  },
  {
    name: 'Astro',
    slug: 'astro',
    githubRepoUrl: 'https://github.com/withastro/astro',
    description: 'The web framework for content-driven websites',
    category: 'framework',
  },
  {
    name: 'Svelte',
    slug: 'svelte',
    githubRepoUrl: 'https://github.com/sveltejs/svelte',
    description: 'Cybernetically enhanced web apps',
    category: 'framework',
  },
  {
    name: 'SvelteKit',
    slug: 'sveltekit',
    githubRepoUrl: 'https://github.com/sveltejs/kit',
    description: 'Web development, streamlined',
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
    name: 'Vue',
    slug: 'vue',
    githubRepoUrl: 'https://github.com/vuejs/core',
    description: 'The progressive JavaScript framework',
    category: 'framework',
  },
  {
    name: 'Nuxt',
    slug: 'nuxt',
    githubRepoUrl: 'https://github.com/nuxt/nuxt',
    description: 'The intuitive Vue framework',
    category: 'framework',
  },
  {
    name: 'Angular',
    slug: 'angular',
    githubRepoUrl: 'https://github.com/angular/angular',
    description: 'The web development framework for building modern apps',
    category: 'framework',
  },
  {
    name: 'Qwik',
    slug: 'qwik',
    githubRepoUrl: 'https://github.com/QwikDev/qwik',
    description: 'Instant-loading web apps without effort',
    category: 'framework',
  },
  {
    name: 'Hono',
    slug: 'hono',
    githubRepoUrl: 'https://github.com/honojs/hono',
    description: 'Ultrafast web framework for the Edges',
    category: 'framework',
  },
  {
    name: 'Express',
    slug: 'express',
    githubRepoUrl: 'https://github.com/expressjs/express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js',
    category: 'framework',
  },
  {
    name: 'Fastify',
    slug: 'fastify',
    githubRepoUrl: 'https://github.com/fastify/fastify',
    description: 'Fast and low overhead web framework for Node.js',
    category: 'framework',
  },
  {
    name: 'NestJS',
    slug: 'nestjs',
    githubRepoUrl: 'https://github.com/nestjs/nest',
    description: 'A progressive Node.js framework for scalable server-side apps',
    category: 'framework',
  },
  {
    name: 'Eleventy',
    slug: 'eleventy',
    githubRepoUrl: 'https://github.com/11ty/eleventy',
    description: 'A simpler static site generator',
    category: 'framework',
  },
  {
    name: 'Docusaurus',
    slug: 'docusaurus',
    githubRepoUrl: 'https://github.com/facebook/docusaurus',
    description: 'Easy to maintain open source documentation websites',
    category: 'framework',
  },

  // libraries
  {
    name: 'React',
    slug: 'react',
    githubRepoUrl: 'https://github.com/facebook/react',
    description: 'The library for web and native user interfaces',
    category: 'library',
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
    name: 'Valibot',
    slug: 'valibot',
    githubRepoUrl: 'https://github.com/fabian-hiller/valibot',
    description: 'The modular and type-safe schema library',
    category: 'library',
  },
  {
    name: 'React Router',
    slug: 'react-router',
    githubRepoUrl: 'https://github.com/remix-run/react-router',
    description: 'Declarative routing for React',
    category: 'library',
  },
  {
    name: 'TanStack Router',
    slug: 'tanstack-router',
    githubRepoUrl: 'https://github.com/tanstack/router',
    description: 'Type-safe router with built-in caching for React and Solid',
    category: 'library',
  },
  {
    name: 'TanStack Table',
    slug: 'tanstack-table',
    githubRepoUrl: 'https://github.com/tanstack/table',
    description: 'Headless UI for building powerful tables and datagrids',
    category: 'library',
  },
  {
    name: 'date-fns',
    slug: 'date-fns',
    githubRepoUrl: 'https://github.com/date-fns/date-fns',
    description: 'Modern JavaScript date utility library',
    category: 'library',
  },
  {
    name: 'Axios',
    slug: 'axios',
    githubRepoUrl: 'https://github.com/axios/axios',
    description: 'Promise based HTTP client for the browser and Node.js',
    category: 'library',
  },
  {
    name: 'Effect',
    slug: 'effect',
    githubRepoUrl: 'https://github.com/Effect-TS/effect',
    description: 'A fully-fledged functional effect system for TypeScript',
    category: 'library',
  },
  {
    name: 'Three.js',
    slug: 'threejs',
    githubRepoUrl: 'https://github.com/mrdoob/three.js',
    description: 'JavaScript 3D library',
    category: 'library',
  },
  {
    name: 'D3',
    slug: 'd3',
    githubRepoUrl: 'https://github.com/d3/d3',
    description: 'Bring data to life with SVG, Canvas and HTML',
    category: 'library',
  },
  {
    name: 'Stripe Node',
    slug: 'stripe-node',
    githubRepoUrl: 'https://github.com/stripe/stripe-node',
    description: 'Node.js library for the Stripe API',
    category: 'library',
  },

  // ui
  {
    name: 'shadcn/ui',
    slug: 'shadcn-ui',
    githubRepoUrl: 'https://github.com/shadcn-ui/ui',
    description: 'Beautifully designed components built with Radix UI and Tailwind CSS',
    category: 'ui',
  },
  {
    name: 'Base UI',
    slug: 'base-ui',
    githubRepoUrl: 'https://github.com/mui/base-ui',
    description: 'Unstyled UI components for building accessible interfaces',
    category: 'ui',
  },
  {
    name: 'Material UI',
    slug: 'material-ui',
    githubRepoUrl: 'https://github.com/mui/material-ui',
    description: "React components implementing Google's Material Design",
    category: 'ui',
  },
  {
    name: 'Chakra UI',
    slug: 'chakra-ui',
    githubRepoUrl: 'https://github.com/chakra-ui/chakra-ui',
    description: 'Accessible component system for React applications',
    category: 'ui',
  },
  {
    name: 'Mantine',
    slug: 'mantine',
    githubRepoUrl: 'https://github.com/mantinedev/mantine',
    description: 'Fully featured React components library',
    category: 'ui',
  },

  // styling
  {
    name: 'Tailwind CSS',
    slug: 'tailwindcss',
    githubRepoUrl: 'https://github.com/tailwindlabs/tailwindcss',
    description: 'A utility-first CSS framework',
    category: 'styling',
  },
  {
    name: 'daisyUI',
    slug: 'daisyui',
    githubRepoUrl: 'https://github.com/saadeghi/daisyui',
    description: 'The most popular component library for Tailwind CSS',
    category: 'styling',
  },

  // state
  {
    name: 'Redux Toolkit',
    slug: 'redux-toolkit',
    githubRepoUrl: 'https://github.com/reduxjs/redux-toolkit',
    description: 'The official, batteries-included toolset for Redux',
    category: 'state',
  },
  {
    name: 'Zustand',
    slug: 'zustand',
    githubRepoUrl: 'https://github.com/pmndrs/zustand',
    description: 'Bear necessities for state management in React',
    category: 'state',
  },
  {
    name: 'Jotai',
    slug: 'jotai',
    githubRepoUrl: 'https://github.com/pmndrs/jotai',
    description: 'Primitive and flexible state management for React',
    category: 'state',
  },
  {
    name: 'XState',
    slug: 'xstate',
    githubRepoUrl: 'https://github.com/statelyai/xstate',
    description: 'Actor-based state management and orchestration',
    category: 'state',
  },
  {
    name: 'MobX',
    slug: 'mobx',
    githubRepoUrl: 'https://github.com/mobxjs/mobx',
    description: 'Simple, scalable state management through reactive programming',
    category: 'state',
  },

  // data fetching & clients
  {
    name: 'TanStack Query',
    slug: 'tanstack-query',
    githubRepoUrl: 'https://github.com/tanstack/query',
    description: 'Powerful asynchronous state management for TS/JS',
    category: 'data',
  },
  {
    name: 'SWR',
    slug: 'swr',
    githubRepoUrl: 'https://github.com/vercel/swr',
    description: 'React Hooks for data fetching',
    category: 'data',
  },
  {
    name: 'Apollo Client',
    slug: 'apollo-client',
    githubRepoUrl: 'https://github.com/apollographql/apollo-client',
    description: 'Fully-featured caching GraphQL client',
    category: 'data',
  },
  {
    name: 'Supabase JS',
    slug: 'supabase-js',
    githubRepoUrl: 'https://github.com/supabase/supabase-js',
    description: 'Isomorphic JavaScript client for Supabase',
    category: 'data',
  },
  {
    name: 'Firebase JS SDK',
    slug: 'firebase-js-sdk',
    githubRepoUrl: 'https://github.com/firebase/firebase-js-sdk',
    description: 'Firebase client SDK for web and Node.js',
    category: 'data',
  },

  // orm & database
  {
    name: 'Drizzle ORM',
    slug: 'drizzle-orm',
    githubRepoUrl: 'https://github.com/drizzle-team/drizzle-orm',
    description: 'TypeScript ORM for SQL databases',
    category: 'orm',
  },
  {
    name: 'Prisma',
    slug: 'prisma',
    githubRepoUrl: 'https://github.com/prisma/prisma',
    description: 'Next-generation Node.js and TypeScript ORM',
    category: 'orm',
  },
  {
    name: 'Kysely',
    slug: 'kysely',
    githubRepoUrl: 'https://github.com/kysely-org/kysely',
    description: 'Type-safe SQL query builder for TypeScript',
    category: 'orm',
  },
  {
    name: 'Sequelize',
    slug: 'sequelize',
    githubRepoUrl: 'https://github.com/sequelize/sequelize',
    description: 'Feature-rich ORM for modern Node.js and TypeScript',
    category: 'orm',
  },
  {
    name: 'TypeORM',
    slug: 'typeorm',
    githubRepoUrl: 'https://github.com/typeorm/typeorm',
    description: 'ORM for TypeScript and JavaScript',
    category: 'orm',
  },
  {
    name: 'Mongoose',
    slug: 'mongoose',
    githubRepoUrl: 'https://github.com/Automattic/mongoose',
    description: 'MongoDB object modeling for Node.js',
    category: 'orm',
  },

  // languages
  {
    name: 'TypeScript',
    slug: 'typescript',
    githubRepoUrl: 'https://github.com/microsoft/typescript',
    description: 'JavaScript with syntax for types',
    category: 'language',
  },
  {
    name: 'Rust',
    slug: 'rust',
    githubRepoUrl: 'https://github.com/rust-lang/rust',
    description: 'A language empowering everyone to build reliable software',
    category: 'language',
  },

  // runtimes
  {
    name: 'Node.js',
    slug: 'nodejs',
    githubRepoUrl: 'https://github.com/nodejs/node',
    description: 'JavaScript runtime built on Chrome’s V8 engine',
    category: 'runtime',
  },
  {
    name: 'Bun',
    slug: 'bun',
    githubRepoUrl: 'https://github.com/oven-sh/bun',
    description: 'Incredibly fast JavaScript runtime, bundler, test runner, and package manager',
    category: 'runtime',
  },
  {
    name: 'Deno',
    slug: 'deno',
    githubRepoUrl: 'https://github.com/denoland/deno',
    description: 'A modern runtime for JavaScript and TypeScript',
    category: 'runtime',
  },

  // tooling
  {
    name: 'Vite',
    slug: 'vite',
    githubRepoUrl: 'https://github.com/vitejs/vite',
    description: 'Next Generation Frontend Tooling',
    category: 'tooling',
  },
  {
    name: 'Turborepo',
    slug: 'turborepo',
    githubRepoUrl: 'https://github.com/vercel/turborepo',
    description: 'High-performance build system for JavaScript and TypeScript monorepos',
    category: 'tooling',
  },
  {
    name: 'Nx',
    slug: 'nx',
    githubRepoUrl: 'https://github.com/nrwl/nx',
    description: 'Smart monorepos with fast, reliable builds',
    category: 'tooling',
  },
  {
    name: 'esbuild',
    slug: 'esbuild',
    githubRepoUrl: 'https://github.com/evanw/esbuild',
    description: 'An extremely fast bundler for the web',
    category: 'tooling',
  },
  {
    name: 'Rollup',
    slug: 'rollup',
    githubRepoUrl: 'https://github.com/rollup/rollup',
    description: 'Next-generation ES module bundler',
    category: 'tooling',
  },
  {
    name: 'webpack',
    slug: 'webpack',
    githubRepoUrl: 'https://github.com/webpack/webpack',
    description: 'A bundler for JavaScript and friends',
    category: 'tooling',
  },
  {
    name: 'Rspack',
    slug: 'rspack',
    githubRepoUrl: 'https://github.com/web-infra-dev/rspack',
    description: 'Fast Rust-based web bundler with webpack-compatible API',
    category: 'tooling',
  },
  {
    name: 'SWC',
    slug: 'swc',
    githubRepoUrl: 'https://github.com/swc-project/swc',
    description: 'Rust-based platform for fast TypeScript/JavaScript compilation',
    category: 'tooling',
  },
  {
    name: 'Biome',
    slug: 'biome',
    githubRepoUrl: 'https://github.com/biomejs/biome',
    description: 'One toolchain for your web project: format, lint, and more',
    category: 'tooling',
  },
  {
    name: 'ESLint',
    slug: 'eslint',
    githubRepoUrl: 'https://github.com/eslint/eslint',
    description: 'Find and fix problems in your JavaScript code',
    category: 'tooling',
  },
  {
    name: 'Prettier',
    slug: 'prettier',
    githubRepoUrl: 'https://github.com/prettier/prettier',
    description: 'Opinionated code formatter',
    category: 'tooling',
  },
  {
    name: 'pnpm',
    slug: 'pnpm',
    githubRepoUrl: 'https://github.com/pnpm/pnpm',
    description: 'Fast, disk space efficient package manager',
    category: 'tooling',
  },
  {
    name: 'npm',
    slug: 'npm',
    githubRepoUrl: 'https://github.com/npm/cli',
    description: 'The package manager for JavaScript',
    category: 'tooling',
  },
  {
    name: 'Yarn',
    slug: 'yarn',
    githubRepoUrl: 'https://github.com/yarnpkg/berry',
    description: 'Modern package management for JavaScript projects',
    category: 'tooling',
  },
  {
    name: 'Storybook',
    slug: 'storybook',
    githubRepoUrl: 'https://github.com/storybookjs/storybook',
    description: 'Industry standard workshop for building and testing UI components',
    category: 'tooling',
  },

  // testing
  {
    name: 'Vitest',
    slug: 'vitest',
    githubRepoUrl: 'https://github.com/vitest-dev/vitest',
    description: 'Next generation testing framework powered by Vite',
    category: 'testing',
  },
  {
    name: 'Jest',
    slug: 'jest',
    githubRepoUrl: 'https://github.com/jestjs/jest',
    description: 'Delightful JavaScript testing framework',
    category: 'testing',
  },
  {
    name: 'Playwright',
    slug: 'playwright',
    githubRepoUrl: 'https://github.com/microsoft/playwright',
    description: 'Reliable end-to-end testing for modern web apps',
    category: 'testing',
  },
  {
    name: 'Cypress',
    slug: 'cypress',
    githubRepoUrl: 'https://github.com/cypress-io/cypress',
    description: 'Fast, easy and reliable testing for anything in a browser',
    category: 'testing',
  },

  // mobile & desktop
  {
    name: 'React Native',
    slug: 'react-native',
    githubRepoUrl: 'https://github.com/facebook/react-native',
    description: 'Build native apps with React',
    category: 'mobile',
  },
  {
    name: 'Expo',
    slug: 'expo',
    githubRepoUrl: 'https://github.com/expo/expo',
    description: 'Open-source framework for universal native apps with React',
    category: 'mobile',
  },
  {
    name: 'Flutter',
    slug: 'flutter',
    githubRepoUrl: 'https://github.com/flutter/flutter',
    description: 'Build beautiful multi-platform apps from a single codebase',
    category: 'mobile',
  },
  {
    name: 'Ionic',
    slug: 'ionic',
    githubRepoUrl: 'https://github.com/ionic-team/ionic-framework',
    description: 'Cross-platform mobile apps with web technology',
    category: 'mobile',
  },
  {
    name: 'Electron',
    slug: 'electron',
    githubRepoUrl: 'https://github.com/electron/electron',
    description: 'Build cross-platform desktop apps with JavaScript, HTML, and CSS',
    category: 'desktop',
  },
  {
    name: 'Tauri',
    slug: 'tauri',
    githubRepoUrl: 'https://github.com/tauri-apps/tauri',
    description: 'Smaller, faster, more secure desktop and mobile apps',
    category: 'desktop',
  },

  // ai
  {
    name: 'Vercel AI SDK',
    slug: 'vercel-ai-sdk',
    githubRepoUrl: 'https://github.com/vercel/ai',
    description: 'The AI toolkit for TypeScript',
    category: 'ai',
  },
  {
    name: 'OpenAI Node',
    slug: 'openai-node',
    githubRepoUrl: 'https://github.com/openai/openai-node',
    description: 'Official Node.js library for the OpenAI API',
    category: 'ai',
  },
  {
    name: 'Anthropic SDK',
    slug: 'anthropic-sdk',
    githubRepoUrl: 'https://github.com/anthropics/anthropic-sdk-typescript',
    description: 'Official TypeScript SDK for the Anthropic API',
    category: 'ai',
  },
  {
    name: 'LangChain.js',
    slug: 'langchainjs',
    githubRepoUrl: 'https://github.com/langchain-ai/langchainjs',
    description: 'Build context-aware reasoning applications in JavaScript',
    category: 'ai',
  },
  {
    name: 'Ollama',
    slug: 'ollama',
    githubRepoUrl: 'https://github.com/ollama/ollama',
    description: 'Get up and running with large language models locally',
    category: 'ai',
  },
  {
    name: 'Mastra',
    slug: 'mastra',
    githubRepoUrl: 'https://github.com/mastra-ai/mastra',
    description: 'TypeScript agent framework with workflows, RAG, and evals',
    category: 'ai',
  },

  // auth
  {
    name: 'Better Auth',
    slug: 'better-auth',
    githubRepoUrl: 'https://github.com/better-auth/better-auth',
    description: 'The most comprehensive authentication framework for TypeScript',
    category: 'auth',
  },
  {
    name: 'Auth.js',
    slug: 'authjs',
    githubRepoUrl: 'https://github.com/nextauthjs/next-auth',
    description: 'Authentication for the Web',
    category: 'auth',
  },
]

async function main() {
  const db = getDb()

  console.log(`Seeding ${seedTechnologies.length} technologies...`)

  let inserted = 0
  let updated = 0

  for (const tech of seedTechnologies) {
    const existing = await db
      .select({ id: technologies.id })
      .from(technologies)
      .where(eq(technologies.slug, tech.slug))
      .limit(1)

    if (existing.length === 0) {
      await db.insert(technologies).values(tech)
      inserted++
      console.log(`  Inserted: ${tech.name}`)
    } else {
      // Keep registry rows in sync with this file (descriptions, categories, repo moves).
      await db
        .update(technologies)
        .set({
          name: tech.name,
          githubRepoUrl: tech.githubRepoUrl,
          description: tech.description,
          category: tech.category,
        })
        .where(eq(technologies.slug, tech.slug))
      updated++
    }
  }

  console.log(`Seed complete: ${inserted} inserted, ${updated} updated.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
