// api/payment/resend-confirmation.js
// Vercel Serverless Function — manually (re)sends a booking confirmation
// email for a given bookingId. Built 2026-09-30 after discovering the
// ikhokha-webhook's email step never ran for some real, paid bookings due
// to a missing `nodemailer` dependency (fixed separately). This reuses the
// exact same email-building/sending logic as the webhook, so a resend
// looks identical to the original.
//
// Security note: like ikhokha-payment (the function that creates the
// payment link), this relies on bookingId being an unguessable UUID rather
// than a separate auth check -- consistent with that existing pattern in
// this codebase, not a new one introduced here.

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_SMTP_HOST || 'bayek.aserv.co.za',
    port:   Number(process.env.EMAIL_SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  })
}

function formatDate(dateStr) {
  if (!dateStr) return dateStr
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatZAR(amount) {
  if (amount == null) return '—'
  return `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function buildConfirmationEmail({ booking, guestName, reference }) {
  const meta      = booking.meta || {}
  const hotelName = meta.hotelName || 'Your property'
  const roomName  = meta.roomName || ''
  const ratePlan  = meta.ratePlanName || ''
  const checkIn   = formatDate(booking.check_in)
  const checkOut  = formatDate(booking.check_out)
  const total     = formatZAR(booking.total_price_zar)

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Booking Confirmed — BLY Travel</title>
</head>
<body style="margin:0;padding:0;background:#F5F4F1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F1;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:#111;padding:32px 40px;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#fff;">BLY<span style="color:#C9A96E;">.</span></div>
            <div style="color:#999;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Travel</div>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🎉</div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111;">You're booked!</h1>
            <p style="margin:0;color:#666;font-size:15px;">Your reservation is confirmed. We can't wait for your stay.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 0;text-align:center;">
            <div style="display:inline-block;background:#F5F4F1;border-radius:8px;padding:12px 24px;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Booking Reference</div>
              <div style="font-size:20px;font-weight:800;color:#111;letter-spacing:1px;">${reference}</div>
            </div>
          </td>
        </tr>
        <tr><td style="padding:32px 40px 0;"><hr style="border:none;border-top:1px solid #EBEBEB;margin:0;"></td></tr>
        <tr>
          <td style="padding:32px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:20px;">
                  <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Property</div>
                  <div style="font-size:16px;font-weight:700;color:#111;">${hotelName}</div>
                  ${roomName ? `<div style="font-size:13px;color:#666;margin-top:2px;">${roomName}${ratePlan ? ` · ${ratePlan}` : ''}</div>` : ''}
                </td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Check-in</div>
                        <div style="font-size:14px;font-weight:600;color:#111;">${checkIn}</div>
                      </td>
                      <td width="50%" style="padding-bottom:20px;vertical-align:top;">
                        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Check-out</div>
                        <div style="font-size:14px;font-weight:600;color:#111;">${checkOut}</div>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="vertical-align:top;">
                        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Guest</div>
                        <div style="font-size:14px;font-weight:600;color:#111;">${guestName}</div>
                      </td>
                      <td width="50%" style="vertical-align:top;">
                        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Total Paid</div>
                        <div style="font-size:14px;font-weight:700;color:#111;">${total}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #EBEBEB;margin:0;"></td></tr>
        <tr>
          <td style="padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:#666;font-size:14px;">Questions about your booking?</p>
            <a href="mailto:info@blytravel.co.za" style="color:#111;font-weight:600;font-size:14px;text-decoration:none;">info@blytravel.co.za</a>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F4F1;padding:24px 40px;text-align:center;border-radius:0 0 12px 12px;">
            <p style="margin:0;color:#aaa;font-size:11px;">© 2026 BLY Travel · South Africa</p>
            <p style="margin:4px 0 0;color:#aaa;font-size:11px;">This email confirms your booking at <strong style="color:#888;">${hotelName}</strong></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `
BLY Travel — Booking Confirmed

Booking Reference: ${reference}

Property:  ${hotelName}${roomName ? `\nRoom:      ${roomName}` : ''}
Check-in:  ${checkIn}
Check-out: ${checkOut}
Guest:     ${guestName}
Total:     ${total}

Questions? Email us at info@blytravel.co.za
`

  return { html, text }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders)
    return res.end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { bookingId } = req.body || {}
  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: booking, error: lookupErr } = await supabase
    .from('hg_bookings')
    .select('id, agency_reference, meta, check_in, check_out, total_price_zar, lead_guest, guest_email')
    .eq('id', bookingId)
    .maybeSingle()

  if (lookupErr || !booking) {
    console.error('[resend-confirmation] Booking not found for id:', bookingId, lookupErr)
    return res.status(404).json({ error: 'Booking not found' })
  }

  const leadGuest  = booking.lead_guest || {}
  const guestName  = [leadGuest.firstName, leadGuest.lastName].filter(Boolean).join(' ') || 'Guest'
  const guestEmail = booking.guest_email || leadGuest.email
  const reference  = booking.agency_reference || booking.id

  if (!guestEmail) {
    return res.status(400).json({ error: 'Booking has no guest email on file' })
  }

  try {
    const transporter = createTransporter()
    const { html, text } = buildConfirmationEmail({ booking, guestName, reference })
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || 'BLY Travel <info@blytravel.co.za>',
      to:      guestEmail,
      subject: `Booking confirmed — ${reference}`,
      html,
      text,
    })
    console.log('[resend-confirmation] Sent to', guestEmail, 'for booking', bookingId)
    return res.status(200).json({ sent: true, to: guestEmail, reference })
  } catch (err) {
    console.error('[resend-confirmation] Failed to send:', err.message)
    return res.status(502).json({ error: 'Failed to send email', detail: err.message })
  }
}
