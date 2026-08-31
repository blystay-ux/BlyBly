// api/payment/create.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IKHOKHA_APP_ID     ?? ''
const IK_APP_SECRET = process.env.IKHOKHA_APP_SECRET  ?? ''
const IK_API_URL    = 'https://api.ikhokha.com/public-api/v1/api/payment'
const BASE_URL      = process.env.VITE_BASE_URL        ?? ''

// Official iKhokha escape: backslash, double-quote, single-quote, null char
function ikEscape(str: string): string {
  return str.replace(/[\\"']/g, '\\$&').replace(/\0/g, '\\0')
}

// IK-SIGN = HMAC-SHA256( ikEscape( urlPath + requestBody ), AppSecret )
function signRequest(bodyStr: string): string {
  const urlPath = new URL(IK_API_URL).pathname  // /public-api/v1/api/payment
  const payload = ikEscape(urlPath + bodyStr)
  return crypto.createHmac('sha256', IK_APP_SECRET.trim())
    .update(payload, 'utf8')
    .digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { bookingId } = req.body ?? {}
  if (!bookingId) return res.status(400).json({ error: 'bookingId is required' })

  if (!IK_APP_ID || !IK_APP_SECRET) {
    return res.status(500).json({ error: 'Payment provider not configured' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: booking, error } = await supabase
    .from('hg_bookings')
    .select('id, total_price_zar, lead_guest, payment_status')
    .eq('id', bookingId)
    .single()

  if (error || !booking) return res.status(404).json({ error: 'Booking not found' })
  if (booking.payment_status === 'paid') return res.status(400).json({ error: 'Already paid' })

  const amountCents  = Math.round(Number(booking.total_price_zar) * 100)
  const externalTxId = `BLY-${bookingId}`
  const guestName    = `${booking.lead_guest?.firstName ?? ''} ${booking.lead_guest?.lastName ?? ''}`.trim()

  // entityID = Application Key ID per iKhokha API docs ("Application key ID" field comment)
  const requestBody = {
    entityID:              IK_APP_ID,
    externalEntityID:      IK_APP_ID,
    amount:                amountCents,
    currency:              'ZAR',
    requesterUrl:          BASE_URL,
    description:           `BLY Travel - ${guestName}`,
    paymentReference:      externalTxId,
    mode:                  'live',
    externalTransactionID: externalTxId,
    urls: {
      callbackUrl:    `${BASE_URL}/api/payment/webhook`,
      successPageUrl: `${BASE_URL}/booking/success?id=${bookingId}`,
      failurePageUrl: `${BASE_URL}/booking/payment-failed?id=${bookingId}`,
      cancelUrl:      `${BASE_URL}/checkout`,
    },
  }

  const bodyStr   = JSON.stringify(requestBody)
  const signature = signRequest(bodyStr)

  console.log('[iKhokha] entityID (App ID):', IK_APP_ID.slice(0, 8) + '…')
  console.log('[iKhokha] amount (cents):', amountCents)

  const ikRes = await fetch(IK_API_URL, {
    method: 'POST',
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
      'IK-APPID':     IK_APP_ID.trim(),
      'IK-SIGN':      signature,
    },
    body: bodyStr,
  })

  const data = await ikRes.json()
  console.log('[iKhokha] response:', JSON.stringify(data))

  if (!data.paylinkUrl) {
    return res.status(502).json({ error: 'Could not create payment link', detail: data })
  }

  await supabase
    .from('hg_bookings')
    .update({
      ik_paylink_id:     data.paylinkID,
      ik_paylink_url:    data.paylinkUrl,
      ik_external_tx_id: externalTxId,
    })
    .eq('id', bookingId)

  return res.status(200).json({ paylinkUrl: data.paylinkUrl })
}
