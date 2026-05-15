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
  code_snippet: z.string().nullable().optional(),
  importance_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

export type ReleaseSummary = z.infer<typeof releaseSummarySchema>

const SYSTEM_PROMPT = `You are a technical release analyst. Given the markdown of a GitHub release, extract key information and return a JSON object.

Rules:
- Extract the exact version number from the release title or tag
- Write a concise 2-3 sentence summary of the most important changes
- List new features as bullet points (max 5)
- List breaking changes (if any) with clear explanations (max 5)
- Extract ONE most relevant code snippet from the release (if any code examples exist)
- Rate importance: "critical" (major security fix or breaking), "high" (significant new features), "medium" (notable improvements), "low" (minor fixes/chores)

Return ONLY valid JSON in this exact format:
{
  "version": "string",
  "title": "string",
  "summary": "string",
  "new_features": ["string"],
  "breaking_changes": ["string"],
  "code_snippet": "string or null",
  "importance_level": "low" | "medium" | "high" | "critical"
}`

export async function summarizeRelease(
  releaseBody: string,
  repoName: string,
): Promise<ReleaseSummary> {
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat'

  const response = await getOpenAI().chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this GitHub release for ${repoName}:\n\n${releaseBody.slice(0, 8000)}`,
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
  return parsed.data
}
