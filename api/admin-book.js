// api/admin-book.js
// Vercel Serverless Function — ADMIN-ONLY manual booking.
//
// Books a pending hg_bookings row straight through HyperGuest, using the
// card on file (HG_CARD_* secrets inside the hyperguest-book edge function).
// iKhokha is NOT involved: no payment link is created and the webhook never
// fires. Bly collects payment from the guest by other means.
//
// Security: the caller must send a valid Supabase access token belonging to a
// user whose profiles.role = 'admin'. The service role key stays server-side.

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase    = createClient(supabaseUrl, serviceKey)

  // ── 1. Verify the caller is an admin ────────────────────────────────────
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Not signed in' })

  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Invalid session' })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
  if (profile?.role !== 'admin') return res.status(403).json({ error: 'Admins only' })

  // ── 2. Load the pending booking created by the admin checkout ───────────
  const { bookingId, sendEmail } = req.body || {}
  if (!bookingId) return res.status(400).json({ error: 'bookingId is required' })

  const { data: booking, error: lookupErr } = await supabase
    .from('hg_bookings')
    .select('id, status, payment_status, checkout_payload, meta')
    .eq('id', bookingId)
    .maybeSingle()
  if (lookupErr || !booking) return res.status(404).json({ error: 'Booking not found' })
  if (!booking.checkout_payload) return res.status(400).json({ error: 'Booking has no checkout payload' })
  if (booking.status !== 'Pending' || booking.payment_status === 'paid') {
    return res.status(409).json({ error: 'Booking is not pending — refusing to book again' })
  }

  // Mark as an admin booking BEFORE calling HyperGuest, so it is never mistaken for an unpaid web booking.
  await supabase.from('hg_bookings').update({
    payment_status: 'admin_card_on_file',
    meta: { ...(booking.meta || {}), booked_by_admin: userData.user.email, payment_method: 'card_on_file' },
  }).eq('id', booking.id)

  // ── 3. Book with HyperGuest (card comes from Supabase secrets) ──────────
  let hgData = null
  let hgOk = false
  try {
    const hgRes = await fetch(`${supabaseUrl}/functions/v1/hyperguest-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ ...booking.checkout_payload, existingBookingId: booking.id }),
    })
    hgData = await hgRes.json().catch(() => null)
    hgOk = hgRes.ok
  } catch (err) {
    console.error('[admin-book] HyperGuest call failed:', err.message)
    return res.status(502).json({ error: 'Could not reach HyperGuest', bookingId: booking.id })
  }

  if (!hgOk) {
    await supabase.from('hg_bookings').update({ status: 'Failed' }).eq('id', booking.id)
    return res.status(502).json({ error: 'HyperGuest booking failed', detail: hgData, bookingId: booking.id })
  }

  // ── 4. Optional confirmation email to the guest ─────────────────────────
  let emailed = false
  if (sendEmail) {
    try {
      const origin = process.env.SITE_URL || 'https://blytravel.co.za'
      const r = await fetch(`${origin}/api/payment/resend-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      emailed = r.ok
    } catch (err) {
      console.error('[admin-book] email failed:', err.message)
    }
  }

  return res.status(200).json({ ok: true, bookingId: booking.id, hyperguestBookingId: hgData?.content?.bookingId ?? null, emailed })
}
