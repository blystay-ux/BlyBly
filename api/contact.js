// api/contact.js — saves contact form submissions to Supabase
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { name, email, message } = req.body || {}
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' })

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase
    .from('contact_messages')
    .insert({ name: name.trim(), email: email.trim().toLowerCase(), message: message.trim() })

  if (error) {
    console.error('[contact] Supabase insert error:', error)
    return res.status(500).json({ error: 'Failed to save message' })
  }

  return res.status(200).json({ ok: true })
}
