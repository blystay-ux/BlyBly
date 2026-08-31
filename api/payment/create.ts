// api/payment/create.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IKHOKHA_APP_ID      ?? ''
const IK_APP_SECRET = process.env.IKHOKHA_APP_SECRET  ?? ''
const IK_ENTITY_ID  = process.env.IKHOKHA_ENTITY_ID   ?? '585144'
const IK_API_URL    = 'https://api.ikhokha.com/public-api/v1/api/payment'
const BASE_URL      = process.env.VITE_BASE_URL ?? ''

function ikEscape(str: string): string {
  return str.replace(/[\\"']/g, '\\$&').replace(/\0/g, '\\0')
}

function hmac(msg: string): string {
  return crypto.createHmac('sha256', IK_APP_SECRET.trim()).update(msg, 'utf8').digest('hex')
}

const urlPath = new URL(IK_API_URL).pathname  // /public-api/v1/api/payment

function allSignatures(bodyStr: string) {
  return {
    'A-escaped-path+body':  hmac(ikEscape(urlPath + bodyStr)),
    'B-raw-path+body':      hmac(urlPath + bodyStr),
    'C-escaped-body-only':  hmac(ikEscape(bodyStr)),
    'D-raw-body-only':      hmac(bodyStr),
  }
}

async function trySign(sig: string, bodyStr: string): Promise<{ ok: boolean; data: any; status: number }> {
  const res = await fetch(IK_API_URL, {
    method: 'POST',
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
      'IK-APPID':     IK_APP_ID.trim(),
      'IK-SIGN':      sig,
    },
    body: bodyStr,
  })
  const data = await res.json()
  return { ok: !!data.paylinkUrl, data, status: res.status }
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
    .select('id, total_price_zar, lead_guest, payment_status, status')
    .eq('id', bookingId)
    .single()

  if (error || !booking) return res.status(404).json({ error: 'Booking not found' })
  if (booking.payment_status === 'paid') return res.status(400).json({ error: 'Already paid' })

  const amountCents  = Math.round(Number(booking.total_price_zar) * 100)
  const externalTxId = `BLY-${bookingId}`
  const guestName    = `${booking.lead_guest?.firstName ?? ''} ${booking.lead_guest?.lastName ?? ''}`.trim()

  const requestBody = {
    entityID:              IK_ENTITY_ID,
    externalEntityID:      IK_ENTITY_ID,
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

  const bodyStr = JSON.stringify(requestBody)
  const sigs    = allSignatures(bodyStr)

  console.log('[iKhokha] body:', bodyStr)
  console.log('[iKhokha] signatures:', sigs)

  // Try each signing approach until one works
  for (const [name, sig] of Object.entries(sigs)) {
    console.log(`[iKhokha] Trying ${name} → sig: ${sig.slice(0, 16)}`)
    const result = await trySign(sig, bodyStr)
    console.log(`[iKhokha] ${name} → HTTP ${result.status}:`, JSON.stringify(result.data))

    if (result.ok) {
      console.log(`[iKhokha] SUCCESS with approach: ${name}`)

      await supabase
        .from('hg_bookings')
        .update({
          ik_paylink_id:     result.data.paylinkID,
          ik_paylink_url:    result.data.paylinkUrl,
          ik_external_tx_id: externalTxId,
        })
        .eq('id', bookingId)

      return res.status(200).json({ paylinkUrl: result.data.paylinkUrl })
    }
  }

  console.error('[iKhokha] All signing approaches failed')
  return res.status(502).json({ error: 'Could not create payment link' })
}
