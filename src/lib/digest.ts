import { and, desc, eq, gte, isNull, ne, or } from 'drizzle-orm'
import { Resend } from 'resend'

import { getDb } from '@/db'
import { digestSubscribers, releaseUpdates, technologies } from '@/db/schema'

const DIGEST_WINDOW_DAYS = 7
// Skip subscribers already mailed recently so a manual rerun never double-sends.
const RESEND_GUARD_DAYS = 5
const MAX_GENERAL_RELEASES = 12
const MAX_STACK_RELEASES = 10
const SEND_DELAY_MS = 600

let resend: Resend | null = null

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is required')
    resend = new Resend(apiKey)
  }
  return resend
}

export function getDigestConfig() {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.DIGEST_FROM_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!apiKey || !from || !appUrl) {
    return {
      configured: false as const,
      missing: [
        !apiKey ? 'RESEND_API_KEY' : null,
        !from ? 'DIGEST_FROM_EMAIL' : null,
        !appUrl ? 'NEXT_PUBLIC_APP_URL' : null,
      ].filter((name): name is string => name !== null),
    }
  }

  return { configured: true as const, from, appUrl }
}

type DigestRelease = {
  techName: string
  techSlug: string
  version: string
  title: string | null
  summary: string | null
  breakingChanges: string[] | null
  securityNotes: string[] | null
  importanceLevel: 'low' | 'medium' | 'high' | 'critical' | null
  isPrerelease: boolean
  rawReleaseUrl: string | null
  publishedAt: Date | null
}

const importanceRank: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 }

