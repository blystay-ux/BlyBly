import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'

function addNights(dateStr, nights) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}

function flattenOffers(property) {
  const offers = []
  for (const room of property.rooms ?? []) {
    for (const plan of room.ratePlans ?? []) {
      offers.push({ room, plan })
    }
  }
  return offers.sort((a, b) => (a.plan.prices?.sell?.price ?? 0) - (b.plan.prices?.sell?.price ?? 0))
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

function describeCancellationPolicy(p) {
  const penalty = p.penaltyType === 'percent' ? `${p.amount}%`
    : p.penaltyType === 'nights' ? `${p.amount} night(s)`
    : `${p.currency} ${p.amount}`
  const when = p.daysBefore >= 999 ? 'always (non-refundable)' : `${p.daysBefore} day(s) before check-in`
  const deadline = p.cancellationDeadlineHour ? `, deadline ${p.cancellationDeadlineHour}` : ''
  return `Penalty: ${penalty} — applies ${when}${deadline}`
}

const s = {
  page: { maxWidth: 860, margin: '0 auto' },

  // ── LOCKED header: hero photo + thumbnails + CTA bar, pinned below the
  // site navbar. Everything else scrolls underneath it.
  lockedHeader: {
    position: 'sticky', top: 'var(--nav-height)', zIndex: 15,
    background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', margin: '14px 24px 10px' },
  hero: { position: 'relative', width: '100%', height: 220, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  heroScrim: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%)' },
  heroText: { position: 'absolute', left: 24, right: 24, bottom: 14, color: '#fff' },
  heroName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 2, lineHeight: 1.1 },
  heroMeta: { display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  thumbStrip: { display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 24px', scrollbarWidth: 'thin' },
  thumb: { flexShrink: 0, width: 68, height: 48, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' },

  ctaBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    padding: '10px 24px 14px',
  },
  ctaInfo: { minWidth: 0, flex: 1 },
  ctaDates: { fontSize: 12, color: 'var(--text-muted)' },
  ctaSelection: { fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  ctaBtn: { flexShrink: 0, padding: '13px 24px', borderRadius: 99, background: '#ef4056', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' },
  ctaBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  errorBar: { background: '#FDEBEC', color: '#ef4056', fontSize: 12, fontWeight: 600, padding: '8px 24px' },

  // ── Scrollable content below the locked header ──
  content: { padding: '20px 24px 60px' },
  remark: { background: '#F5D6DE', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#000', marginBottom: 10, lineHeight: 1.5 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 28, marginBottom: 12, letterSpacing: '-0.3px', color: 'var(--text)' },
  facilities: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  facilityTag: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px', fontSize: 12 },
  offerCard: (selected) => ({
    border: selected ? '2px solid #000000' : '1.5px solid var(--border)',
    borderRadius: 16, padding: '16px 18px', marginBottom: 12,
    cursor: 'pointer', background: selected ? '#F8F7F5' : 'var(--bg-card)',
  }),
  offerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 10 },
  offerName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 },
  offerBoard: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  offerPrice: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', whiteSpace: 'nowrap' },
  offerBadges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { padding: '4px 10px', background: 'var(--bg)', borderRadius: 99, fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border)' },
  packageBadge: { padding: '4px 10px', background: '#F5D6DE', borderRadius: 99, fontSize: 11, color: '#000', fontWeight: 600 },
  details: { marginTop: 10, fontSize: 12 },
  summary: { cursor: 'pointer', fontWeight: 700, color: '#ef4056', fontSize: 12 },
  priceRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border)', fontSize: 12 },
  priceRowTotal: { fontWeight: 700, borderBottom: 'none', paddingTop: 8 },
  taxItem: { fontSize: 11, color: 'var(--text-muted)', padding: '3px 0' },
  policyItem: { fontSize: 12, padding: '4px 0' },

  formLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, marginTop: 12, display: 'block' },
  formInput: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' },
  formTextarea: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box', minHeight: 70 },
  formRow: { display: 'flex', gap: 8 },
  guestBlock: { marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' },

  confirmBox: { background: 'var(--bg-card)', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', margin: '40px 24px' },
}

export default function HotelDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isHyperGuest = slug?.startsWith('hg-')

  const stateProperty = location.state?.property
  const stateCheckIn = location.state?.checkIn
  const stateNights = location.state?.nights
  const stateAdults = location.state?.adults

  const CERT_PROPERTY_ID = 19912
  const isCertDirectLink = slug === `hg-${CERT_PROPERTY_ID}` && !stateProperty

  function defaultCertDates() {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  }

  const [property, setProperty] = useState(stateProperty || null)
  const [checkIn] = useState(stateCheckIn || (isCertDirectLink ? defaultCertDates() : null))
  const [nights] = useState(stateNights || (isCertDirectLink ? 2 : null))
  const [adults] = useState(stateAdults || 2)
  const [certLinkLoading, setCertLinkLoading] = useState(isCertDirectLink)
  const [certLinkError, setCertLinkError] = useState(null)

  const [staticDetail, setStaticDetail] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    if (!isCertDirectLink) return
    async function runCertSearch() {
      setCertLinkLoading(true)
      setCertLinkError(null)
      try {
        const { data, error } = await supabase.functions.invoke('hyperguest-search', {
          body: { checkIn, nights: 2, rooms: [{ adults: 2 }], hotelIds: [CERT_PROPERTY_ID], customerNationality: 'ZA' },
        })
        if (error) throw error
        const result = data?.results?.[0]
        if (!result) throw new Error('No availability returned for the certification property on these dates.')
        setProperty(result)
      } catch (err) {
        console.error('Certification link search failed:', err)
        setCertLinkError(err.message || 'Could not load the certification property right now.')
      }
      setCertLinkLoading(false)
    }
    runCertSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCertDirectLink])

  useEffect(() => {
    const propertyId = property?.propertyId
    if (!propertyId) return
    async function loadStatic() {
      const { data } = await supabase
        .from('hg_property_static')
        .select('images, facilities, descriptions')
        .eq('hotel_id', propertyId)
        .single()
      setStaticDetail(data || null)
    }
    loadStatic()
  }, [property?.propertyId])

  const [step, setStep] = useState('select')
  const [selectedOffer, setSelectedOffer] = useState(null)

  const [prebooking, setPrebooking] = useState(false)
  const [prebookResult, setPrebookResult] = useState(null)
  const [prebookError, setPrebookError] = useState(null)

  const [leadGuest, setLeadGuest] = useState(emptyLeadGuest())
  const [roomGuests, setRoomGuests] = useState([])
  const [specialRequests, setSpecialRequests] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)
  const [bookingError, setBookingError] = useState(null)

  const [legacyLoading, setLegacyLoading] = useState(!isHyperGuest)
  const [legacyProperty, setLegacyProperty] = useState(null)

  useEffect(() => {
    if (isHyperGuest) return
    async function loadLegacy() {
      setLegacyLoading(true)
      const { data: h } = await supabase.from('hotels').select('*').eq('slug', slug).single()
      setLegacyProperty(h)
      setLegacyLoading(false)
    }
    loadLegacy()
  }, [slug, isHyperGuest])

  useEffect(() => {
    if (selectedOffer) {
      setRoomGuests(Array.from({ length: adults }, emptyGuest))
    }
  }, [selectedOffer, adults])

  const offers = property ? flattenOffers(property) : []
  const photos = (staticDetail?.images || []).filter(i => i.type === 'photo')
  const facilities = (staticDetail?.facilities || []).filter(f => f.name)
  const description = (staticDetail?.descriptions || []).find(d => d.type === 'general')?.description

  async function handlePrebook() {
    if (!selectedOffer || !property) return
    setPrebooking(true)
    setPrebookError(null)
    setPrebookResult(null)

    const sell = selectedOffer.plan.prices?.sell
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-prebook', {
        body: {
          propertyId: property.propertyId,
          checkIn,
          checkOut: addNights(checkIn, nights),
          nationality: 'ZA',
          pax: [{ adults, children: [] }],
          rooms: [{
            roomId: selectedOffer.room.roomId,
            ratePlanId: selectedOffer.plan.ratePlanId,
            expectedPrice: { amount: sell.price, currency: sell.currency },
          }],
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setPrebookResult(data)
      setStep('guestDetails')
    } catch (err) {
      console.error('Pre-book failed:', err)
      setPrebookError(err.message || 'Something went wrong confirming this price. Please try again.')
    }
    setPrebooking(false)
  }

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
    if (!selectedOffer || !property || !prebookResult) return
    setBooking(true)
    setBookingError(null)

    const confirmedRoom = prebookResult.content?.rooms?.[0]
    const sell = confirmedRoom?.prices?.sell ?? selectedOffer.plan.prices?.sell

    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-book', {
        body: {
          propertyId: property.propertyId,
          checkIn,
          checkOut: addNights(checkIn, nights),
          agencyReference: `BLY-${Date.now()}`,
          leadGuest,
          rooms: [{
            roomId: selectedOffer.room.roomId,
            ratePlanId: selectedOffer.plan.ratePlanId,
            expectedPrice: { amount: sell.price, currency: sell.currency },
            guests: roomGuests,
            ...(specialRequests ? { specialRequests: [specialRequests] } : {}),
          }],
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setBookingResult(data)
      setStep('confirmed')
    } catch (err) {
      console.error('Booking failed:', err)
      setBookingError(err.message || 'Something went wrong completing this booking. Please try again, or contact support.')
    }
    setBooking(false)
  }

  function CtaBar() {
    if (step === 'select') {
      const label = selectedOffer ? `${selectedOffer.room.roomName} — ${selectedOffer.plan.ratePlanName}` : 'Select a room & rate below'
      return (
        <div style={s.ctaBar}>
          <div style={s.ctaInfo}>
            <div style={s.ctaDates}>{checkIn} → {addNights(checkIn, nights)} · {nights}n · {adults}a</div>
            <div style={s.ctaSelection}>{label}</div>
          </div>
          <button
            style={{ ...s.ctaBtn, ...(!selectedOffer || prebooking ? s.ctaBtnDisabled : {}) }}
            disabled={!selectedOffer || prebooking}
            onClick={handlePrebook}
          >
            {prebooking ? 'Checking…' : 'Check price'}
          </button>
        </div>
      )
    }
    if (step === 'guestDetails') {
      const confirmedRoom = prebookResult?.content?.rooms?.[0]
      const sell = confirmedRoom?.prices?.sell
      return (
        <div style={s.ctaBar}>
          <div style={s.ctaInfo}>
            <div style={s.ctaDates}>{sell?.currency} {Number(sell?.price).toLocaleString()} total</div>
            <div style={s.ctaSelection}>{selectedOffer.room.roomName}</div>
          </div>
          <button
            style={{ ...s.ctaBtn, ...(!leadGuestValid() || !roomGuestsValid() || booking ? s.ctaBtnDisabled : {}) }}
            disabled={!leadGuestValid() || !roomGuestsValid() || booking}
            onClick={handleBook}
          >
            {booking ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      )
    }
    return null
  }

  if (isCertDirectLink && certLinkLoading) {
    return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading certification property…</div>
  }
  if (isCertDirectLink && certLinkError) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: '#ef4056', marginBottom: 20 }}>{certLinkError}</p>
        <button onClick={() => navigate('/')} style={{ background: '#111', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          ← Back to home
        </button>
      </div>
    )
  }
  if (isHyperGuest && !stateProperty && !isCertDirectLink) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 20 }}>
          This page needs search details (dates, guests) that aren't available on a direct link or refresh yet.
        </p>
        <button onClick={() => navigate('/')} style={{ background: '#ef4056', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          ← Search again
        </button>
      </div>
    )
  }
  if (!isHyperGuest && legacyLoading) {
    return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }
  if (!isHyperGuest && !legacyProperty) {
    return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Hotel not found.</div>
  }
  if (legacyProperty) {
    return (
      <main>
        <div style={s.page}>
          <button style={s.back} onClick={() => navigate(-1)}>← Back to results</button>
          <h1 style={{ padding: '0 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }}>{legacyProperty.name}</h1>
          <p style={{ padding: '0 24px', color: 'var(--text-muted)' }}>{legacyProperty.description}</p>
        </div>
      </main>
    )
  }

  const info = property.propertyInfo

  if (step === 'confirmed' && bookingResult) {
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
              <span style={{ fontWeight: 700, fontSize: 13 }}>{content?.bookingId}</span>
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
          <button onClick={() => navigate('/')} style={{ background: 'var(--text)', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Back to home
          </button>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div style={s.page}>

        {/* ── LOCKED: hero + thumbnails + CTA bar stay pinned while scrolling ── */}
        <div style={s.lockedHeader}>
          <button style={s.back} onClick={() => (step === 'guestDetails' ? setStep('select') : navigate(-1))}>
            ← {step === 'guestDetails' ? 'Back to room selection' : 'Back to results'}
          </button>

          <div style={s.hero}>
            <img src={photos[activePhoto]?.uri || property.thumbnailImage || PLACEHOLDER_IMG} alt={info.name} style={s.heroImg} />
            <div style={s.heroScrim} />
            <div style={s.heroText}>
              <div style={s.heroName}>{info.name}</div>
              <div style={s.heroMeta}>
                {info.starRating > 0 && <span>★ {info.starRating}</span>}
                <span>📍 {info.cityName}, {info.countryCode}</span>
              </div>
            </div>
          </div>

          {photos.length > 1 && (
            <div style={s.thumbStrip}>
              {photos.slice(0, 12).map((p, i) => (
                <img key={i} src={p.uri} style={s.thumb} onClick={() => setActivePhoto(i)} alt="" />
              ))}
            </div>
          )}

          {(prebookError || bookingError) && (
            <div style={s.errorBar}>{prebookError || bookingError}</div>
          )}
          <CtaBar />
        </div>

        {/* ── SCROLLABLE content ── */}
        <div style={s.content}>
          {description && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</p>}
          {property.remarks?.map((r, i) => (
            <div key={i} style={{ ...s.remark, marginTop: i === 0 ? 16 : 0 }}>{r}</div>
          ))}

          {facilities.length > 0 && (
            <>
              <div style={s.sectionTitle}>Facilities</div>
              <div style={s.facilities}>
                {facilities.map((f, i) => <span key={i} style={s.facilityTag}>{f.name}</span>)}
              </div>
            </>
          )}

          {step === 'select' && offers.length > 0 && (
            <>
              <div style={s.sectionTitle}>Choose your room & rate</div>
              {offers.map((offer, i) => {
                const isSelected = selectedOffer === offer
                const sell = offer.plan.prices?.sell
                const net = offer.plan.prices?.net
                const bar = offer.plan.prices?.bar
                const taxes = sell?.taxes || []
                const fees = offer.plan.prices?.fees || []
                const policies = offer.plan.cancellationPolicies || []
                return (
                  <div key={i} style={s.offerCard(isSelected)} onClick={() => { setSelectedOffer(offer); setPrebookResult(null); setPrebookError(null) }}>
                    <div style={s.offerTop}>
                      <div>
                        <div style={s.offerName}>{offer.room.roomName} — {offer.plan.ratePlanName}</div>
                        <div style={s.offerBoard}>{offer.plan.board} board · up to {offer.room.settings?.maxOccupancy} guests</div>
                      </div>
                      <div style={s.offerPrice}>{sell?.currency} {Number(sell?.price).toLocaleString()}</div>
                    </div>
                    <div style={s.offerBadges}>
                      {offer.plan.ratePlanInfo?.isPackageRate && <span style={s.packageBadge}>Package rate</span>}
                      {offer.plan.ratePlanInfo?.isPromotion && <span style={s.packageBadge}>Promo</span>}
                      {offer.plan.isImmediate && <span style={s.badge}>Instant confirmation</span>}
                    </div>

                    <details style={s.details} onClick={e => e.stopPropagation()}>
                      <summary style={s.summary}>Taxes & fees breakdown</summary>
                      <div style={s.priceRow}><span>Net rate</span><span>{net?.currency} {net?.price}</span></div>
                      <div style={s.priceRow}><span>BAR rate</span><span>{bar?.currency} {bar?.price}</span></div>
                      <div style={{ ...s.priceRow, ...s.priceRowTotal }}><span>Sell rate (total)</span><span>{sell?.currency} {sell?.price}</span></div>
                      {taxes.map((t, ti) => <div key={ti} style={s.taxItem}>Tax — {t.name}: {t.currency} {t.amount} ({t.relation}, {t.scope}, {t.frequency})</div>)}
                      {fees.map((f, fi) => <div key={fi} style={s.taxItem}>Fee — {f.name}: {f.currency} {f.amount} ({f.relation}, {f.scope}, {f.frequency})</div>)}
                    </details>

                    <details style={s.details} onClick={e => e.stopPropagation()}>
                      <summary style={s.summary}>Cancellation policy</summary>
                      {policies.length === 0
                        ? <div style={s.policyItem}>No cancellation policy returned for this rate plan.</div>
                        : policies.map((p, pi) => <div key={pi} style={s.policyItem}>{describeCancellationPolicy(p)}</div>)}
                    </details>
                  </div>
                )
              })}
            </>
          )}

          {step === 'guestDetails' && (
            <>
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
            </>
          )}
        </div>
      </div>
    </main>
  )
}
