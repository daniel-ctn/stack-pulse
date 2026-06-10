# Server actions

**Status:** current

All in `src/lib/actions.ts` (`'use server'`).

| Action | Auth | Purpose |
|--------|------|---------|
| `saveTechPreferences(techIds)` | yes | Replace user's followed registry stacks (max 30 total incl. custom) |
| `addCustomTech(name, githubRepoUrl)` | yes | Add/follow custom repo (max 5 custom); repo must exist and have ≥1 publishable GitHub release; triggers immediate ingestion |
| `subscribeToDigest({ email, stackSlug, source, website })` | no | Store digest signup |
| `unsubscribeFromDigest(formData)` | token | Delete digest subscriber by unsubscribe token → redirect with status |
| `scanPackageJson(packageJsonText)` | yes | Resolve pasted package.json deps via npm registry → registry matches + custom repo candidates (`src/lib/stack-import.ts`; 6 scans/h per user, 120 deps max) |
| `markReleasesRead(releaseIds)` | yes | Mark releases read |
| `markReleaseUnread(releaseId)` | yes | Mark release unread |
| `signOutAction()` | yes | Sign out → redirect `/` |
| `deleteAccountAction()` | yes | Delete user account |

Validation uses Zod-style regex constants in-file (UUID, email, stack slug, GitHub URL parsing).

Revalidation: `revalidatePath('/onboarding')`, `revalidatePath('/dashboard')` after preference changes.
