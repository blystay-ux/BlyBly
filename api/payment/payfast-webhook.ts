import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const PF_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? ''
const PF_PASSPHRASE  = process.env.PAYFAST_PASSPHRASE  ?? ''
const BASE_URL       = process.env.VITE_BASE_URL        ?? ''

// PayFast's server IPs — reject webhooks from anywhere else
const PF_VALID_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '41.74.179.194',
  '41.74.179.195',
  '41.74.179.196',
  '41.74.179.197',
]

function generateSignature(data: Record<string, string>): string {
  const sorted = Object.keys(data).sort()
  let paramStr = sorted
    .map(k => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
    .join('&')
  if (PF_PASSPHRASE) {
    paramStr += `&passphrase=${encodeURIComponent(PF_PASSPHRASE).replace(/%20/g, '+')}`
  }
  return crypto.createHash('md5').update(paramStr).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // 1. Verify source IP (Vercel puts real IP in x-forwarded-for)
  const forwardedFor = req.headers['x-forwarded-for'] as string ?? ''
  const remoteIp     = forwardedFor.split(',')[0].trim()
  if (!PF_VALID_IPS.includes(remoteIp)) {
    console.warn('[PayFast ITN] Rejected from IP:', remoteIp)
    return res.status(403).end()
  }

  const pfPost = req.body as Record<string, string>

  // 2. Verify signature
  const receivedSig = pfPost.signature
  const dataForSig  = { ...pfPost }
  delete dataForSig.signature

  const expectedSig = generateSignature(dataForSig)
  if (receivedSig !== expectedSig) {
    console.error('[PayFast ITN] Signature mismatch')
    return res.status(400).end()
  }

  // 3. Verify amount and merchant ID
  const paymentId   = pfPost.m_payment_id  // e.g. BLY-<bookingId>
  const pfAmount    = pfPost.amount_gross
  const pfStatus    = pfPost.payment_status // COMPLETE or FAILED
  const merchantId  = pfPost.merchant_id

  if (merchantId !== PF_MERCHANT_ID) {
    console.error('[PayFast ITN] Merchant ID mismatch')
    return res.status(400).end()
  }

  // 4. Optional: verify with PayFast server (recommended for production)
  // const pfQuery = new URLSearchParams(pfPost).toString()
  // const pfVerify = await fetch(`https://www.payfast.co.za/eng/query/validate`, {
  //   method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: pfQuery
  // })
  // const pfVerifyText = await pfVerify.text()
  // if (pfVerifyText !== 'VALID') return res.status(400).end()

  // Extract bookingId from m_payment_id (format: BLY-<bookingId>)
  const bookingId = paymentId?.replace(/^BLY-/, '')
  if (!bookingId) return res.status(400).end()

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (pfStatus === 'COMPLETE') {
    console.log('[PayFast ITN] Payment complete for booking:', bookingId, 'amount:', pfAmount)

    await supabase
      .from('hg_bookings')
      .update({
        payment_status: 'paid',
        status:         'Confirmed',
        pf_payment_id:  pfPost.pf_payment_id,
      })
      .eq('id', bookingId)

    // TODO: trigger HyperGuest booking confirm + send confirmation email here
  } else {
    console.log('[PayFast ITN] Payment failed for booking:', bookingId, 'status:', pfStatus)

    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'failed' })
      .eq('id', bookingId)
  }

  // PayFast expects a 200 OK — no body needed
  return res.status(200).end()
}
