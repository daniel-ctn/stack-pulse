import OpenAI from 'openai'

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'StackPulse',
  },
})

interface ReleaseSummary {
  version: string
  title: string
  summary: string
  new_features: string[]
  breaking_changes: string[]
  code_snippet: string | null
  importance_level: 'low' | 'medium' | 'high' | 'critical'
}

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

  const response = await openai.chat.completions.create({
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

  return JSON.parse(content) as ReleaseSummary
}
