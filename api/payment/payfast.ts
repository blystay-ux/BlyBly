import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const PF_MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID  ?? ''
const PF_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY ?? ''
const PF_PASSPHRASE   = process.env.PAYFAST_PASSPHRASE   ?? ''
const BASE_URL        = process.env.VITE_BASE_URL         ?? ''

const PF_URL = 'https://www.payfast.co.za/eng/process'
// For sandbox testing swap to:
// const PF_URL = 'https://sandbox.payfast.co.za/eng/process'

function generateSignature(data: Record<string, string>): string {
  // 1. Sort keys alphabetically
  const sorted = Object.keys(data).sort()

  // 2. Build param string: key=encodeURIComponent(value) joined with &
  let paramStr = sorted
    .map(k => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
    .join('&')

  // 3. Append passphrase if set
  if (PF_PASSPHRASE) {
    paramStr += `&passphrase=${encodeURIComponent(PF_PASSPHRASE).replace(/%20/g, '+')}`
  }

  // 4. MD5 hash
  return crypto.createHash('md5').update(paramStr).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { bookingId } = req.body ?? {}
  if (!bookingId) return res.status(400).json({ error: 'bookingId is required' })

  if (!PF_MERCHANT_ID || !PF_MERCHANT_KEY) {
    return res.status(500).json({ error: 'PayFast not configured' })
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

  const amount      = Number(booking.total_price_zar).toFixed(2)
  const paymentRef  = `BLY-${bookingId}`
  const firstName   = booking.lead_guest?.firstName ?? ''
  const lastName    = booking.lead_guest?.lastName  ?? ''
  const email       = booking.lead_guest?.email     ?? ''

  const pfData: Record<string, string> = {
    merchant_id:    PF_MERCHANT_ID,
    merchant_key:   PF_MERCHANT_KEY,
    return_url:     `${BASE_URL}/booking/success?id=${bookingId}`,
    cancel_url:     `${BASE_URL}/checkout`,
    notify_url:     `${BASE_URL}/api/payment/payfast-webhook`,
    name_first:     firstName,
    name_last:      lastName,
    email_address:  email,
    m_payment_id:   paymentRef,
    amount,
    item_name:      'BLY Travel Booking',
    item_description: paymentRef,
  }

  // Remove empty values (PayFast rejects empty optional fields in signature)
  Object.keys(pfData).forEach(k => {
    if (!pfData[k]) delete pfData[k]
  })

  const signature = generateSignature(pfData)
  pfData.signature = signature

  // Build the redirect URL
  const queryString = Object.entries(pfData)
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
    .join('&')

  const redirectUrl = `${PF_URL}?${queryString}`

  // Update booking with PayFast reference
  await supabase
    .from('hg_bookings')
    .update({ pf_payment_id: paymentRef })
    .eq('id', bookingId)

  return res.status(200).json({ redirectUrl })
}
