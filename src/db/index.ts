import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Db = ReturnType<typeof drizzle>

let db: Db | null = null

export function getDb(): Db {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required')
    }
    db = drizzle(neon(databaseUrl), { schema })
  }

  return db
}
