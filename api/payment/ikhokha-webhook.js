import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const IK_APP_ID     = process.env.IK_APP_ID     || ''
const IK_APP_SECRET = process.env.IK_APP_SECRET || ''
const CALLBACK_PATH = '/api/payment/ikhokha-webhook'

function jsStringEscape(str) {
  return str
    .split('\\').join('\\\\')
    .split('"').join('\\"')
    .split("'").join("\\'")
    .split(' ').join('\\0')
}

function computeSignature(urlPath, body) {
  const payload = jsStringEscape(urlPath + JSON.stringify(body))
  return crypto.createHmac('sha256', IK_APP_SECRET.trim()).update(payload).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const receivedAppId = (req.headers['ik-appid'] || '')
  if (!receivedAppId || receivedAppId !== IK_APP_ID) {
    console.error('[iKhokha webhook] App ID mismatch:', receivedAppId)
    return res.status(403).json({ error: 'Invalid App ID' })
  }

  const body = { ...req.body }
  delete body.text

  const receivedSign = (req.headers['ik-sign'] || '')
  const expectedSign = computeSignature(CALLBACK_PATH, body)

  if (!receivedSign || receivedSign !== expectedSign) {
    console.error('[iKhokha webhook] Signature mismatch — received:', receivedSign, '| expected:', expectedSign)
    return res.status(403).json({ error: 'Signature mismatch' })
  }

  const { paylinkID, status, externalTransactionID, responseCode } = body
  console.log('[iKhokha webhook]', { paylinkID, status, externalTransactionID, responseCode })

  if (responseCode !== '00') {
    return res.status(200).json({ received: true })
  }

  const bookingId = String(externalTransactionID || '').replace('BLY-', '')
  if (!bookingId) {
    console.error('[iKhokha webhook] No bookingId in:', externalTransactionID)
    return res.status(200).json({ received: true })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (status === 'SUCCESS') {
    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'paid', status: 'Confirmed', ik_paylink_id: paylinkID })
      .eq('id', bookingId)

    const { data: booking } = await supabase
      .from('hg_bookings')
      .select('checkout_payload')
      .eq('id', bookingId)
      .single()

    if (booking && booking.checkout_payload) {
      try {
        const hgRes = await fetch(
          `${process.env.VITE_SUPABASE_URL}/functions/v1/hyperguest-book`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ ...booking.checkout_payload, existingBookingId: bookingId }),
          }
        )
        const hgData = await hgRes.json().catch(() => null)
        console.log('[iKhokha webhook] HyperGuest result:', JSON.stringify(hgData))
      } catch (err) {
        console.error('[iKhokha webhook] HyperGuest call failed:', err)
      }
    }
  }

  if (status === 'FAILURE') {
    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'failed', ik_paylink_id: paylinkID })
      .eq('id', bookingId)
  }

  return res.status(200).json({ received: true })
}
