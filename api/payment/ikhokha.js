import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IK_APP_ID     || ''
const IK_APP_SECRET = process.env.IK_APP_SECRET || ''
const IK_ENTITY_ID  = process.env.IK_ENTITY_ID  || process.env.IK_APP_ID || ''
const BASE_URL      = process.env.VITE_BASE_URL  || ''

const IK_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment'
const IK_PATH     = '/public-api/v1/api/payment'

function createSignature(urlPath, body) {
  const payload = urlPath + JSON.stringify(body)
  return crypto.createHmac('sha256', IK_APP_SECRET.trim()).update(payload).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { bookingId } = req.body || {}
  if (!bookingId) return res.status(400).json({ error: 'bookingId is required' })

  if (!IK_APP_ID || !IK_APP_SECRET) {
    console.error('[iKhokha] Missing IK_APP_ID or IK_APP_SECRET env vars')
    return res.status(500).json({ error: 'iKhokha not configured' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: booking, error } = await supabase
    .from('hg_bookings')
    .select('id, total_price_zar, lead_guest, payment_status')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return res.status(404).json({ error: 'Booking not found' })
  }
  if (booking.payment_status === 'paid') {
    return res.status(400).json({ error: 'Already paid' })
  }

  const amountCents           = Math.round(Number(booking.total_price_zar) * 100)
  const externalTransactionID = `BLY-${bookingId}`

  const requestBody = {
    entityID:            IK_ENTITY_ID,
    amount:              amountCents,
    currency:            'ZAR',
    requesterUrl:        BASE_URL,
    mode:                'live',
    externalTransactionID,
    description:         `BLY Travel Booking ${externalTransactionID}`,
    urls: {
      callbackUrl:    `${BASE_URL}/api/payment/ikhokha-webhook`,
      successPageUrl: `${BASE_URL}/booking/success?id=${bookingId}`,
      failurePageUrl: `${BASE_URL}/checkout?payment=failed`,
      cancelUrl:      `${BASE_URL}/checkout`,
    },
  }

  const signature = createSignature(IK_PATH, requestBody)

  let ikData
  try {
    const ikRes = await fetch(IK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'IK-APPID': IK_APP_ID.trim(),
        'IK-SIGN':  signature,
      },
      body: JSON.stringify(requestBody),
    })
    ikData = await ikRes.json()
  } catch (fetchErr) {
    console.error('[iKhokha] Network error:', fetchErr)
    return res.status(502).json({ error: 'Failed to reach iKhokha' })
  }

  console.log('[iKhokha] Response:', JSON.stringify(ikData))

  if (ikData.responseCode !== '00' || !ikData.paylinkUrl) {
    return res.status(502).json({ error: 'iKhokha error', detail: ikData })
  }

  await supabase
    .from('hg_bookings')
    .update({ ik_paylink_id: ikData.paylinkID })
    .eq('id', bookingId)

  return res.status(200).json({ redirectUrl: ikData.paylinkUrl })
}
