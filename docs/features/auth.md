# Authentication

**Status:** current

## Provider

- **Better Auth** with GitHub OAuth only (`src/lib/auth.ts`)
- Drizzle adapter maps to `users`, `accounts`, `sessions`, `verifications` in `src/db/schema.ts`
- API route: `src/app/api/auth/[...all]/route.ts` via `toNextJsHandler`

## Environment

Production **requires**:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` or `NEXT_PUBLIC_APP_URL` (trusted origins)
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

In development, GitHub provider is omitted if client ID/secret are unset (auth still initializes).

## Optional

- `BETTER_AUTH_API_KEY` — enables `@better-auth/infra` dash plugin

## Client

- `src/lib/auth-client.ts` — browser client for sign-in/out

## Callback URL

`{BETTER_AUTH_URL}/api/auth/callback/github`

## Account deletion

`deleteAccountAction` in `src/lib/actions.ts` removes user data (cascade via FK).
