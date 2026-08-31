// src/pages/BookingPaymentFailed.jsx
// iKhokha redirects the guest here when payment is declined or cancelled.
// We give a friendly explanation and let the guest retry by going back to checkout,
// or contact support if they think they were incorrectly charged.

import { useSearchParams, Link, useNavigate } from 'react-router-dom'

export default function BookingPaymentFailed() {
  const [searchParams] = useSearchParams()
  const bookingId      = searchParams.get('id')
  const navigate       = useNavigate()

  function handleRetry() {
    // Send the guest back to checkout.
    // The Checkout page reads HyperGuest rates fresh, so they start a clean attempt.
    // The old pending hg_bookings row will simply stay as 'unpaid' in the DB — harmless.
    navigate('/checkout')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* BLY logo strip */}
        <div style={styles.logoStrip}>
          <span style={styles.logo}>BLY</span>
          <span style={styles.logoSub}>travel</span>
        </div>

        {/* Icon */}
        <div style={styles.iconCircle}>✕</div>

        <h1 style={styles.heading}>Payment was not completed</h1>

        <p style={styles.body}>
          No money was taken from your account. Your card was either declined
          or you cancelled the payment — either way, your booking has{' '}
          <strong>not been confirmed</strong>.
        </p>

        <p style={styles.body}>
          You can try again with a different card, or contact us if you believe
          your bank has charged you in error.
        </p>

        {/* Common reasons box */}
        <div style={styles.reasonBox}>
          <p style={styles.reasonTitle}>Common reasons for a failed payment</p>
          <ul style={styles.reasonList}>
            <li>Insufficient funds</li>
            <li>Card not enabled for online transactions</li>
            <li>Incorrect card number, expiry, or CVV</li>
            <li>Bank declined the transaction for security reasons</li>
          </ul>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={handleRetry} style={styles.btnPrimary}>
            Try again
          </button>
          <a
            href={`mailto:bookings@blytravel.co.za?subject=Payment%20issue%20ref%20${bookingId ?? ''}`}
            style={styles.btnSecondary}
          >
            Email support
          </a>
          <Link to="/" style={styles.btnGhost}>
            Back to home
          </Link>
        </div>

        {bookingId && (
          <p style={styles.refNote}>
            Your reference: <span style={styles.refCode}>{bookingId}</span>
          </p>
        )}

      </div>
    </div>
  )
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
    maxWidth: '460px',
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
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#2a1010',
    border: '2px solid #EF4056',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontSize: '1.3rem',
    color: '#EF4056',
    lineHeight: 1,
    fontWeight: 700,
  },
  heading: {
    color: '#F5F0E8',
    fontSize: '1.3rem',
    fontWeight: 800,
    marginBottom: '0.75rem',
    lineHeight: 1.3,
  },
  body: {
    color: '#999',
    fontSize: '0.9rem',
    lineHeight: 1.65,
    margin: '0 0 1rem',
  },
  reasonBox: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    marginBottom: '1.75rem',
    textAlign: 'left',
  },
  reasonTitle: {
    color: '#888',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.5rem',
    fontWeight: 600,
  },
  reasonList: {
    margin: 0,
    padding: '0 0 0 1.2rem',
    color: '#777',
    fontSize: '0.85rem',
    lineHeight: 1.8,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  btnPrimary: {
    display: 'block',
    width: '100%',
    background: '#EF4056',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '0.03em',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    display: 'block',
    background: 'transparent',
    color: '#C8A96E',
    textDecoration: 'none',
    borderRadius: '8px',
    padding: '0.7rem 1.5rem',
    fontWeight: 600,
    fontSize: '0.88rem',
    border: '1px solid #C8A96E44',
  },
  btnGhost: {
    display: 'block',
    background: 'transparent',
    color: '#666',
    textDecoration: 'none',
    borderRadius: '8px',
    padding: '0.7rem 1.5rem',
    fontWeight: 500,
    fontSize: '0.85rem',
    border: '1px solid #333',
  },
  refNote: {
    color: '#555',
    fontSize: '0.75rem',
    margin: 0,
  },
  refCode: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
  },
}
