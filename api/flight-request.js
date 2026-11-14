// api/flight-request.js
// Vercel Serverless Function — receives a flight quote request from /flights,
// stores it in public.flight_requests (service role), emails the BLY team and
// sends the requester an acknowledgement.

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const clean = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const intOrNull = v => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : null }
const dateOrNull = v => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null)
const TRIPS = { return: 'Return', oneway: 'One-way', multi: 'Multi-city' }

function transporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || 'bayek.aserv.co.za',
    port: Number(process.env.EMAIL_SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.EMAIL_SMTP_USER, pass: process.env.EMAIL_SMTP_PASS },
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const b = req.body || {}
  if (b.website) return res.status(200).json({ ok: true, reference: 'BLY-FL-000000' }) // honeypot

  const origin = clean(b.from, 120)
  const destination = clean(b.to, 120)
  const name = clean(b.name, 120)
  const email = clean(b.email, 200)
  if (!origin || !destination || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'From, to, your name and a valid email are required.' })
  }

  const tripType = TRIPS[b.trip] ? b.trip : 'return'
  const reference = 'BLY-FL-' + String(Math.floor(100000 + Math.random() * 900000))
  const row = {
    reference,
    trip_type: tripType,
    origin,
    destination,
    depart_date: dateOrNull(b.depart),
    return_date: tripType === 'return' ? dateOrNull(b.returnDate) : null,
    dates_flexible: !!b.flexible,
    adults: intOrNull(b.adults),
    children: intOrNull(b.children),
    infants: intOrNull(b.infants),
    cabin: clean(b.cabin, 40),
    preferred_airline: clean(b.airline, 80),
    include_stay: !!b.includeStay,
    notes: clean(b.notes, 2000),
    contact_name: name,
    contact_email: email,
    contact_phone: clean(b.phone, 40),
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await supabase.from('flight_requests').insert(row)
  if (error) {
    console.error('[flight-request] insert failed:', error.message)
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  // Emails are best-effort: the request is already saved.
  try {
    const t = transporter()
    const from = process.env.EMAIL_FROM || 'BLY Travel <info@blytravel.co.za>'
    const to = process.env.FLIGHT_REQUEST_TO || process.env.GROUP_REQUEST_TO || 'info@blytravel.co.za'
    const dates = (row.depart_date || 'Not set') + (row.return_date ? ` to ${row.return_date}` : '')
    const lines = [
      ['Reference', reference], ['Trip', TRIPS[tripType]], ['Route', `${origin} → ${destination}`],
      ['Dates', dates + (row.dates_flexible ? ' (flexible ±3 days)' : '')],
      ['Adults / children / infants', `${row.adults ?? '?'} / ${row.children ?? 0} / ${row.infants ?? 0}`],
      ['Cabin', row.cabin || 'Economy'], ['Preferred airline', row.preferred_airline || 'Any'],
      ['Quote accommodation too', row.include_stay ? 'Yes' : 'No'], ['Notes', row.notes || '-'],
      ['Name', name], ['Email', email], ['Phone / WhatsApp', row.contact_phone || '-'],
    ]
    await t.sendMail({
      from, to, replyTo: email,
      subject: `New flight request ${reference} — ${origin} to ${destination}`,
      text: lines.map(([k, v]) => `${k}: ${v}`).join('\n'),
      html: `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">${lines.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table>`,
    })
    await t.sendMail({
      from, to: email,
      subject: `We received your flight request ${reference}`,
      text: `Hi ${name.split(' ')[0]},\n\nThanks for your flight request from ${origin} to ${destination}. Our team will email you a quote within 24 hours. There is no booking fee, and nothing is booked until you accept your quote and pay via the secure payment link we send you.\n\nReference: ${reference}\n\nNeed it sooner? WhatsApp us on 079 382 5684.\n\nBLY.\nblytravel.co.za`,
    })
  } catch (e) {
    console.error('[flight-request] email failed:', e.message)
  }

  return res.status(200).json({ ok: true, reference })
}
