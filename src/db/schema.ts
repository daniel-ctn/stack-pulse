import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  pgEnum,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core'

export const subscriptionStatus = pgEnum('subscription_status', ['free', 'pro', 'cancelled'])

export const importanceLevel = pgEnum('importance_level', ['low', 'medium', 'high', 'critical'])

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  emailVerified: boolean('email_verified').notNull().default(false),
  subscriptionStatus: subscriptionStatus('subscription_status').notNull().default('free'),
  lemonSqueezyCustomerId: text('lemonsqueezy_customer_id'),
  lemonSqueezySubscriptionId: text('lemonsqueezy_subscription_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const technologies = pgTable('technologies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  githubRepoUrl: text('github_repo_url').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  category: text('category'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const userTechPreferences = pgTable(
  'user_tech_preferences',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    techId: uuid('tech_id')
      .notNull()
      .references(() => technologies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.techId] })],
)

export const releaseUpdates = pgTable(
  'release_updates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    techId: uuid('tech_id')
      .notNull()
      .references(() => technologies.id, { onDelete: 'cascade' }),
    version: text('version').notNull(),
    title: text('title'),
    summary: text('summary'),
    newFeatures: jsonb('new_features').$type<string[]>(),
    breakingChanges: jsonb('breaking_changes').$type<string[]>(),
    codeSnippet: text('code_snippet'),
    importanceLevel: importanceLevel('importance_level').default('medium'),
    rawReleaseUrl: text('raw_release_url'),
    publishedAt: timestamp('published_at'),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique('release_updates_tech_version_unique').on(t.techId, t.version)],
)

export const userReadReleases = pgTable(
  'user_read_releases',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    releaseId: uuid('release_id')
      .notNull()
      .references(() => releaseUpdates.id, { onDelete: 'cascade' }),
    readAt: timestamp('read_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.releaseId] })],
)

// BetterAuth tables
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
