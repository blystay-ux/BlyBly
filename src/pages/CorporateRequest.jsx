import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s = {
  page: {
    minHeight: 'calc(100vh - var(--nav-height))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(160deg, #f8f8f6 0%, #f0ede8 100%)',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '44px 40px',
    width: '100%', maxWidth: 520,
    boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26,
    letterSpacing: '-1.5px', color: 'var(--text)',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#1a1a2e', color: '#fff',
    borderRadius: 99, padding: '5px 12px',
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  dividerLine: {
    borderTop: '1.5px solid var(--border)',
    margin: '0 0 28px',
  },
  title: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26,
    letterSpacing: '-0.8px', marginBottom: 6, color: 'var(--text)',
  },
  sub: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  fieldGroup: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid var(--border)', fontSize: 15,
    fontFamily: 'var(--font-body)',
    outline: 'none', color: 'var(--text)', background: 'var(--bg)',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid var(--border)', fontSize: 15,
    fontFamily: 'var(--font-body)',
    outline: 'none', color: 'var(--text)', background: 'var(--bg)',
    boxSizing: 'border-box', resize: 'vertical', minHeight: 100,
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%', padding: '14px 0', borderRadius: 99,
    background: '#1a1a2e', color: '#fff',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
    border: 'none', cursor: 'pointer', marginTop: 8,
    transition: 'opacity 0.2s', letterSpacing: '-0.3px',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  error: {
    background: '#fff0f0', color: '#cc0000', borderRadius: 10,
    padding: '11px 14px', fontSize: 13, marginBottom: 16,
    border: '1px solid #ffd0d0',
  },
  success: {
    textAlign: 'center', padding: '32px 0',
  },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22,
    letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: 10,
  },
  successText: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 28 },
  successBtn: {
    display: 'inline-block', padding: '12px 28px', borderRadius: 99,
    background: '#1a1a2e', color: '#fff',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
    textDecoration: 'none', letterSpacing: '-0.3px',
  },
  footer: {
    borderTop: '1px solid var(--border)',
    marginTop: 28, paddingTop: 20,
    textAlign: 'center',
  },
  footerLink: {
    fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
  },
}

export default function CorporateRequest() {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: insertError } = await supabase
        .from('corporate_requests')
        .insert({
          company_name: form.company_name.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          message: form.message.trim() || null,
        })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err) {
      console.error('Corporate request error:', err)
      setError('Something went wrong submitting your request. Please try again or email us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoRow}>
          <span style={s.logoText}>bly.</span>
          <span style={s.badge}>🏢 Corporate Account Request</span>
        </div>
        <div style={s.dividerLine} />

        {submitted ? (
          <div style={s.success}>
            <div style={s.successIcon}>✅</div>
            <h2 style={s.successTitle}>Request Submitted!</h2>
            <p style={s.successText}>
              Thank you! We've received your corporate account request and will be in touch within 1–2 business days to get you set up with your company's exclusive travel rates.
            </p>
            <Link to="/" style={s.successBtn}>Back to Home</Link>
          </div>
        ) : (
          <>
            <h1 style={s.title}>Request a corporate account</h1>
            <p style={s.sub}>
              Unlock exclusive corporate travel rates for your company. Fill in your details and our team will set up your account within 1–2 business days.
            </p>

            {error && <div style={s.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={s.row}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Company Name *</label>
                  <input
                    style={s.input}
                    name="company_name"
                    type="text"
                    placeholder="Acme Corp"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Contact Name *</label>
                  <input
                    style={s.input}
                    name="contact_name"
                    type="text"
                    placeholder="Jane Smith"
                    value={form.contact_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div style={s.row}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Work Email *</label>
                  <input
                    style={s.input}
                    name="email"
                    type="email"
                    placeholder="jane@acmecorp.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Phone (optional)</label>
                  <input
                    style={s.input}
                    name="phone"
                    type="tel"
                    placeholder="+27 82 000 0000"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Message (optional)</label>
                <textarea
                  style={s.textarea}
                  name="message"
                  placeholder="Tell us about your travel needs, team size, or any questions…"
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
                disabled={loading}
              >
                {loading ? 'Submitting…' : 'Submit Request'}
              </button>
            </form>

            <div style={s.footer}>
              <Link to="/corporate/login" style={s.footerLink}>
                Already have an account? Sign in →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
