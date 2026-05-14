import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { dash } from '@better-auth/infra'
import { db } from '@/db'
import * as schema from '@/db/schema'

const trustedOrigins = [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter(
  Boolean,
) as string[]

if (process.env.NODE_ENV === 'production') {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET is required in production')
  }
  if (trustedOrigins.length === 0) {
    throw new Error(
      'BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL must be set in production (trustedOrigins is empty)',
    )
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  trustedOrigins,
  plugins: [
    nextCookies(),
    ...(process.env.BETTER_AUTH_API_KEY ? [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })] : []),
  ],
})
