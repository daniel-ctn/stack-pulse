import { NextRequest, NextResponse } from 'next/server'

import { requireCronAuth } from '@/lib/cron-auth'
import { sendWeeklyDigest } from '@/lib/digest'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const denied = requireCronAuth(request)
  if (denied) return denied

  const result = await sendWeeklyDigest()

  if (!result.configured) {
    console.warn('digest cron skipped: missing env', result.missing)
    return NextResponse.json({ success: false, ...result })
  }

  return NextResponse.json({ success: true, ...result })
}
