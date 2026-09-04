// api/payment/ikhokha-webhook.js
// Vercel Serverless Function — receives iKhokha payment status callbacks.
// Uses SUPABASE_SERVICE_ROLE_KEY (no VITE_ prefix — stays server-side only).

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const IK_APP_ID     = process.env.IK_APP_ID     || ''
const IK_APP_SECRET = process.env.IK_APP_SECRET || ''
const CALLBACK_PATH = '/api/payment/ikhokha-webhook'

// iKhokha requires jsStringEscape before HMAC — same rule for inbound webhooks.
function jsStringEscape(str) {
  return JSON.stringify(str).slice(1, -1)
}

function computeSignature(urlPath, body) {
  const payload = jsStringEscape(urlPath + JSON.stringify(body))
  return crypto.createHmac('sha256', IK_APP_SECRET.trim()).update(payload).digest('hex')
}

// ── Mailer ────────────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_SMTP_HOST || 'bayek.aserv.co.za',
    port:   Number(process.env.EMAIL_SMTP_PORT || 465),
    secure: true, // SSL on port 465
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
  const meta       = booking.meta || {}
  const hotelName  = meta.hotelName  || 'Your property'
  const roomName   = meta.roomName   || ''
  const ratePlan   = meta.ratePlanName || ''
  const checkIn    = formatDate(booking.check_in)
  const checkOut   = formatDate(booking.check_out)
  const total      = formatZAR(booking.total_price_zar)

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

        <!-- Header -->
        <tr>
          <td style="background:#111;padding:32px 40px;text-align:center;">
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#fff;">BLY<span style="color:#C9A96E;">.</span></div>
            <div style="color:#999;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Travel</div>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🎉</div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111;">You're booked!</h1>
            <p style="margin:0;color:#666;font-size:15px;">Your reservation is confirmed. We can't wait for your stay.</p>
          </td>
        </tr>

        <!-- Booking ref -->
        <tr>
          <td style="padding:24px 40px 0;text-align:center;">
            <div style="display:inline-block;background:#F5F4F1;border-radius:8px;padding:12px 24px;">
              <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px;">Booking Reference</div>
              <div style="font-size:20px;font-weight:800;color:#111;letter-spacing:1px;">${reference}</div>
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:32px 40px 0;"><hr style="border:none;border-top:1px solid #EBEBEB;margin:0;"></td></tr>

        <!-- Details -->
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

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #EBEBEB;margin:0;"></td></tr>

        <!-- Help -->
        <tr>
          <td style="padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:#666;font-size:14px;">Questions about your booking?</p>
            <a href="mailto:info@blytravel.co.za" style="color:#111;font-weight:600;font-size:14px;text-decoration:none;">info@blytravel.co.za</a>
          </td>
        </tr>

        <!-- Footer -->
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

async function sendConfirmationEmail({ booking, guestName, guestEmail, reference }) {
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
    console.log('[email] Confirmation sent to', guestEmail)
  } catch (err) {
    // Never let email failure break the webhook response
    console.error('[email] Failed to send confirmation:', err.message)
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── App ID check ──────────────────────────────────────────────────────────
  const receivedAppId = req.headers['ik-appid'] || ''
  if (!receivedAppId || receivedAppId !== IK_APP_ID) {
    console.error('[iKhokha webhook] App ID mismatch:', receivedAppId)
    return res.status(403).json({ error: 'Invalid App ID' })
  }

  // ── Signature check ───────────────────────────────────────────────────────
  const body = { ...req.body }
  delete body.text

  const receivedSign = req.headers['ik-sign'] || ''
  const expectedSign = computeSignature(CALLBACK_PATH, body)
  if (!receivedSign || receivedSign !== expectedSign) {
    console.error('[iKhokha webhook] Signature mismatch — received:', receivedSign, '| expected:', expectedSign)
    return res.status(403).json({ error: 'Signature mismatch' })
  }

  // ── Parse payload ─────────────────────────────────────────────────────────
  const { paylinkID, status, externalTransactionID, responseCode } = body
  console.log('[iKhokha webhook]', { paylinkID, status, externalTransactionID, responseCode })

  if (responseCode !== '00') {
    return res.status(200).json({ received: true })
  }

  const rawRef   = String(externalTransactionID || '').trim()
  const bookingId = rawRef.startsWith('BLY-') ? rawRef.slice(4) : rawRef
  if (!bookingId) {
    console.error('[iKhokha webhook] No externalTransactionID in payload')
    return res.status(200).json({ received: true })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // ── Look up the booking ───────────────────────────────────────────────────
  const { data: booking, error: lookupErr } = await supabase
    .from('hg_bookings')
    .select('id, agency_reference, checkout_payload, meta, check_in, check_out, total_price_zar, lead_guest, guest_email')
    .eq('id', bookingId)
    .maybeSingle()

  if (lookupErr || !booking) {
    console.error('[iKhokha webhook] Booking not found for id:', bookingId, lookupErr)
    return res.status(200).json({ received: true })
  }

  // ── Payment SUCCESS ───────────────────────────────────────────────────────
  if (status === 'SUCCESS') {
    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'paid', status: 'Confirmed', ik_paylink_id: paylinkID })
      .eq('id', booking.id)

    if (booking.checkout_payload) {
      try {
        const hgRes = await fetch(
          `${process.env.VITE_SUPABASE_URL}/functions/v1/hyperguest-book`,
          {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ ...booking.checkout_payload, existingBookingId: booking.id }),
          }
        )
        const hgData = await hgRes.json().catch(() => null)
        console.log('[iKhokha webhook] HyperGuest result:', JSON.stringify(hgData))
      } catch (err) {
        console.error('[iKhokha webhook] HyperGuest call failed:', err)
      }
    }

    // ── Send confirmation email ───────────────────────────────────────────
    const leadGuest  = booking.lead_guest || {}
    const guestName  = [leadGuest.firstName, leadGuest.lastName].filter(Boolean).join(' ') || 'Guest'
    const guestEmail = booking.guest_email || leadGuest.email
    const reference  = booking.agency_reference || booking.id

    if (guestEmail) {
      await sendConfirmationEmail({ booking, guestName, guestEmail, reference })
    } else {
      console.warn('[email] No guest email on booking', booking.id)
    }
  }

  // ── Payment FAILURE ───────────────────────────────────────────────────────
  if (status === 'FAILURE') {
    await supabase
      .from('hg_bookings')
      .update({ payment_status: 'failed', ik_paylink_id: paylinkID })
      .eq('id', booking.id)
  }

  return res.status(200).json({ received: true })
}
