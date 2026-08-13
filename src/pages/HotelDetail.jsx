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
  page: { maxWidth: 1280, margin: '0 auto', padding: '40px 40px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 28, background: 'none', border: 'none' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' },
  imgMain: { borderRadius: 20, overflow: 'hidden', marginBottom: 8 },
  img: { width: '100%', height: 420, objectFit: 'cover', display: 'block' },
  photoStrip: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8, marginBottom: 20 },
  photoThumb: { width: '100%', height: 70, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' },
  name: { fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 },
  meta: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, fontSize: 14, color: 'var(--text-muted)' },
  remark: { background: '#F5D6DE', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#000', marginBottom: 10, lineHeight: 1.5 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 28, marginBottom: 12, letterSpacing: '-0.3px' },
  facilities: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  facilityTag: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 14px', fontSize: 12 },
  roomsSection: { marginTop: 36 },
  roomsSectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 16, letterSpacing: '-0.3px' },
  offerCard: (selected) => ({
    border: selected ? '2px solid #000000' : '1.5px solid var(--border)',
    borderRadius: 16, padding: '18px 20px', marginBottom: 12,
    cursor: 'pointer', background: selected ? '#F8F7F5' : '#fff',
    transition: 'all 0.15s',
  }),
  offerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  offerName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 },
  offerBoard: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  offerPrice: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)' },
  offerPricePer: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 },
  offerBadges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { padding: '4px 10px', background: 'var(--bg)', borderRadius: 99, fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border)' },
  packageBadge: { padding: '4px 10px', background: '#F5D6DE', borderRadius: 99, fontSize: 11, color: '#000', fontWeight: 600 },
  details: { marginTop: 10, fontSize: 12 },
  summary: { cursor: 'pointer', fontWeight: 700, color: '#ef4056', fontSize: 12 },
  priceRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border)', fontSize: 12 },
  priceRowTotal: { fontWeight: 700, borderBottom: 'none', paddingTop: 8 },
  taxItem: { fontSize: 11, color: 'var(--text-muted)', padding: '3px 0' },
  policyItem: { fontSize: 12, padding: '4px 0' },
  card: { background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', position: 'sticky', top: 84 },
  bookBtn: { width: '100%', padding: '16px 0', borderRadius: 99, background: '#ef4056', color: '#fff', fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' },
  bookBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  prebookBox: { marginTop: 20, padding: 16, background: '#F8F7F5', borderRadius: 14 },
  errorBox: { marginTop: 12, padding: 12, background: '#FDEBEC', borderRadius: 10, fontSize: 13, color: '#ef4056', fontWeight: 600 },
  formLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, marginTop: 12, display: 'block' },
  formInput: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' },
  formTextarea: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box', minHeight: 70 },
  formRow: { display: 'flex', gap: 8 },
  guestBlock: { marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' },
  confirmBox: { background: '#fff', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' },
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
  const [checkIn, setCheckIn] = useState(stateCheckIn || (isCertDirectLink ? defaultCertDates() : null))
  const [nights] = useState(stateNights || (isCertDirectLink ? 2 : null))
  const [adults] = useState(stateAdults || 2)
  const [certLinkLoading, setCertLinkLoading] = useState(isCertDirectLink)
  const [certLinkError, setCertLinkError] = useState(null)

  // Cached static detail (photos, facilities, descriptions) -- separate from
  // the live search result, since search doesn't include this content.
  const [staticDetail, setStaticDetail] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    if (!isCertDirectLink) return
    async function runCertSearch() {
      setCertLinkLoading(true)
      setCertLinkError(null)
      try {
        const { data, error } = await supabase.functions.invoke('hyperguest-search', {
          body: {
            checkIn,
            nights: 2,
            rooms: [{ adults: 2 }],
            hotelIds: [CERT_PROPERTY_ID],
            customerNationality: 'ZA',
          },
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

  // Fetch cached static detail (photos, facilities, description) whenever
  // we know which property we're showing.
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
          <h1 style={s.name}>{legacyProperty.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{legacyProperty.description}</p>
        </div>
      </main>
    )
  }

  const info = property.propertyInfo

  if (step === 'confirmed' && bookingResult) {
    const content = bookingResult.content
    return (
      <main>
        <div style={{ ...s.page, maxWidth: 640 }}>
          <div style={s.confirmBox}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✓</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
              Booking confirmed!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Confirmation sent to {leadGuest.email}
            </p>
            <div style={{ background: '#F8F7F5', borderRadius: 14, padding: 20, textAlign: 'left', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Booking reference</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{content?.bookingId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Status</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{content?.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Property</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{info.name}</span>
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
            <button onClick={() => navigate('/')} style={{ background: '#111', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Back to home
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div style={s.page}>
        <button style={s.back} onClick={() => (step === 'guestDetails' ? setStep('select') : navigate(-1))}>
          ← {step === 'guestDetails' ? 'Back to room selection' : 'Back to results'}
        </button>
        <div style={s.grid}>

          <div>
            <div style={s.imgMain}>
              <img src={photos[activePhoto]?.uri || property.thumbnailImage || PLACEHOLDER_IMG} alt={info.name} style={s.img} />
            </div>
            {photos.length > 1 && (
              <div style={s.photoStrip}>
                {photos.slice(0, 10).map((p, i) => (
                  <img key={i} src={p.uri} style={s.photoThumb} onClick={() => setActivePhoto(i)} alt="" />
                ))}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <h1 style={s.name}>{info.name}</h1>
              <div style={s.meta}>
                {info.starRating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--text)' }}>★ {info.starRating}</span>}
                <span>📍 {info.cityName}, {info.countryCode}</span>
              </div>
              {description && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>{description}</p>}
              {property.remarks?.map((r, i) => (
                <div key={i} style={s.remark}>{r}</div>
              ))}
            </div>

            {facilities.length > 0 && (
              <>
                <div style={s.sectionTitle}>Facilities</div>
                <div style={s.facilities}>
                  {facilities.map((f, i) => <span key={i} style={s.facilityTag}>{f.name}</span>)}
                </div>
              </>
            )}

            {step === 'select' && offers.length > 0 && (
              <div style={s.roomsSection}>
                <div style={s.roomsSectionTitle}>Choose your room & rate</div>
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
                        <div style={{ textAlign: 'right' }}>
                          <div style={s.offerPrice}>{sell?.currency} {Number(sell?.price).toLocaleString()}<span style={s.offerPricePer}> total</span></div>
                        </div>
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
                        {taxes.map((t, ti) => (
                          <div key={ti} style={s.taxItem}>Tax — {t.name}: {t.currency} {t.amount} ({t.relation}, {t.scope}, {t.frequency})</div>
                        ))}
                        {fees.map((f, fi) => (
                          <div key={fi} style={s.taxItem}>Fee — {f.name}: {f.currency} {f.amount} ({f.relation}, {f.scope}, {f.frequency})</div>
                        ))}
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
              </div>
            )}

            {step === 'guestDetails' && (
              <div style={s.roomsSection}>
                <div style={s.roomsSectionTitle}>Your details</div>
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
                  <div style={{ ...s.roomsSectionTitle, fontSize: 16 }}>Guest names ({roomGuests.length})</div>
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
              </div>
            )}
          </div>

          <div style={s.card}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 6 }}>
              {checkIn} → {addNights(checkIn, nights)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {nights} {nights === 1 ? 'night' : 'nights'} · {adults} {adults === 1 ? 'adult' : 'adults'}
            </div>

            {step === 'select' && (
              <>
                {!selectedOffer ? (
                  <div style={{ background: '#F5D6DE', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#000', marginBottom: 14, border: '1px solid #ef4056' }}>
                    ☝️ Select a room & rate above to continue
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                    {selectedOffer.room.roomName} — {selectedOffer.plan.ratePlanName}
                  </div>
                )}
                <button
                  style={{ ...s.bookBtn, ...(!selectedOffer || prebooking ? s.bookBtnDisabled : {}) }}
                  disabled={!selectedOffer || prebooking}
                  onClick={handlePrebook}
                >
                  {prebooking ? 'Checking price…' : 'Check price & availability'}
                </button>
                {prebookError && <div style={s.errorBox}>{prebookError}</div>}
              </>
            )}

            {step === 'guestDetails' && (
              <>
                <div style={s.prebookBox}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {prebookResult.content?.rooms?.[0]?.prices?.sell?.currency} {Number(prebookResult.content?.rooms?.[0]?.prices?.sell?.price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedOffer.room.roomName} — {selectedOffer.plan.ratePlanName}</div>
                </div>
                <button
                  style={{ ...s.bookBtn, marginTop: 16, ...(!leadGuestValid() || !roomGuestsValid() || booking ? s.bookBtnDisabled : {}) }}
                  disabled={!leadGuestValid() || !roomGuestsValid() || booking}
                  onClick={handleBook}
                >
                  {booking ? 'Booking…' : 'Confirm booking'}
                </button>
                {bookingError && <div style={s.errorBox}>{bookingError}</div>}
                {(!leadGuestValid() || !roomGuestsValid()) && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    Fill in all fields to continue.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
