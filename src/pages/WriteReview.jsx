import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { key: 'rating',             label: 'Overall',     emoji: '⭐' },
  { key: 'cleanliness_rating', label: 'Cleanliness', emoji: '🧹' },
  { key: 'location_rating',    label: 'Location',    emoji: '📍' },
  { key: 'value_rating',       label: 'Value',       emoji: '💰' },
  { key: 'service_rating',     label: 'Service',     emoji: '🤝' },
]

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 30, padding: '2px 3px', lineHeight: 1,
            color: n <= (hover || value) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#F8F7F5', padding: '48px 20px 80px' },
  card: {
    maxWidth: 560, margin: '0 auto', background: '#fff',
    borderRadius: 24, padding: '36px 40px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  },
  eyebrow: {
    fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
    color: '#ef4056', textTransform: 'uppercase', marginBottom: 8,
  },
  heading: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30,
    letterSpacing: '-0.05em', color: '#1a1a2e', lineHeight: 1.1, marginBottom: 4,
  },
  sub: { fontSize: 14, color: '#888', marginBottom: 28 },
  catRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '13px 0', borderBottom: '1px solid #f0ede8',
  },
  catLabel: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 600, color: '#222' },
  textarea: {
    width: '100%', borderRadius: 14, border: '1.5px solid #e2e0db',
    padding: '14px 16px', fontSize: 14, fontFamily: 'var(--font-body)',
    resize: 'vertical', minHeight: 110, boxSizing: 'border-box',
    outline: 'none', marginTop: 22, color: '#333', lineHeight: 1.6,
  },
  primaryBtn: {
    marginTop: 22, width: '100%', padding: '15px',
    borderRadius: 99, background: '#ef4056', color: '#fff',
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: 15, border: 'none', cursor: 'pointer',
  },
  secondaryBtn: {
    marginTop: 10, width: '100%', padding: '13px',
    borderRadius: 99, background: 'transparent', color: '#888',
    fontWeight: 600, fontSize: 14,
    border: '1.5px solid #e2e0db', cursor: 'pointer',
  },
  error: {
    background: '#fee2e2', color: '#dc2626', borderRadius: 10,
    padding: '10px 14px', fontSize: 13, marginTop: 14,
  },
}

export default function WriteReview() {
  const { hgBookingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [booking, setBooking] = useState(null)
  const [hotelName, setHotelName] = useState('')
  const [verifyError, setVerifyError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const [ratings, setRatings] = useState({
    rating: 0,
    cleanliness_rating: 0,
    location_rating: 0,
    value_rating: 0,
    service_rating: 0,
  })
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    verify()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hgBookingId])

  async function verify() {
    setLoading(true)

    const { data: bk, error } = await supabase
      .from('hg_bookings')
      .select('id, guest_email, check_in, check_out, hyperguest_property_id, hotel_id, lead_guest, agency_reference')
      .eq('id', hgBookingId)
      .single()

    if (error || !bk) {
      setVerifyError('Booking not found.')
      setLoading(false)
      return
    }
    if (bk.guest_email?.toLowerCase() !== user.email?.toLowerCase()) {
      setVerifyError('This booking is not linked to your account.')
      setLoading(false)
      return
    }
    if (new Date(bk.check_out) >= new Date()) {
      setVerifyError(`Reviews can only be submitted after your stay. Your check-out is ${new Date(bk.check_out).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}.`)
      setLoading(false)
      return
    }

    setBooking(bk)

    // Check for existing review
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('hg_booking_id', hgBookingId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      setAlreadyReviewed(true)
      setLoading(false)
      return
    }

    // Fetch hotel name
    if (bk.hyperguest_property_id) {
      const { data: prop } = await supabase
        .from('hg_property_index')
        .select('name')
        .eq('hotel_id', bk.hyperguest_property_id)
        .maybeSingle()
      if (prop?.name) setHotelName(prop.name)
    }

    setLoading(false)
  }

  async function submit() {
    if (Object.values(ratings).some(v => v === 0)) {
      setSubmitError('Please rate all categories before submitting.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const reviewerName =
      profile?.full_name ||
      (user.email?.split('@')[0] || 'Guest')
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())

    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      hotel_id: booking.hotel_id,
      hg_booking_id: booking.id,
      hyperguest_property_id: booking.hyperguest_property_id,
      reviewer_name: reviewerName,
      comment: comment.trim() || null,
      status: 'pending',
      ...ratings,
    })

    if (error) {
      setSubmitError(error.message || 'Failed to submit. Please try again.')
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return <div style={{ ...s.page, textAlign: 'center', paddingTop: 100, color: '#888', fontSize: 15 }}>Loading…</div>
  }

  if (verifyError) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8, color: '#1a1a2e' }}>Can't submit this review</div>
          <div style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>{verifyError}</div>
          <button onClick={() => navigate('/my-bookings')} style={{ ...s.primaryBtn, background: '#111' }}>
            ← Back to my bookings
          </button>
        </div>
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8, color: '#1a1a2e' }}>Review already submitted</div>
          <div style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
            You've already left a review for this stay. It will appear on the property page once approved.
          </div>
          <button onClick={() => navigate('/my-bookings')} style={{ ...s.primaryBtn, background: '#111' }}>
            ← Back to my bookings
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🙏</div>
          <div style={s.eyebrow}>Thank you!</div>
          <div style={s.heading}>Review submitted<span style={{ color: '#ef4056' }}>.</span></div>
          <div style={{ color: '#666', marginTop: 12, marginBottom: 28, lineHeight: 1.65 }}>
            Your review is pending approval and will appear on the property page shortly. We appreciate you sharing your experience.
          </div>
          <button onClick={() => navigate('/my-bookings')} style={{ ...s.primaryBtn, background: '#111' }}>
            ← Back to my bookings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.eyebrow}>Share your experience</div>
        <div style={s.heading}>Leave a review<span style={{ color: '#ef4056' }}>.</span></div>
        {hotelName && booking && (
          <div style={s.sub}>
            {hotelName} · checked out {new Date(booking.check_out).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}

        <div>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.key}
              style={{ ...s.catRow, ...(i === CATEGORIES.length - 1 ? { borderBottom: 'none' } : {}) }}
            >
              <div style={s.catLabel}>
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </div>
              <StarPicker
                value={ratings[cat.key]}
                onChange={v => setRatings(prev => ({ ...prev, [cat.key]: v }))}
              />
            </div>
          ))}
        </div>

        <textarea
          style={s.textarea}
          placeholder="Tell us about your stay — what did you love? Anything that could be better? (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        {submitError && <div style={s.error}>{submitError}</div>}

        <button
          style={{ ...s.primaryBtn, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>

        <button
          onClick={() => navigate('/my-bookings')}
          style={s.secondaryBtn}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
