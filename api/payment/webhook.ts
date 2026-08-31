// api/payment/webhook.ts
// Vercel Serverless Function — receives iKhokha payment outcome.
// SUCCESS → marks booking paid → calls hyperguest-book edge function → sends email.
// Always returns HTTP 200 (iKhokha retries on anything else).

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import getRawBody from 'raw-body'

const IK_APP_SECRET = process.env.IKHOKHA_APP_SECRET!
const BASE_URL      = process.env.VITE_BASE_URL!
const CALLBACK_URL  = `${BASE_URL}/api/payment/webhook`

// Must match exactly what iKhokha uses when signing
function ikEscape(str: string): string {
  return str.replace(/[\\"']/g, '\\$&').replace(/ /g, '\\0')
}

function verifySignature(rawBody: string, receivedSig: string): boolean {
  const { pathname } = new URL(CALLBACK_URL)
  const payload      = ikEscape(pathname + rawBody)
  const expected     = crypto.createHmac('sha256', IK_APP_SECRET).update(payload).digest('hex')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(receivedSig, 'hex')
    )
  } catch {
    return false
  }
}

// Vercel parses req.body by default — we need raw bytes for signature verification.
// Disable the default body parser via config below.
export const config = { api: { bodyParser: false } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  // Read raw body — required for correct signature verification
  const rawBuffer = await getRawBody(req)
  const rawBody   = rawBuffer.toString('utf8')
  const ikSign    = (req.headers['ik-sign'] as string) ?? ''

  if (!verifySignature(rawBody, ikSign)) {
    console.error('[iKhokha webhook] Signature mismatch')
    return res.status(200).send('OK')   // still 200 — don't let iKhokha loop
  }

  let payload: {
    status:                string
    externalTransactionID: string
    paylinkID:             string
    responseCode:          string
  }

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return res.status(200).send('OK')
  }

  const { status, externalTransactionID, responseCode } = payload
  console.log(`[iKhokha webhook] ${status} | ref=${externalTransactionID} | rc=${responseCode}`)

  if (responseCode !== '00') {
    console.warn('[iKhokha webhook] Non-00 responseCode:', responseCode)
    return res.status(200).send('OK')
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find the pending booking by the external transaction ID
  const { data: booking, error } = await supabase
    .from('hg_bookings')
    .select('*')
    .eq('ik_external_tx_id', externalTransactionID)
    .single()

  if (error || !booking) {
    console.error('[iKhokha webhook] No booking found for ref:', externalTransactionID)
    return res.status(200).send('OK')
  }

  // Guard against duplicate webhook deliveries
  if (booking.payment_status === 'paid') {
    console.log('[iKhokha webhook] Duplicate — already processed:', booking.id)
    return res.status(200).send('OK')
  }

  if (status === 'SUCCESS') {
    // ── 1. Mark payment received ───────────────────────────────────────────
    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', booking.id)

    // ── 2. Confirm booking with HyperGuest ────────────────────────────────
    // Passes checkout_payload (saved during Checkout.jsx) straight to your
    // existing hyperguest-book edge function. Nothing in that function changes.
    try {
      const { data: hgData, error: hgErr } = await supabase.functions.invoke(
        'hyperguest-book',
        { body: booking.checkout_payload }
      )

      if (hgErr) throw hgErr
      if (hgData?.error) throw new Error(hgData.error)

      await supabase
        .from('hg_bookings')
        .update({
          hyperguest_booking_id: hgData.content?.bookingId ?? null,
          status:                hgData.content?.status ?? 'Confirmed',
          raw_response:          hgData,
        })
        .eq('id', booking.id)

      console.log('[HyperGuest] Booking confirmed:', hgData.content?.bookingId)

      // ── 3. Send confirmation email ─────────────────────────────────────
      const p  = booking.checkout_payload
      const lg = p?.leadGuest ?? {}

      supabase.functions.invoke('hyperguest-send-confirmation-email', {
        body: {
          to:                  booking.guest_email,
          guestName:           `${lg.firstName} ${lg.lastName}`.trim(),
          agencyReference:     p?.agencyReference,
          hyperguestBookingId: hgData.content?.bookingId,
          hotelName:           booking.meta?.hotelName ?? '',
          checkIn:             booking.check_in,
          checkOut:            booking.check_out,
          roomName:            p?.rooms?.[0]?.roomName ?? '',
          ratePlanName:        p?.rooms?.[0]?.ratePlanName ?? '',
          totalPrice:          booking.total_price_zar,
          currency:            'ZAR',
        },
      }).catch(err => console.error('[Email] Send failed (booking still confirmed):', err))

    } catch (err) {
      // Payment is recorded. HyperGuest failed — flag for ops follow-up.
      console.error('[HyperGuest] Confirm failed for booking', booking.id, err)
      await supabase
        .from('hg_bookings')
        .update({ status: 'Failed', raw_response: { error: String(err) } })
        .eq('id', booking.id)
      // TODO: alert ops (e.g. email to ops@blytravel.co.za or Slack)
    }

  } else {
    // Payment failed — leave booking as Pending so guest can retry
    console.warn('[iKhokha webhook] Payment FAILED for booking:', booking.id)
  }

  return res.status(200).send('OK')
}
