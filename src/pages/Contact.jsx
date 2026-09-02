import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'var(--font-body)',
  },
  hero: {
    borderBottom: '1px solid var(--border)',
    padding: '72px 40px 56px',
  },
  heroInner: {
    maxWidth: 760,
    margin: '0 auto',
  },
  eyebrow: {
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    marginBottom: 16,
  },
  h1: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 'clamp(36px, 5vw, 56px)',
    lineHeight: 1.08,
    letterSpacing: '-1.5px',
    margin: '0 0 20px',
    color: 'var(--text)',
  },
  subtitle: {
    fontSize: 17,
    color: 'var(--text-muted)',
    fontWeight: 300,
    lineHeight: 1.6,
    margin: 0,
  },
  body: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '56px 40px 96px',
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 64,
    alignItems: 'start',
  },
  formSection: {},
  sectionLabel: {
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 24,
  },
  field: { marginBottom: 20 },
  label: {
    display: 'block',
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--text)',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 15,
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'var(--font-body)',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 15,
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 140,
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: 99,
    background: 'var(--text)',
    color: '#fff',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    border: 'none',
    marginTop: 8,
    transition: 'opacity 0.15s',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  successBox: {
    background: 'var(--accent-light)',
    borderRadius: 12,
    padding: '20px 24px',
    marginTop: 8,
  },
  successTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--accent)',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: 'var(--text-muted)',
  },
  sidebar: {},
  contactCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '28px 24px',
    marginBottom: 16,
  },
  contactLabel: {
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 12,
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    textDecoration: 'none',
    color: 'var(--text)',
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: 'var(--accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 16,
  },
  contactMeta: {},
  contactMetaLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contactMetaValue: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text)',
  },
  hoursCard: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '28px 24px',
  },
  hoursRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottom: '1px solid var(--border)',
  },
  hoursRowLast: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
  },
  hoursDay: { color: 'var(--text-muted)' },
  hoursTime: { fontWeight: 600, color: 'var(--text)' },
}

export default function Contact() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const valid = form.name.trim() && form.email.includes('@') && form.message.trim().length > 5

  async function handleSubmit(e) {
    e.preventDefault()
    if (!valid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please email us directly at Info@blytravel.co.za')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <div style={S.eyebrow}>Get in touch</div>
          <h1 style={S.h1}>We'd love to<br />hear from you.</h1>
          <p style={S.subtitle}>
            Questions about a booking, a destination, or just want to say hello?
            Drop us a message and we'll get back to you.
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        {/* Form */}
        <div style={S.formSection}>
          <div style={S.sectionLabel}>Send a message</div>

          {submitted ? (
            <div style={S.successBox}>
              <div style={S.successTitle}>Message received ✓</div>
              <div style={S.successText}>
                Thanks, {form.name.split(' ')[0]}! We'll get back to you at {form.email} as soon as we can.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={S.field}>
                <label style={S.label}>Your name</label>
                <input
                  style={S.input}
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Email address</label>
                <input
                  style={S.input}
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Message</label>
                <textarea
                  style={S.textarea}
                  placeholder="Tell us how we can help…"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>
              {error && (
                <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 12 }}>{error}</div>
              )}
              <button
                type="submit"
                style={{ ...S.btn, ...((!valid || submitting) ? S.btnDisabled : {}) }}
                disabled={!valid || submitting}
              >
                {submitting ? 'Sending…' : 'Send message →'}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sectionLabel}>Contact details</div>
          <div style={S.contactCard}>
            <a href="mailto:Info@blytravel.co.za" style={S.contactItem}>
              <div style={S.contactIcon}>✉️</div>
              <div style={S.contactMeta}>
                <div style={S.contactMetaLabel}>Email</div>
                <div style={S.contactMetaValue}>Info@blytravel.co.za</div>
              </div>
            </a>
            <a href="https://wa.me/27793825684" style={{ ...S.contactItem, marginBottom: 0 }}>
              <div style={S.contactIcon}>💬</div>
              <div style={S.contactMeta}>
                <div style={S.contactMetaLabel}>WhatsApp</div>
                <div style={S.contactMetaValue}>+27 79 382 5684</div>
              </div>
            </a>
          </div>

          <div style={S.hoursCard}>
            <div style={S.contactLabel}>Office hours</div>
            <div style={S.hoursRow}>
              <span style={S.hoursDay}>Monday – Friday</span>
              <span style={S.hoursTime}>08:00 – 17:00</span>
            </div>
            <div style={S.hoursRow}>
              <span style={S.hoursDay}>Saturday</span>
              <span style={S.hoursTime}>09:00 – 13:00</span>
            </div>
            <div style={S.hoursRowLast}>
              <span style={S.hoursDay}>Sunday</span>
              <span style={S.hoursTime}>Closed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
