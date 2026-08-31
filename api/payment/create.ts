// api/payment/create.ts
// Vercel Serverless Function — creates an iKhokha payment link for a pending
// hg_bookings record and returns the redirect URL to the React frontend.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IKHOKHA_APP_ID     ?? ''
const IK_APP_SECRET = process.env.IKHOKHA_APP_SECRET ?? ''
const IK_API_URL    = 'https://api.ikhokha.com/public-api/v1/api/payment'
const BASE_URL      = process.env.VITE_BASE_URL ?? ''   // e.g. https://blytravel.co.za

// iKhokha escaping: \  →  \\   |   "  →  \"   |   '  →  \'   |   space  →  \ (backslash+space)
function ikEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g,  '\\"')
    .replace(/'/g,  "\\'")
    .replace(/ /g,  '\\ ')
}

function signRequest(urlPath: string, body: string): string {
  const payload = ikEscape(urlPath + body)
  return crypto
    .createHmac('sha256', IK_APP_SECRET)
    .update(payload, 'utf8')
    .digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { bookingId } = req.body ?? {}
  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' })
  }

  if (!IK_APP_ID || !IK_APP_SECRET) {
    console.error('[iKhokha] Missing IKHOKHA_APP_ID or IKHOKHA_APP_SECRET env vars')
    return res.status(500).json({ error: 'Payment provider not configured' })
  }

  if (!BASE_URL) {
    console.error('[iKhokha] Missing BASE_URL env var')
    return res.status(500).json({ error: 'BASE_URL not configured' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // server-side only — never expose this
  )

  // Read the pending booking from hg_bookings
  const { data: booking, error } = await supabase
    .from('hg_bookings')
    .select('id, total_price_zar, lead_guest, guest_email, payment_status, status')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }
  if (booking.payment_status === 'paid') {
    return res.status(400).json({ error: 'Already paid' })
  }
  if (booking.status === 'Cancelled') {
    return res.status(400).json({ error: 'Booking is cancelled' })
  }

  // iKhokha amount must be in cents (integer)
  const amountCents  = Math.round(Number(booking.total_price_zar) * 100)
  const externalTxId = `BLY-${bookingId}`
  const firstName    = booking.lead_guest?.firstName ?? ''
  const lastName     = booking.lead_guest?.lastName  ?? ''
  const guestName    = `${firstName} ${lastName}`.trim()

  const requestBody = {
    entityID:              IK_APP_ID,
    amount:                amountCents,
    currency:              'ZAR',
    requesterUrl:          BASE_URL,
    externalTransactionID: externalTxId,
    description:           `BLY Travel - ${guestName}`,
    urls: {
      callbackUrl:    `${BASE_URL}/api/payment/webhook`,
      successPageUrl: `${BASE_URL}/booking/success?id=${bookingId}`,
      failurePageUrl: `${BASE_URL}/booking/payment-failed?id=${bookingId}`,
      cancelUrl:      `${BASE_URL}/checkout`,
    },
  }

  const bodyStr   = JSON.stringify(requestBody)
  const urlPath   = new URL(IK_API_URL).pathname   // /public-api/v1/api/payment
  const signature = signRequest(urlPath, bodyStr)

  console.log('[iKhokha] Sending payment request:', {
    appIdHead: IK_APP_ID.slice(0, 8),
    urlPath,
    amountCents,
    externalTxId,
    signatureHead: signature.slice(0, 12),
  })

  let ikRes: Response
  let ikData: any

  try {
    ikRes = await fetch(IK_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'IK-APPID':     IK_APP_ID,
        'IK-SIGN':      signature,
      },
      body: bodyStr,
    })
    ikData = await ikRes.json()
  } catch (fetchErr) {
    console.error('[iKhokha] Network error calling iKhokha API:', fetchErr)
    return res.status(502).json({ error: 'Could not reach payment provider' })
  }

  console.log('[iKhokha] Response status:', ikRes.status, '| body:', JSON.stringify(ikData))

  if (!ikData.paylinkUrl) {
    console.error('[iKhokha] Payment link creation failed:', ikData)
    return res.status(502).json({ error: 'Could not create payment link', detail: ikData })
  }

  // Save paylink details to hg_bookings for audit + reconciliation
  await supabase
    .from('hg_bookings')
    .update({
      ik_paylink_id:     ikData.paylinkID,
      ik_paylink_url:    ikData.paylinkUrl,
      ik_external_tx_id: externalTxId,
    })
    .eq('id', bookingId)

  return res.status(200).json({ paylinkUrl: ikData.paylinkUrl })
}
