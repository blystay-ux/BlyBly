import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateGuestPrice } from '../lib/pricing'

function addNights(dateStr, nights) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}

function emptyGuest() {
  return { firstName: '', lastName: '' }
}

function emptyLeadGuest() {
  return {
    firstName: '', lastName: '', title: 'MR', birthDate: '',
    email: '', phone: '', address: '', city: '', state: '', zip: '', country: 'ZA',
  }
}

const s = {
  page: { maxWidth: 640, margin: '0 auto', padding: '0 0 100px' },
  topBar: {
    position: 'sticky', top: 'var(--nav-height)', zIndex: 10,
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
    padding: '16px 24px',
  },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', marginBottom: 4 },
  hotelName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)' },
  hotelMeta: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  content: { padding: '20px 24px 0' },
  summaryCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', marginBottom: 24 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' },
  summaryTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, paddingTop: 10, marginTop: 6, borderTop: '1px dashed var(--border)', color: 'var(--text)' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 8, marginBottom: 12, letterSpacing: '-0.3px', color: 'var(--text)' },
  formLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, marginTop: 12, display: 'block' },
  formInput: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' },
  formTextarea: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box', minHeight: 70 },
  formRow: { display: 'flex', gap: 8 },
  guestBlock: { marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' },
  ctaBar: {
    position: 'sticky', bottom: 0, zIndex: 10,
    background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
    padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 32,
  },
  ctaBtn: { flexShrink: 0, padding: '13px 28px', borderRadius: 99, background: '#ef4056', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' },
  ctaBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  errorBox: { background: '#FDEBEC', color: '#ef4056', fontSize: 13, fontWeight: 600, padding: '10px 14px', borderRadius: 10, marginTop: 12 },
  confirmBox: { background: 'var(--bg-card)', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', margin: '40px 24px' },
}

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()

  const { property, selectedOffer, prebookResult, checkIn, nights, adults } = location.state || {}

  const [leadGuest, setLeadGuest] = useState(emptyLeadGuest())
  const [roomGuests, setRoomGuests] = useState(
    property && adults ? Array.from({ length: adults }, emptyGuest) : []
  )
  const [specialRequests, setSpecialRequests] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [bookingError, setBookingError] = useState(null)
  const [agencyReference, setAgencyReference] = useState(null)

  if (!property || !selectedOffer || !prebookResult) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 20 }}>
          This checkout session isn't available directly — please start from the hotel page.
        </p>
        <button onClick={() => navigate('/')} style={{ background: '#ef4056', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          ← Back to home
        </button>
      </div>
    )
  }

  const info = property.propertyInfo
  const confirmedRoom = prebookResult.content?.rooms?.[0]
  const net = confirmedRoom?.prices?.net ?? selectedOffer.plan.prices?.net
  const sell = confirmedRoom?.prices?.sell ?? selectedOffer.plan.prices?.sell
  // Guest-facing price only -- see src/lib/pricing.js for the Net/Sell
  // logic. `net` above still separately feeds expectedPrice sent to
  // HyperGuest (always Net), unaffected by this display calculation.
  const guestPrice = sell ? calculateGuestPrice(net?.price ?? sell.price, sell.price, sell.currency) : null

  function updateLeadGuest(field, value) {
    setLeadGuest(prev => ({ ...prev, [field]: value }))
  }
  function updateRoomGuest(idx, field, value) {
    setRoomGuests(prev => prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)))
  }
  function leadGuestValid() {
    return leadGuest.firstName && leadGuest.lastName && leadGuest.birthDate && leadGuest.email && leadGuest.phone
      && leadGuest.address && leadGuest.city && leadGuest.state && leadGuest.zip && leadGuest.country
  }
  function roomGuestsValid() {
    return roomGuests.every(g => g.firstName && g.lastName)
  }

  async function handleBook() {
    setBooking(true)
    setBookingError(null)
    const ref = `BLY-${Date.now()}`
    // expectedPrice sent to HyperGuest is ALWAYS the Net rate, per their
    // explicit guidance (2026-08-17). Never change this to sell without
    // re-confirming with HyperGuest first.
    const priceForHyperGuest = net || sell
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-book', {
        body: {
          propertyId: property.propertyId,
          checkIn,
          checkOut: addNights(checkIn, nights),
          agencyReference: ref,
          leadGuest,
          rooms: [{
            roomId: selectedOffer.room.roomId,
            ratePlanId: selectedOffer.plan.ratePlanId,
            expectedPrice: { amount: priceForHyperGuest.price, currency: priceForHyperGuest.currency },
            guests: roomGuests,
            ...(specialRequests ? { specialRequests: [specialRequests] } : {}),
          }],
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setAgencyReference(ref)
      setBookingResult(data)

      // Best-effort confirmation email -- deliberately does NOT block or
      // fail the booking flow if it errors. The booking already succeeded
      // by this point; email is a nice-to-have on top, not a dependency.
      supabase.functions.invoke('hyperguest-send-confirmation-email', {
        body: {
          to: leadGuest.email,
          guestName: `${leadGuest.firstName} ${leadGuest.lastName}`,
          agencyReference: ref,
          hyperguestBookingId: data.content?.bookingId,
          hotelName: info.name,
          checkIn,
          checkOut: addNights(checkIn, nights),
          roomName: selectedOffer.room.roomName,
          ratePlanName: selectedOffer.plan.ratePlanName,
          totalPrice: sell.price,
          currency: sell.currency,
        },
      }).catch(err => console.error('Confirmation email failed (booking still succeeded):', err))
    } catch (err) {
      console.error('Booking failed:', err)
      setBookingError(err.message || 'Something went wrong completing this booking. Please try again, or contact support.')
    }
    setBooking(false)
  }

  if (bookingResult) {
    const content = bookingResult.content
    return (
      <main>
        <div style={s.confirmBox}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✓</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8, color: 'var(--text)' }}>
            Booking confirmed!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Confirmation sent to {leadGuest.email}
          </p>
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: 20, textAlign: 'left', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Booking reference</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{agencyReference}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Status</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{content?.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: specialRequests ? 8 : 0 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Dates</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{checkIn} → {addNights(checkIn, nights)}</span>
            </div>
            {specialRequests && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Special request</span>
                <span style={{ fontWeight: 700, fontSize: 13, textAlign: 'right', maxWidth: 220 }}>{specialRequests}</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Save your booking reference above — you'll need it to manage or cancel this booking.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/')} style={{ background: 'var(--text)', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Back to home
            </button>
            <button onClick={() => navigate('/manage-booking')} style={{ background: 'none', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Manage or cancel booking
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.back} onClick={() => navigate(-1)}>← Back to room selection</button>
          <div style={s.hotelName}>{info.name}</div>
          <div style={s.hotelMeta}>{selectedOffer.room.roomName} — {selectedOffer.plan.ratePlanName}</div>
        </div>

        <div style={s.content}>
          <div style={s.summaryCard}>
            <div style={s.summaryRow}><span>Dates</span><span>{checkIn} → {addNights(checkIn, nights)}</span></div>
            <div style={s.summaryRow}><span>Guests</span><span>{adults} {adults === 1 ? 'adult' : 'adults'}</span></div>
            <div style={s.summaryRow}><span>Board</span><span>{selectedOffer.plan.board}</span></div>
            <div style={s.summaryTotal}><span>Total</span><span>{guestPrice?.currency} {Number(guestPrice?.totalAmount).toLocaleString()}</span></div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>Taxes and fees included</div>
          </div>

          <div style={s.sectionTitle}>Your details</div>
          <div style={s.formRow}>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>First name</label>
              <input style={s.formInput} value={leadGuest.firstName} onChange={e => updateLeadGuest('firstName', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>Last name</label>
              <input style={s.formInput} value={leadGuest.lastName} onChange={e => updateLeadGuest('lastName', e.target.value)} />
            </div>
          </div>
          <div style={s.formRow}>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>Date of birth</label>
              <input type="date" style={s.formInput} value={leadGuest.birthDate} onChange={e => updateLeadGuest('birthDate', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>Title</label>
              <select style={s.formInput} value={leadGuest.title} onChange={e => updateLeadGuest('title', e.target.value)}>
                <option value="MR">Mr</option>
                <option value="MRS">Mrs</option>
                <option value="MS">Ms</option>
              </select>
            </div>
          </div>
          <div style={s.formRow}>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>Email</label>
              <input type="email" style={s.formInput} value={leadGuest.email} onChange={e => updateLeadGuest('email', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>Phone</label>
              <input style={s.formInput} value={leadGuest.phone} onChange={e => updateLeadGuest('phone', e.target.value)} />
            </div>
          </div>
          <label style={s.formLabel}>Address</label>
          <input style={s.formInput} value={leadGuest.address} onChange={e => updateLeadGuest('address', e.target.value)} />
          <div style={s.formRow}>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>City</label>
              <input style={s.formInput} value={leadGuest.city} onChange={e => updateLeadGuest('city', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>State/Province</label>
              <input style={s.formInput} value={leadGuest.state} onChange={e => updateLeadGuest('state', e.target.value)} />
            </div>
          </div>
          <div style={s.formRow}>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>Zip/Postal code</label>
              <input style={s.formInput} value={leadGuest.zip} onChange={e => updateLeadGuest('zip', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.formLabel}>Country code</label>
              <input style={s.formInput} value={leadGuest.country} onChange={e => updateLeadGuest('country', e.target.value.toUpperCase())} maxLength={2} placeholder="ZA" />
            </div>
          </div>

          <div style={s.guestBlock}>
            <div style={{ ...s.sectionTitle, marginTop: 0, fontSize: 16 }}>Guest names ({roomGuests.length})</div>
            {roomGuests.map((g, i) => (
              <div key={i} style={s.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={s.formLabel}>Guest {i + 1} first name</label>
                  <input style={s.formInput} value={g.firstName} onChange={e => updateRoomGuest(i, 'firstName', e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.formLabel}>Guest {i + 1} last name</label>
                  <input style={s.formInput} value={g.lastName} onChange={e => updateRoomGuest(i, 'lastName', e.target.value)} />
                </div>
              </div>
            ))}
          </div>

          <div style={s.guestBlock}>
            <label style={s.formLabel}>Special requests (optional)</label>
            <textarea
              style={s.formTextarea}
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="e.g. Non-smoking room, high floor, late check-in"
            />
          </div>

          {bookingError && <div style={s.errorBox}>{bookingError}</div>}
        </div>

        <div style={s.ctaBar}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{guestPrice?.currency} {Number(guestPrice?.totalAmount).toLocaleString()}</div>
          <button
            style={{ ...s.ctaBtn, ...(!leadGuestValid() || !roomGuestsValid() || booking ? s.ctaBtnDisabled : {}) }}
            disabled={!leadGuestValid() || !roomGuestsValid() || booking}
            onClick={handleBook}
          >
            {booking ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      </div>
    </main>
  )
}
