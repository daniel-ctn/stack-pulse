import OpenAI from 'openai'
import { z } from 'zod'

let openai: OpenAI | null = null

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required')
    }

    openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'StackPulse',
      },
      timeout: 25_000,
      maxRetries: 1,
    })
  }

  return openai
}

const releaseSummarySchema = z.object({
  version: z.string(),
  title: z.string(),
  summary: z.string(),
  new_features: z.array(z.string()).default([]),
  breaking_changes: z.array(z.string()).default([]),
  security_notes: z.array(z.string()).default([]),
  deprecations: z.array(z.string()).default([]),
  migration_steps: z.array(z.string()).default([]),
  impact_summary: z.string().nullable().optional(),
  recommended_action: z.string().nullable().optional(),
  release_signals: z
    .array(z.enum(['breaking', 'deprecation', 'migration', 'feature', 'security']))
    .default([]),
  code_snippet: z.string().nullable().optional(),
  importance_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

export type ReleaseSummary = z.infer<typeof releaseSummarySchema>

const releaseSignalValues = ['breaking', 'deprecation', 'migration', 'feature', 'security'] as const
type ReleaseSignal = (typeof releaseSignalValues)[number]

export type SummarizeReleaseInput = {
  repoName: string
  version: string
  title: string | null
  body: string | null
  url: string
  prerelease: boolean
}

const SYSTEM_PROMPT = `You are a technical release analyst. Given the markdown of a GitHub release, extract key information and return a JSON object.

Rules:
- Extract the exact version number from the release title or tag
- Write a concise 2-3 sentence summary of the most important changes
- List new features as bullet points (max 5)
- List breaking changes (if any) with clear explanations (max 5)
- List security fixes, CVEs, advisories, exploit mitigations, or vulnerability patches (max 5)
- List deprecations, removals, renamed APIs, or end-of-life notices (max 5)
- List source-backed migration or upgrade steps only when the release notes describe them (max 5)
- Write a one-sentence impact summary explaining who is affected, or null if unclear
- Write a one-sentence recommended action, or null if the source does not support a concrete action
- Classify release signals using only: "breaking", "deprecation", "migration", "feature", "security"
- Extract ONE most relevant code snippet from the release (if any code examples exist)
- Rate importance: "critical" (major security fix or breaking), "high" (significant new features), "medium" (notable improvements), "low" (minor fixes/chores)
- If release notes are empty or too vague, be conservative: explain that the source release notes are limited and do not invent features
- Do not invent migration advice. If there is not enough source detail, return null or an empty list

Return ONLY valid JSON in this exact format:
{
  "version": "string",
  "title": "string",
  "summary": "string",
  "new_features": ["string"],
  "breaking_changes": ["string"],
  "security_notes": ["string"],
  "deprecations": ["string"],
  "migration_steps": ["string"],
  "impact_summary": "string or null",
  "recommended_action": "string or null",
  "release_signals": ["breaking" | "deprecation" | "migration" | "feature" | "security"],
  "code_snippet": "string or null",
  "importance_level": "low" | "medium" | "high" | "critical"
}`

export async function summarizeRelease(input: SummarizeReleaseInput): Promise<ReleaseSummary> {
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat'
  const body = input.body?.trim()

  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          `Repository: ${input.repoName}`,
          `Version/tag: ${input.version}`,
          `Release title: ${input.title || input.version}`,
          `Prerelease: ${input.prerelease ? 'yes' : 'no'}`,
          `Source URL: ${input.url}`,
          '',
          'Release markdown:',
          body ? body.slice(0, 8000) : '(No release notes were provided.)',
        ].join('\n'),
      },
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from AI')

  const parsed = releaseSummarySchema.safeParse(JSON.parse(content))
  if (!parsed.success) {
    throw new Error(`AI response failed validation: ${parsed.error.message}`)
  }
  return normalizeReleaseSummary(parsed.data)
}

function normalizeReleaseSummary(summary: ReleaseSummary): ReleaseSummary {
  const signals = new Set<ReleaseSignal>(summary.release_signals)

  if (summary.breaking_changes.length > 0) signals.add('breaking')
  if (summary.security_notes.length > 0) signals.add('security')
  if (summary.deprecations.length > 0) signals.add('deprecation')
  if (summary.migration_steps.length > 0) signals.add('migration')
  if (summary.new_features.length > 0) signals.add('feature')
  if (summary.importance_level === 'critical' && /security|cve|vulnerab/i.test(summary.summary)) {
    signals.add('security')
  }

  return {
    ...summary,
    impact_summary: normalizeNullableText(summary.impact_summary),
    recommended_action: normalizeNullableText(summary.recommended_action),
    release_signals: releaseSignalValues.filter((signal) => signals.has(signal)),
  }
}

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
