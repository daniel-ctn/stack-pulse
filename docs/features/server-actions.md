# Server actions

**Status:** current

All in `src/lib/actions.ts` (`'use server'`).

| Action | Auth | Purpose |
|--------|------|---------|
| `saveTechPreferences(techIds)` | yes | Replace user's followed registry stacks (max 30 total incl. custom) |
| `addCustomTech(name, githubRepoUrl)` | yes | Add/follow custom repo (max 5 custom); triggers immediate ingestion |
| `subscribeToDigest({ email, stackSlug, source, website })` | no | Store digest signup |
| `markReleasesRead(releaseIds)` | yes | Mark releases read |
| `markReleaseUnread(releaseId)` | yes | Mark release unread |
| `signOutAction()` | yes | Sign out → redirect `/` |
| `deleteAccountAction()` | yes | Delete user account |

Validation uses Zod-style regex constants in-file (UUID, email, stack slug, GitHub URL parsing).

Revalidation: `revalidatePath('/onboarding')`, `revalidatePath('/dashboard')` after preference changes.
