import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s = {
  page: { minHeight: 'calc(100vh - var(--nav-height))', background: 'var(--bg)', padding: '48px 24px' },
  inner: { maxWidth: 520, margin: '0 auto' },
  eyebrow: { fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' },
  h1: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.04em', marginTop: 4, marginBottom: 8, color: 'var(--text)' },
  sub: { color: 'var(--text-muted)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 },
  card: { background: 'var(--bg-card)', borderRadius: 20, padding: 28, boxShadow: '0 4px 32px rgba(0,0,0,0.06)' },
  formLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, marginTop: 12, display: 'block' },
  formInput: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' },
  btn: { width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 99, background: 'var(--text)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' },
  btnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  errorBox: { background: '#FDEBEC', color: '#ef4056', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 10, marginTop: 14 },

  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px dashed var(--border)' },
  statusPill: (status) => ({
    display: 'inline-block', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
    background: status === 'Cancelled' ? '#FDEBEC' : status === 'Confirmed' ? '#E7F6EC' : '#FEF3E2',
    color: status === 'Cancelled' ? '#ef4056' : status === 'Confirmed' ? '#1a7f37' : '#b45309',
  }),
  cancelBtn: { width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 99, background: '#ef4056', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' },
  confirmedBox: { textAlign: 'center', padding: '20px 0' },
}

export default function ManageBooking() {
  const navigate = useNavigate()

  const [agencyReference, setAgencyReference] = useState('')
  const [email, setEmail] = useState('')
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState(null)
  const [booking, setBooking] = useState(null)

  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const [cancelResult, setCancelResult] = useState(null)

  async function handleLookup() {
    setLooking(true)
    setLookupError(null)
    setBooking(null)
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-booking-lookup', {
        body: { agencyReference: agencyReference.trim(), email: email.trim() },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setBooking(data.booking)
    } catch (err) {
      setLookupError(err.message || 'Something went wrong looking up your booking.')
    }
    setLooking(false)
  }

  async function handleCancel() {
    if (!booking) return
    setCancelling(true)
    setCancelError(null)
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-cancel', {
        body: { bookingId: booking.id, reason: reason.trim() || 'Guest requested cancellation', simulation: false },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setCancelResult(data)
    } catch (err) {
      setCancelError(err.message || 'Something went wrong cancelling your booking. Please contact support.')
    }
    setCancelling(false)
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <p style={s.eyebrow}>Manage your booking</p>
        <h1 style={s.h1}>Find your reservation<span style={{ color: 'var(--accent)' }}>.</span></h1>
        <p style={s.sub}>Enter your booking reference and the email you booked with — no account needed. Your booking reference was shown on your confirmation screen.</p>

        {!booking && (
          <div style={s.card}>
            <label style={s.formLabel}>Booking reference</label>
            <input style={s.formInput} value={agencyReference} onChange={e => setAgencyReference(e.target.value)} placeholder="BLY-1786..." />
            <label style={s.formLabel}>Email address</label>
            <input type="email" style={s.formInput} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <button
              style={{ ...s.btn, ...(!agencyReference || !email || looking ? s.btnDisabled : {}) }}
              disabled={!agencyReference || !email || looking}
              onClick={handleLookup}
            >
              {looking ? 'Looking up…' : 'Find my booking'}
            </button>
            {lookupError && <div style={s.errorBox}>{lookupError}</div>}
          </div>
        )}

        {booking && !cancelResult && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{booking.agencyReference}</div>
              <span style={s.statusPill(booking.status)}>{booking.status}</span>
            </div>
            <div style={s.summaryRow}><span>Guest</span><span>{booking.leadGuestName}</span></div>
            <div style={s.summaryRow}><span>Check-in</span><span>{booking.checkIn}</span></div>
            <div style={s.summaryRow}><span>Check-out</span><span>{booking.checkOut}</span></div>
            {booking.prices?.sell && (
              <div style={s.summaryRow}><span>Total</span><span>{booking.prices.sell.currency} {Number(booking.prices.sell.price).toLocaleString()}</span></div>
            )}

            {booking.status !== 'Cancelled' ? (
              <>
                <label style={s.formLabel}>Reason for cancelling (optional)</label>
                <input style={s.formInput} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Change of plans" />
                <button
                  style={{ ...s.cancelBtn, ...(cancelling ? s.btnDisabled : {}) }}
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel this booking'}
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
                  Cancellation policy and any applicable penalty apply as shown at the time of booking.
                </p>
                {cancelError && <div style={s.errorBox}>{cancelError}</div>}
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>This booking has already been cancelled.</p>
            )}

            <button
              onClick={() => { setBooking(null); setAgencyReference(''); setEmail('') }}
              style={{ width: '100%', marginTop: 12, padding: '10px 0', borderRadius: 99, background: 'none', border: '1.5px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
            >
              ← Look up a different booking
            </button>
          </div>
        )}

        {cancelResult && (
          <div style={s.card}>
            <div style={s.confirmedBox}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>✓</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Booking cancelled</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {cancelResult.content?.cancelSimulation
                  ? 'Preview only — no charge was made.'
                  : 'Your reservation has been cancelled. Any applicable penalty was charged per the rate plan\'s cancellation policy.'}
              </p>
              <button onClick={() => navigate('/')} style={{ marginTop: 20, background: 'var(--text)', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                Back to home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