async function getDigestWindowReleases(): Promise<DigestRelease[]> {
  const since = new Date(Date.now() - DIGEST_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  return getDb()
    .select({
      techName: technologies.name,
      techSlug: technologies.slug,
      version: releaseUpdates.version,
      title: releaseUpdates.title,
      summary: releaseUpdates.summary,
      breakingChanges: releaseUpdates.breakingChanges,
      securityNotes: releaseUpdates.securityNotes,
      importanceLevel: releaseUpdates.importanceLevel,
      isPrerelease: releaseUpdates.isPrerelease,
      rawReleaseUrl: releaseUpdates.rawReleaseUrl,
      publishedAt: releaseUpdates.publishedAt,
    })
    .from(releaseUpdates)
    .innerJoin(technologies, eq(releaseUpdates.techId, technologies.id))
    .where(
      and(
        gte(releaseUpdates.publishedAt, since),
        or(isNull(technologies.category), ne(technologies.category, 'custom')),
      ),
    )
    .orderBy(desc(releaseUpdates.publishedAt))
}

function sortByImportance(releases: DigestRelease[]): DigestRelease[] {
  return [...releases].sort((a, b) => {
    const rank =
      (importanceRank[b.importanceLevel ?? 'medium'] ?? 1) -
      (importanceRank[a.importanceLevel ?? 'medium'] ?? 1)
    if (rank !== 0) return rank
    return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const importanceColor: Record<string, string> = {
  critical: '#fb7185',
  high: '#fbbf24',
  medium: '#67e8f9',
  low: '#5a5a62',
}

function renderReleaseBlock(release: DigestRelease, appUrl: string): string {
  const importance = release.importanceLevel ?? 'medium'
  const color = importanceColor[importance] ?? '#67e8f9'
  const summary = release.summary ? escapeHtml(release.summary.slice(0, 320)) : null
  const breakingCount = release.breakingChanges?.length ?? 0
  const securityCount = release.securityNotes?.length ?? 0
  const sourceUrl = release.rawReleaseUrl || `${appUrl}/stacks/${release.techSlug}`

  const warnings: string[] = []
  if (breakingCount > 0) {
    warnings.push(
      `<span style="color:#fb7185;">${breakingCount} breaking change${breakingCount === 1 ? '' : 's'}</span>`,
    )
  }
  if (securityCount > 0) {
    warnings.push(
      `<span style="color:#fb7185;">${securityCount} security note${securityCount === 1 ? '' : 's'}</span>`,
    )
  }
  if (release.isPrerelease) {
    warnings.push('<span style="color:#5a5a62;">prerelease</span>')
  }

  return `
    <tr><td style="padding:0 0 12px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0d0d10" style="background-color:#0d0d10;border:1px solid #1c1c22;border-radius:8px;">
        <tr><td style="padding:16px 18px;">
          <div style="font-family:Consolas,Menlo,monospace;font-size:13px;">
            <a href="${escapeHtml(sourceUrl)}" style="color:#a3e635;text-decoration:none;font-weight:bold;">${escapeHtml(release.techName)}@${escapeHtml(release.version)}</a>
            <span style="color:${color};font-size:11px;text-transform:uppercase;letter-spacing:1px;">&nbsp;&nbsp;${importance}</span>
          </div>
          ${summary ? `<div style="font-family:Consolas,Menlo,monospace;font-size:12px;line-height:1.6;color:#9b9ba1;padding-top:8px;">${summary}</div>` : ''}
          ${warnings.length > 0 ? `<div style="font-family:Consolas,Menlo,monospace;font-size:11px;padding-top:8px;">${warnings.join('&nbsp;&nbsp;·&nbsp;&nbsp;')}</div>` : ''}
          <div style="font-family:Consolas,Menlo,monospace;font-size:11px;padding-top:10px;">
            <a href="${escapeHtml(sourceUrl)}" style="color:#5a5a62;text-decoration:underline;">view release notes &rarr;</a>
          </div>
        </td></tr>
      </table>
    </td></tr>`
}

export function renderDigestEmail({
  heading,
  intro,
  releases,
  appUrl,
  unsubscribeUrl,
}: {
  heading: string
  intro: string
  releases: DigestRelease[]
  appUrl: string
  unsubscribeUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#08080a;" bgcolor="#08080a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#08080a" style="background-color:#08080a;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding-bottom:20px;">
          <a href="${escapeHtml(appUrl)}" style="font-family:Consolas,Menlo,monospace;font-size:16px;font-weight:bold;color:#e8e8ec;text-decoration:none;">stackpulse<span style="color:#a3e635;">.</span></a>
        </td></tr>
        <tr><td style="padding-bottom:6px;">
          <div style="font-family:Consolas,Menlo,monospace;font-size:11px;color:#5a5a62;text-transform:uppercase;letter-spacing:2px;"><span style="color:#a3e635;">&sect;</span>&nbsp;weekly_digest</div>
        </td></tr>
        <tr><td style="padding-bottom:18px;">
          <div style="font-family:Consolas,Menlo,monospace;font-size:20px;font-weight:bold;color:#e8e8ec;">${escapeHtml(heading)}<span style="color:#a3e635;">.</span></div>
          <div style="font-family:Consolas,Menlo,monospace;font-size:12px;line-height:1.6;color:#9b9ba1;padding-top:6px;">${escapeHtml(intro)}</div>
        </td></tr>
        ${releases.map((release) => renderReleaseBlock(release, appUrl)).join('')}
        <tr><td style="padding-top:10px;">
          <div style="font-family:Consolas,Menlo,monospace;font-size:11px;line-height:1.7;color:#5a5a62;border-top:1px solid #1c1c22;padding-top:14px;">
            // you subscribed to the stackpulse weekly digest.<br />
            <a href="${escapeHtml(appUrl)}" style="color:#5a5a62;text-decoration:underline;">open stackpulse</a>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            <a href="${escapeHtml(unsubscribeUrl)}" style="color:#5a5a62;text-decoration:underline;">unsubscribe</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export type DigestSendResult = {
  configured: boolean
  subscribers: number
  sent: number
  skipped: number
  errors: number
  missing?: string[]
}

export async function sendWeeklyDigest({
  timeBudgetMs = 270_000,
}: { timeBudgetMs?: number } = {}): Promise<DigestSendResult> {
  const config = getDigestConfig()
  if (!config.configured) {
    return {
      configured: false,
      subscribers: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      missing: config.missing,
    }
  }

  const db = getDb()
  const subscribers = await db
    .select({
      id: digestSubscribers.id,
      email: digestSubscribers.email,
      stackSlug: digestSubscribers.stackSlug,
      unsubscribeToken: digestSubscribers.unsubscribeToken,
      lastSentAt: digestSubscribers.lastSentAt,
    })
    .from(digestSubscribers)

  const result: DigestSendResult = {
    configured: true,
    subscribers: subscribers.length,
    sent: 0,
    skipped: 0,
    errors: 0,
  }
  if (subscribers.length === 0) return result

  const windowReleases = await getDigestWindowReleases()
  const generalReleases = sortByImportance(windowReleases).slice(0, MAX_GENERAL_RELEASES)
  const releasesByStack = new Map<string, DigestRelease[]>()
  for (const release of windowReleases) {
    const list = releasesByStack.get(release.techSlug) ?? []
    if (list.length < MAX_STACK_RELEASES) list.push(release)
    releasesByStack.set(release.techSlug, list)
  }

  const resendGuard = Date.now() - RESEND_GUARD_DAYS * 24 * 60 * 60 * 1000
  const startedAt = Date.now()

  for (let index = 0; index < subscribers.length; index++) {
    const subscriber = subscribers[index]

    if (Date.now() - startedAt > timeBudgetMs) {
      const deferred = subscribers.length - index
      console.warn(`digest time budget reached; ${deferred} subscriber(s) deferred to next run`)
      result.skipped += deferred
      break
    }

    if (subscriber.lastSentAt && subscriber.lastSentAt.getTime() > resendGuard) {
      result.skipped += 1
      continue
    }

    const releases = subscriber.stackSlug
      ? (releasesByStack.get(subscriber.stackSlug) ?? [])
      : generalReleases

    if (releases.length === 0) {
      result.skipped += 1
      continue
    }

    const breakingCount = releases.filter((r) => (r.breakingChanges?.length ?? 0) > 0).length
    const stackName = subscriber.stackSlug ? releases[0].techName : null
    const subject = stackName
      ? `${stackName} — ${releases.length} release${releases.length === 1 ? '' : 's'} this week`
      : `stackpulse weekly — ${releases.length} releases${breakingCount > 0 ? `, ${breakingCount} with breaking changes` : ''}`
    const heading = stackName ? `${stackName.toLowerCase()} this week` : 'your weekly digest'
    const intro = stackName
      ? `${releases.length} release${releases.length === 1 ? '' : 's'} for ${stackName} in the last ${DIGEST_WINDOW_DAYS} days.`
      : `the ${releases.length} most important releases across tracked stacks in the last ${DIGEST_WINDOW_DAYS} days.`
    const unsubscribeUrl = `${config.appUrl}/digest/unsubscribe?token=${subscriber.unsubscribeToken}`

    try {
      const { error } = await getResend().emails.send({
        from: config.from,
        to: subscriber.email,
        subject,
        html: renderDigestEmail({
          heading,
          intro,
          releases,
          appUrl: config.appUrl,
          unsubscribeUrl,
        }),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      if (error) {
        result.errors += 1
        console.error(`digest send failed for ${subscriber.id}:`, error)
      } else {
        result.sent += 1
        await db
          .update(digestSubscribers)
          .set({ lastSentAt: new Date(), updatedAt: new Date() })
          .where(eq(digestSubscribers.id, subscriber.id))
      }
    } catch (err) {
      result.errors += 1
      console.error(`digest send failed for ${subscriber.id}:`, err)
    }

    await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS))
  }

  return result
}
