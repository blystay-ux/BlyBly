// api/group-request.js
// Vercel Serverless Function — receives a group request from /group-request,
// stores it in public.group_requests (service role), emails the BLY team and
// sends the requester an acknowledgement.

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const clean = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const intOrNull = v => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= 0 ? n : null }
const dateOrNull = v => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null)

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
  if (b.website) return res.status(200).json({ ok: true, reference: 'GRP-000000' }) // honeypot

  const destination = clean(b.destination, 200)
  const name = clean(b.name, 120)
  const email = clean(b.email, 200)
  if (!destination || !name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Destination, name and a valid email are required.' })
  }

  const reference = 'GRP-' + String(Math.floor(100000 + Math.random() * 900000))
  const row = {
    reference,
    group_type: clean(b.groupType, 60),
    destination,
    check_in: dateOrNull(b.checkIn),
    check_out: dateOrNull(b.checkOut),
    dates_flexible: !!b.flexible,
    adults: intOrNull(b.adults),
    children: intOrNull(b.children),
    rooms: intOrNull(b.rooms),
    budget: clean(b.budget, 60),
    needs: Array.isArray(b.needs) ? b.needs.slice(0, 12).map(n => clean(n, 60)) : [],
    notes: clean(b.notes, 2000),
    contact_name: name,
    contact_email: email,
    contact_phone: clean(b.phone, 40),
    company: clean(b.company, 160),
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { error } = await supabase.from('group_requests').insert(row)
  if (error) {
    console.error('[group-request] insert failed:', error.message)
    return res.status(500).json({ error: 'Could not save your request. Please try again.' })
  }

  // Emails are best-effort: the request is already saved.
  try {
    const t = transporter()
    const from = process.env.EMAIL_FROM || 'BLY Travel <info@blytravel.co.za>'
    const to = process.env.GROUP_REQUEST_TO || 'info@blytravel.co.za'
    const dates = row.check_in && row.check_out ? `${row.check_in} to ${row.check_out}` : 'Not set'
    const lines = [
      ['Reference', reference], ['Group type', row.group_type], ['Destination', destination],
      ['Dates', dates + (row.dates_flexible ? ' (flexible)' : '')],
      ['Adults / children', `${row.adults ?? '?'} / ${row.children ?? 0}`],
      ['Rooms', row.rooms ?? 'Not set'], ['Budget per room/night', row.budget || 'Not sure'],
      ['Needs', row.needs.join(', ') || 'None'], ['Notes', row.notes || '-'],
      ['Name', name], ['Email', email], ['Phone', row.contact_phone || '-'], ['Company', row.company || '-'],
    ]
    await t.sendMail({
      from, to, replyTo: email,
      subject: `New group request ${reference} — ${destination}`,
      text: lines.map(([k, v]) => `${k}: ${v}`).join('\n'),
      html: `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">${lines.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join('')}</table>`,
    })
    await t.sendMail({
      from, to: email,
      subject: `We received your group request ${reference}`,
      text: `Hi ${name.split(' ')[0]},\n\nThanks for your group request for ${destination}. A BLY consultant will review it and come back to you with options.\n\nReference: ${reference}\n\nBLY.\nblytravel.co.za`,
    })
  } catch (e) {
    console.error('[group-request] email failed:', e.message)
  }

  return res.status(200).json({ ok: true, reference })
}
