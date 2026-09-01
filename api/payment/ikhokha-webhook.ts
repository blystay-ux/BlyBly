// api/payment/ikhokha-webhook.ts
//
// iKhokha calls this URL once after a payment succeeds or fails.
//
// Verification follows the official iKhokha JS webhook sample:
//   1. Strip body.text (body-parser sometimes injects it)
//   2. Compute HMAC-SHA256( jsStringEscape(callbackUrlPath + JSON.stringify(body)), AppSecret )
//   3. Compare with the ik-sign header
//
// Required Vercel env vars: IK_APP_ID, IK_APP_SECRET, VITE_BASE_URL

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IK_APP_ID     ?? ''
const IK_APP_SECRET = process.env.IK_APP_SECRET ?? ''

// Must be just the PATH portion of your callbackUrl — no domain
const CALLBACK_PATH = '/api/payment/ikhokha-webhook'

// Mirrors jsStringEscape from the official iKhokha JS sample.
// Backslashes must be escaped first to avoid double-escaping.
function jsStringEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g,  '\\"')
    .replace(/'/g,  "\\'")
    .replace(/ /g, '\\0')
}

function computeSignature(urlPath: string, body: object): string {
  const payload = jsStringEscape(urlPath + JSON.stringify(body))
  return crypto.createHmac('sha256', IK_APP_SECRET.trim()).update(payload).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── 1. Verify App ID ─────────────────────────────────────────────────────────
  const receivedAppId = (req.headers['ik-appid'] ?? '') as string
  if (!receivedAppId || receivedAppId !== IK_APP_ID) {
    console.error('[iKhokha webhook] App ID mismatch:', receivedAppId)
    return res.status(403).json({ error: 'Invalid App ID' })
  }

  // ── 2. Verify signature ───────────────────────────────────────────────────────
  // Per the official sample: delete body.text BEFORE computing the signature
  const body = { ...req.body }
  delete body.text

  const receivedSign = (req.headers['ik-sign'] ?? '') as string
  const expectedSign = computeSignature(CALLBACK_PATH, body)

  if (!receivedSign || receivedSign !== expectedSign) {
    console.error('[iKhokha webhook] Signature mismatch — received:', receivedSign, '| expected:', expectedSign)
    return res.status(403).json({ error: 'Signature mismatch' })
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────────
  const { paylinkID, status, externalTransactionID, responseCode } = body

  console.log('[iKhokha webhook]', { paylinkID, status, externalTransactionID, responseCode })

  // responseCode "00" means the payload is valid
  if (responseCode !== '00') {
    console.warn('[iKhokha webhook] Non-00 responseCode, ignoring:', responseCode)
    return res.status(200).json({ received: true })
  }

  // externalTransactionID was set to "BLY-{bookingId}" when creating the link
  const bookingId = String(externalTransactionID ?? '').replace(/^BLY-/, '')
  if (!bookingId) {
    console.error('[iKhokha webhook] Could not extract bookingId from:', externalTransactionID)
    return res.status(200).json({ received: true })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── 4. Payment SUCCESS ────────────────────────────────────────────────────────
  if (status === 'SUCCESS') {
    await supabase
      .from('hg_bookings')
      .update({
        payment_status: 'paid',
        status:         'Confirmed',
        ik_paylink_id:  paylinkID,
      })
      .eq('id', bookingId)

    // Trigger HyperGuest booking confirm using the stored checkout payload
    const { data: booking } = await supabase
      .from('hg_bookings')
      .select('checkout_payload')
      .eq('id', bookingId)
      .single()

    if (booking?.checkout_payload) {
      try {
        const hgRes = await fetch(
          `${process.env.VITE_SUPABASE_URL}/functions/v1/hyperguest-book`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              ...booking.checkout_payload,
              existingBookingId: bookingId,
            }),
          }
        )
        const hgData = await hgRes.json().catch(() => null)
        console.log('[iKhokha webhook] HyperGuest result:', JSON.stringify(hgData))
      } catch (err) {
        // Log but don't fail — booking is marked paid, we can retry HG separately
        console.error('[iKhokha webhook] HyperGuest call failed:', err)
      }
    }
  }

  // ── 5. Payment FAILURE ────────────────────────────────────────────────────────
  if (status === 'FAILURE') {
    await supabase
      .from('hg_bookings')
      .update({
        payment_status: 'failed',
        ik_paylink_id:  paylinkID,
      })
      .eq('id', bookingId)

    console.log('[iKhokha webhook] Payment failed for booking:', bookingId)
  }

  // Always ACK with 200
  return res.status(200).json({ received: true })
}
