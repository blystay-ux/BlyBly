// src/pages/BookingSuccess.jsx
// iKhokha redirects the guest here after a successful payment.
// The webhook fires asynchronously, so we poll hg_bookings until
// status === 'Confirmed' (or we hit the timeout / a failed status).

import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const MAX_POLLS  = 24   // 24 × 5 s = 2 minutes
const POLL_MS    = 5000

export default function BookingSuccess() {
  const [searchParams]   = useSearchParams()
  const bookingId        = searchParams.get('id')

  const [booking,  setBooking]  = useState(null)
  const [phase,    setPhase]    = useState('polling')  // 'polling' | 'confirmed' | 'failed' | 'timeout' | 'notfound'
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!bookingId) { setPhase('notfound'); return }

    let stopped = false
    let timer

    async function poll() {
      if (stopped) return

      const { data, error } = await supabase
        .from('hg_bookings')
        .select('id, status, payment_status, check_in, check_out, meta, hyperguest_booking_id, guest_email, checkout_payload')
        .eq('id', bookingId)
        .single()

      if (error || !data) { setPhase('notfound'); return }

      setAttempts(a => a + 1)

      if (data.status === 'Confirmed') {
        setBooking(data)
        setPhase('confirmed')
        return
      }

      if (data.status === 'Failed') {
        setBooking(data)
        setPhase('failed')
        return
      }

      // Still Pending — keep polling
      if (attempts + 1 >= MAX_POLLS) {
        setBooking(data)
        setPhase('timeout')
        return
      }

      timer = setTimeout(poll, POLL_MS)
    }

    poll()
    return () => { stopped = true; clearTimeout(timer) }
  }, [bookingId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────
  const hotelName  = booking?.meta?.hotelName ?? 'your hotel'
  const checkIn    = booking?.check_in  ? formatDate(booking.check_in)  : '—'
  const checkOut   = booking?.check_out ? formatDate(booking.check_out) : '—'
  const lg         = booking?.checkout_payload?.leadGuest ?? {}
  const guestName  = [lg.firstName, lg.lastName].filter(Boolean).join(' ') || 'Guest'
  const hgRef      = booking?.hyperguest_booking_id ?? '—'
  const agencyRef  = booking?.checkout_payload?.agencyReference ?? '—'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* BLY logo strip */}
        <div style={styles.logoStrip}>
          <span style={styles.logo}>BLY</span>
          <span style={styles.logoSub}>travel</span>
        </div>

        {/* ── POLLING ── */}
        {phase === 'polling' && (
          <>
            <div style={styles.spinner} aria-label="Loading" />
            <h1 style={styles.heading}>Payment received — confirming your booking…</h1>
            <p style={styles.body}>
              We're confirming your reservation with the hotel right now.
              This usually takes under 30 seconds. <strong>Please don't close this page.</strong>
            </p>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${Math.min((attempts / MAX_POLLS) * 100, 95)}%`,
                  transition: 'width 4.5s linear',
                }}
              />
            </div>
            <p style={styles.hint}>Attempt {attempts + 1} of {MAX_POLLS}…</p>
          </>
        )}

        {/* ── CONFIRMED ── */}
        {phase === 'confirmed' && (
          <>
            <div style={styles.checkCircle}>✓</div>
            <h1 style={styles.headingGreen}>Booking confirmed!</h1>
            <p style={styles.body}>
              Thank you, <strong>{guestName}</strong>. Your stay at{' '}
              <strong>{hotelName}</strong> is confirmed. A confirmation email
              has been sent to <strong>{booking?.guest_email}</strong>.
            </p>

            <div style={styles.detailBox}>
              <DetailRow label="Hotel"       value={hotelName} />
              <DetailRow label="Check-in"    value={checkIn} />
              <DetailRow label="Check-out"   value={checkOut} />
              <DetailRow label="Booking ref" value={agencyRef} />
              {hgRef !== '—' && <DetailRow label="HyperGuest ref" value={hgRef} />}
            </div>

            <div style={styles.actions}>
              <Link to="/my-bookings" style={styles.btnPrimary}>View my bookings</Link>
              <Link to="/"            style={styles.btnSecondary}>Back to home</Link>
            </div>
          </>
        )}

        {/* ── FAILED (HyperGuest confirm failed after payment) ── */}
        {phase === 'failed' && (
          <>
            <div style={styles.warnCircle}>!</div>
            <h1 style={styles.headingWarn}>Payment received — manual review needed</h1>
            <p style={styles.body}>
              Your payment was successful, but we hit a snag confirming with the hotel.
              Our team has been alerted and will contact you within 2 hours to resolve this.
              Your reference number is <strong>{agencyRef}</strong>.
            </p>
            <div style={styles.actions}>
              <a href="mailto:bookings@blytravel.co.za" style={styles.btnPrimary}>
                Email us
              </a>
              <Link to="/" style={styles.btnSecondary}>Back to home</Link>
            </div>
          </>
        )}

        {/* ── TIMEOUT (webhook too slow / still pending) ── */}
        {phase === 'timeout' && (
          <>
            <div style={styles.warnCircle}>⏱</div>
            <h1 style={styles.headingWarn}>Taking longer than expected…</h1>
            <p style={styles.body}>
              Your payment was received (ref: <strong>{agencyRef}</strong>), but the
              hotel confirmation is still processing. You'll receive a confirmation
              email shortly. If you don't hear from us within 30 minutes, please
              contact us.
            </p>
            <div style={styles.actions}>
              <a href="mailto:bookings@blytravel.co.za" style={styles.btnPrimary}>
                Contact support
              </a>
              <Link to="/my-bookings" style={styles.btnSecondary}>My bookings</Link>
            </div>
          </>
        )}

        {/* ── NOT FOUND ── */}
        {phase === 'notfound' && (
          <>
            <div style={styles.warnCircle}>?</div>
            <h1 style={styles.headingWarn}>Booking not found</h1>
            <p style={styles.body}>
              We couldn't find this booking. If you just paid, please check your email
              for a confirmation, or contact us with your payment reference.
            </p>
            <div style={styles.actions}>
              <a href="mailto:bookings@blytravel.co.za" style={styles.btnPrimary}>
                Contact us
              </a>
              <Link to="/" style={styles.btnSecondary}>Back to home</Link>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0D0D0D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  logoStrip: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '4px',
    marginBottom: '2rem',
  },
  logo: {
    fontWeight: 800,
    fontSize: '1.6rem',
    letterSpacing: '0.12em',
    color: '#EF4056',
  },
  logoSub: {
    fontSize: '0.75rem',
    letterSpacing: '0.2em',
    color: '#C8A96E',
    textTransform: 'uppercase',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '3px solid #2A2A2A',
    borderTop: '3px solid #EF4056',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
    margin: '0 auto 1.5rem',
  },
  progressBar: {
    height: '4px',
    background: '#2A2A2A',
    borderRadius: '2px',
    margin: '1.5rem 0 0.5rem',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #EF4056, #C8A96E)',
    borderRadius: '2px',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#555',
    margin: 0,
  },
  checkCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#1a3a2a',
    border: '2px solid #2ecc71',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontSize: '1.5rem',
    color: '#2ecc71',
    lineHeight: 1,
    // inline element — we'll do it as text
  },
  warnCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#2a2010',
    border: '2px solid #C8A96E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontSize: '1.5rem',
    color: '#C8A96E',
    lineHeight: 1,
  },
  heading: {
    color: '#F5F0E8',
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
    lineHeight: 1.35,
  },
  headingGreen: {
    color: '#2ecc71',
    fontSize: '1.4rem',
    fontWeight: 800,
    marginBottom: '0.75rem',
  },
  headingWarn: {
    color: '#C8A96E',
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '0.75rem',
    lineHeight: 1.35,
  },
  body: {
    color: '#999',
    fontSize: '0.9rem',
    lineHeight: 1.65,
    margin: '0 0 1.5rem',
  },
  detailBox: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    marginBottom: '1.75rem',
    textAlign: 'left',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.4rem 0',
    borderBottom: '1px solid #1e1e1e',
  },
  detailLabel: {
    color: '#666',
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailValue: {
    color: '#F5F0E8',
    fontSize: '0.88rem',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  btnPrimary: {
    display: 'block',
    background: '#EF4056',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '0.03em',
  },
  btnSecondary: {
    display: 'block',
    background: 'transparent',
    color: '#888',
    textDecoration: 'none',
    borderRadius: '8px',
    padding: '0.7rem 1.5rem',
    fontWeight: 600,
    fontSize: '0.88rem',
    border: '1px solid #333',
  },
}

// Inject keyframe animation once
if (typeof document !== 'undefined' && !document.getElementById('bly-spin-style')) {
  const s = document.createElement('style')
  s.id = 'bly-spin-style'
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(s)
}
