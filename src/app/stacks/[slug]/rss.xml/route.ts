import { getPublicStackPage, type PublicStackRelease } from '@/lib/public-stacks'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

function renderItemDescription(release: PublicStackRelease): string {
  const parts: string[] = []

  if (release.summary) parts.push(`<p>${escapeXml(release.summary)}</p>`)

  const sections: Array<[string, string[] | null]> = [
    ['Breaking changes', release.breakingChanges],
    ['Security notes', release.securityNotes],
    ['Deprecations', release.deprecations],
    ['New features', release.newFeatures],
    ['Migration steps', release.migrationSteps],
  ]

  for (const [label, items] of sections) {
    if (items?.length) {
      parts.push(
        `<p><strong>${label}:</strong></p><ul>${items
          .map((item) => `<li>${escapeXml(item)}</li>`)
          .join('')}</ul>`,
      )
    }
  }

  if (release.recommendedAction) {
    parts.push(`<p><strong>Recommended action:</strong> ${escapeXml(release.recommendedAction)}</p>`)
  }

  return parts.join('')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const data = await getPublicStackPage(slug)

  if (!data) {
    return new Response('Not found', { status: 404 })
  }

  const stackUrl = `${appUrl}/stacks/${data.tech.slug}`
  const feedUrl = `${stackUrl}/rss.xml`
  const lastBuildDate = (data.releases[0]?.publishedAt ?? new Date()).toUTCString()

  const items = data.releases
    .map((release) => {
      const title = `${data.tech.name} ${release.version}${
        release.importanceLevel === 'critical' || release.importanceLevel === 'high'
          ? ` [${release.importanceLevel}]`
          : ''
      }`
      const link = release.rawReleaseUrl || stackUrl
      const pubDate = release.publishedAt ? release.publishedAt.toUTCString() : undefined

      return [
        '    <item>',
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="false">${release.id}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
        `      <description>${cdata(renderItemDescription(release))}</description>`,
        '    </item>',
      ]
        .filter((line): line is string => line !== null)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${data.tech.name} releases — StackPulse`)}</title>
    <link>${escapeXml(stackUrl)}</link>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(
      `AI-distilled release notes for ${data.tech.name}: breaking changes, deprecations, security notes, and migration steps.`,
    )}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
