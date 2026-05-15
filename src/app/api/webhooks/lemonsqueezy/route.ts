import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const hmac = crypto.createHmac('sha256', secret)
  const digest = Buffer.from(hmac.update(payload).digest('hex'), 'utf8')
  const received = Buffer.from(signature, 'utf8')

  if (digest.length !== received.length) return false
  return crypto.timingSafeEqual(digest, received)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') || ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: unknown
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (
    !event ||
    typeof event !== 'object' ||
    !('meta' in event) ||
    !('data' in event) ||
    typeof event.meta !== 'object' ||
    typeof event.data !== 'object' ||
    !event.meta ||
    !event.data ||
    !('event_name' in event.meta) ||
    !('attributes' in event.data) ||
    !('id' in event.data) ||
    typeof event.data.attributes !== 'object' ||
    !event.data.attributes
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const eventName = event.meta.event_name
  const db = getDb()

  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    if (!('customer_id' in event.data.attributes) || !('status' in event.data.attributes)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

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
