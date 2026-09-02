// api/payment/ikhokha-webhook.js
// Vercel Serverless Function — receives iKhokha payment status callbacks.
// Uses SUPABASE_SERVICE_ROLE_KEY (no VITE_ prefix — stays server-side only).

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IK_APP_ID     || ''
const IK_APP_SECRET = process.env.IK_APP_SECRET || ''
const CALLBACK_PATH = '/api/payment/ikhokha-webhook'

// iKhokha requires jsStringEscape before HMAC — same rule for inbound webhooks.
function jsStringEscape(str) {
  return JSON.stringify(str).slice(1, -1)
}

function computeSignature(urlPath, body) {
  const payload = jsStringEscape(urlPath + JSON.stringify(body))
  return crypto.createHmac('sha256', IK_APP_SECRET.trim()).update(payload).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── App ID check ──────────────────────────────────────────────────────────
  const receivedAppId = req.headers['ik-appid'] || ''
  if (!receivedAppId || receivedAppId !== IK_APP_ID) {
    console.error('[iKhokha webhook] App ID mismatch:', receivedAppId)
    return res.status(403).json({ error: 'Invalid App ID' })
  }

  // ── Signature check ───────────────────────────────────────────────────────
  // Strip the `text` field iKhokha adds before verifying (same as when signing)
  const body = { ...req.body }
  delete body.text

  const receivedSign = req.headers['ik-sign'] || ''
  const expectedSign = computeSignature(CALLBACK_PATH, body)
  if (!receivedSign || receivedSign !== expectedSign) {
    console.error('[iKhokha webhook] Signature mismatch — received:', receivedSign, '| expected:', expectedSign)
    return res.status(403).json({ error: 'Signature mismatch' })
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  const { paylinkID, status, externalTransactionID, responseCode } = body
  console.log('[iKhokha webhook]', { paylinkID, status, externalTransactionID, responseCode })

  // Non-00 response codes are informational — acknowledge and stop.
  if (responseCode !== '00') {
    return res.status(200).json({ received: true })
  }

  // externalTransactionID = merchantTransactionId we sent = agency_reference (e.g. "BLY-1693000000000")
  // Look up by agency_reference, not by id — the raw value is the reference, not the UUID.
  const agencyRef = String(externalTransactionID || '').trim()
  if (!agencyRef) {
    console.error('[iKhokha webhook] No externalTransactionID in payload')
    return res.status(200).json({ received: true })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY   // ← no VITE_ prefix — server-side only
  )

  // ── Look up the booking by agency_reference ───────────────────────────────
  const { data: booking, error: lookupErr } = await supabase
    .from('hg_bookings')
    .select('id, checkout_payload')
    .eq('agency_reference', agencyRef)
    .maybeSingle()

  if (lookupErr || !booking) {
    console.error('[iKhokha webhook] Booking not found for agency_reference:', agencyRef, lookupErr)
    return res.status(200).json({ received: true })
  }

  // ── Payment SUCCESS ───────────────────────────────────────────────────────
  if (status === 'SUCCESS') {
    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'paid', status: 'Confirmed', ik_paylink_id: paylinkID })
      .eq('id', booking.id)

    if (booking.checkout_payload) {
      try {
        const hgRes = await fetch(
          `${process.env.VITE_SUPABASE_URL}/functions/v1/hyperguest-book`,
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ ...booking.checkout_payload, existingBookingId: booking.id }),
          }
        )
        const hgData = await hgRes.json().catch(() => null)
        console.log('[iKhokha webhook] HyperGuest result:', JSON.stringify(hgData))
      } catch (err) {
        console.error('[iKhokha webhook] HyperGuest call failed:', err)
      }
    }
  }

  // ── Payment FAILURE ───────────────────────────────────────────────────────
  if (status === 'FAILURE') {
    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'failed', ik_paylink_id: paylinkID })
      .eq('id', booking.id)
  }

  return res.status(200).json({ received: true })
}
