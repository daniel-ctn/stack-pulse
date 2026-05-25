import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getDb } from '@/db'
import { releaseUpdates, technologies, userTechPreferences } from '@/db/schema'
import { adviseOnRelease } from '@/lib/ai'
import { getAuth } from '@/lib/auth'

const requestSchema = z.object({
  releaseId: z.uuid(),
  question: z.string().trim().min(4).max(1000),
  currentVersion: z.string().trim().max(80).optional(),
  projectContext: z.string().trim().max(2000).optional(),
})

export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'sign in to ask ai about releases' }, { status: 401 })
  }

  let payload: z.infer<typeof requestSchema>
  try {
    payload = requestSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'invalid question' }, { status: 400 })
  }

  try {
    const [release] = await getDb()
      .select({
        techName: technologies.name,
        version: releaseUpdates.version,
        title: releaseUpdates.title,
        summary: releaseUpdates.summary,
        newFeatures: releaseUpdates.newFeatures,
        breakingChanges: releaseUpdates.breakingChanges,
        securityNotes: releaseUpdates.securityNotes,
        deprecations: releaseUpdates.deprecations,
        migrationSteps: releaseUpdates.migrationSteps,
        impactSummary: releaseUpdates.impactSummary,
        recommendedAction: releaseUpdates.recommendedAction,
        releaseSignals: releaseUpdates.releaseSignals,
        rawReleaseBody: releaseUpdates.rawReleaseBody,
        rawReleaseUrl: releaseUpdates.rawReleaseUrl,
      })
      .from(releaseUpdates)
      .innerJoin(technologies, eq(releaseUpdates.techId, technologies.id))
      .innerJoin(
        userTechPreferences,
        and(
          eq(userTechPreferences.techId, releaseUpdates.techId),
          eq(userTechPreferences.userId, session.user.id),
        ),
      )
      .where(eq(releaseUpdates.id, payload.releaseId))
      .limit(1)

    if (!release) {
      return NextResponse.json({ error: 'release was not found' }, { status: 404 })
    }

    const advice = await adviseOnRelease({
      ...release,
      question: payload.question,
      currentVersion: payload.currentVersion || null,
      projectContext: payload.projectContext || null,
    })

    return NextResponse.json({ advice })
  } catch (err) {
    console.error('release advice failed:', err)
    return NextResponse.json({ error: 'could not generate advice' }, { status: 500 })
  }
}
