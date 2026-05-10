import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') || ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventName = event.meta.event_name

  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    const customerId = String(event.data.attributes.customer_id)
    const subscriptionId = String(event.data.id)
    const status = event.data.attributes.status

    await db
      .update(users)
      .set({
        subscriptionStatus: status === 'active' ? 'pro' : 'free',
        lemonSqueezyCustomerId: customerId,
        lemonSqueezySubscriptionId: subscriptionId,
      })
      .where(eq(users.lemonSqueezyCustomerId, customerId))
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    const subscriptionId = String(event.data.id)

    await db
      .update(users)
      .set({ subscriptionStatus: 'free' })
      .where(eq(users.lemonSqueezySubscriptionId, subscriptionId))
  }

  return NextResponse.json({ received: true })
}
