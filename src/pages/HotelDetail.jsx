import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calculateGuestPrice, calculateGuestPriceZAR, prefetchZARRates, formatDisplayPrice } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'
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
  lockedHeader: {
    background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '14px 24px',
  },
  back: {
    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
    color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none',
    padding: 0, marginBottom: 12,
  },
  compactHeaderRow: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  compactThumb: { width: 96, height: 76, borderRadius: 12, objectFit: 'cover', flexShrink: 0 },
  compactInfo: { minWidth: 0, flex: 1 },
  compactName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1.15 },
  compactMeta: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginTop: 4 },
  remarkPills: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  remarkPill: { background: '#F5D6DE', borderRadius: 99, padding: '4px 10px', fontSize: 11, color: '#000' },
  hero: {
    position: 'relative', width: '100%', aspectRatio: '1 / 1',
    maxHeight: 560, overflow: 'hidden',
  },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  heroScrim: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.7) 100%)' },
  heroText: { position: 'absolute', left: 24, right: 24, bottom: 20, color: '#fff' },
  heroName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 34px)', letterSpacing: '-0.02em', marginBottom: 4, lineHeight: 1.1 },
  heroMeta: { display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  thumbStrip: { display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 0', scrollbarWidth: 'thin' },
  thumb: { flexShrink: 0, width: 90, height: 64, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' },
  ctaBar: {
    position: 'sticky', bottom: 0, zIndex: 15,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    padding: '14px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
  },
  ctaInfo: { minWidth: 0, flex: 1 },
  ctaDates: { fontSize: 12, color: 'var(--text-muted)' },
  ctaSelection: { fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  ctaBtn: { flexShrink: 0, padding: '13px 24px', borderRadius: 99, background: '#ef4056', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' },
  ctaBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  errorBar: { background: '#FDEBEC', color: '#ef4056', fontSize: 12, fontWeight: 600, padding: '8px 24px' },
  content: { padding: '20px 24px 24px' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 12, letterSpacing: '-0.3px', color: 'var(--text)' },
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
  policyItem: { fontSize: 12, padding: '4px 0' },
  moreSection: { marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 },
  moreSummary: { cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)', padding: '10px 0' },
  moreGallery: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginTop: 14, marginBottom: 16 },
  moreGalleryImg: { width: '100%', height: 90, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' },
  lightboxOverlay: {
    position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
  },
  lightboxImg: { maxWidth: '90vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8 },
  lightboxClose: {
    position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', fontSize: 20,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  lightboxNav: (side) => ({
    position: 'absolute', top: '50%', [side]: 20, transform: 'translateY(-50%)',
    width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
    color: '#fff', border: 'none', fontSize: 22, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),
  lightboxCounter: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 16, fontFamily: 'var(--font-body)' },
}
export default function HotelDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isInsider } = useAuth()
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
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
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
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [prebooking, setPrebooking] = useState(false)
  const [prebookError, setPrebookError] = useState(null)
  const [zarRates, setZarRates] = useState({})
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
  // Prefetch ZAR rates whenever property changes
  useEffect(() => {
    if (!property) return
    const currencies = flattenOffers(property)
      .map(o => o.plan.prices?.sell?.currency)
      .filter(Boolean)
    prefetchZARRates([...new Set([...currencies, 'USD', 'EUR', 'GBP'])]).then(setZarRates)
  }, [property])

  const offers = property ? flattenOffers(property) : []
  const photos = (staticDetail?.images || []).filter(i => i.type === 'photo')
  const facilities = (staticDetail?.facilities || []).filter(f => f.name)
  const description = (staticDetail?.descriptions || []).find(d => d.type === 'general')?.description
  function goPrevPhoto() {
    setGalleryIndex(i => (i - 1 + photos.length) % photos.length)
  }
  function goNextPhoto() {
    setGalleryIndex(i => (i + 1) % photos.length)
  }
  useEffect(() => {
    if (!galleryOpen) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setGalleryOpen(false)
      if (e.key === 'ArrowLeft') goPrevPhoto()
      if (e.key === 'ArrowRight') goNextPhoto()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryOpen, photos.length])

  // ── LODGING SCHEMA: injects LodgingBusiness JSON-LD for Google rich results ──
  useEffect(() => {
    if (!property?.propertyInfo) return
    const pi = property.propertyInfo
    const allOffers = flattenOffers(property)
    const cheapest = allOffers[0]
    const firstPhoto = (staticDetail?.images || []).find(i => i.type === 'photo')?.uri
      || property.thumbnailImage
      || PLACEHOLDER_IMG
    const desc = (staticDetail?.descriptions || []).find(d => d.type === 'general')?.description || ''
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      name: pi.name,
      description: desc.slice(0, 300),
      url: `https://blytravel.co.za/hotel/${slug}`,
      image: firstPhoto,
      address: {
        '@type': 'PostalAddress',
        addressLocality: pi.cityName,
        addressCountry: pi.countryCode || 'ZA',
      },
      ...(pi.starRating > 0 && {
        starRating: { '@type': 'Rating', ratingValue: pi.starRating },
      }),
      ...(cheapest?.plan?.prices?.sell && {
        priceRange: `From ${cheapest.plan.prices.sell.currency} ${Number(cheapest.plan.prices.sell.price).toLocaleString()}/night`,
      }),
    }
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = 'bly-hotel-schema'
    el.innerHTML = JSON.stringify(schema)
    document.head.appendChild(el)
    return () => { document.getElementById('bly-hotel-schema')?.remove() }
  }, [property, staticDetail, slug])

  async function handlePrebook() {
    if (!selectedOffer || !property) return
    setPrebooking(true)
    setPrebookError(null)
    const net = selectedOffer.plan.prices?.net
    const sell = selectedOffer.plan.prices?.sell
    const priceForHyperGuest = net || sell
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
            expectedPrice: { amount: priceForHyperGuest.price, currency: priceForHyperGuest.currency },
          }],
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      navigate('/checkout', {
        state: { property, selectedOffer, prebookResult: data, checkIn, nights, adults },
      })
    } catch (err) {
      console.error('Pre-book failed:', err)
      setPrebookError(err.message || 'Something went wrong confirming this price. Please try again.')
    }
    setPrebooking(false)
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
          <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', margin: '20px 24px 16px' }}>← Back to results</button>
          <h1 style={{ padding: '0 24px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }}>{legacyProperty.name}</h1>
          <p style={{ padding: '0 24px', color: 'var(--text-muted)' }}>{legacyProperty.description}</p>
        </div>
      </main>
    )
  }
  const info = property.propertyInfo
  const ctaLabel = selectedOffer ? `${selectedOffer.room.roomName} — ${selectedOffer.plan.ratePlanName}` : 'Select a room & rate below'
  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - var(--nav-height))' }}>
      <div style={{ ...s.page, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* ── COMPACT HEADER: small photo + name/rating/location, gets out of the way fast ── */}
        <div style={s.lockedHeader}>
          <button style={s.back} onClick={() => navigate(-1)}>← Back to results</button>
          <div style={s.compactHeaderRow}>
            <img
              src={property.thumbnailImage || photos[0]?.uri || PLACEHOLDER_IMG}
              alt={info.name}
              style={{ ...s.compactThumb, cursor: photos.length > 0 ? 'pointer' : 'default' }}
              onClick={() => { if (photos.length > 0) { setGalleryIndex(0); setGalleryOpen(true) } }}
            />
            <div style={s.compactInfo}>
              <div style={s.compactName}>{info.name}</div>
              <div style={s.compactMeta}>
                {info.starRating > 0 && <span>★ {info.starRating}</span>}
                <span>📍 {info.cityName}, {info.countryCode}</span>
              </div>
              {property.remarks?.length > 0 && (
                <div style={s.remarkPills}>
                  {property.remarks.slice(0, 3).map((r, i) => (
                    <span key={i} style={s.remarkPill}>{r.length > 40 ? r.slice(0, 40) + '…' : r}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {prebookError && <div style={s.errorBar}>{prebookError}</div>}
        {/* ── ROOMS FIRST: the whole point of this layout ── */}
        <div style={{ ...s.content, flex: 1 }}>
          {offers.length > 0 && (
            <>
              <div style={s.sectionTitle}>Choose your room & rate</div>
              {offers.map((offer, i) => {
                const isSelected = selectedOffer === offer
                const net = offer.plan.prices?.net
                const sell = offer.plan.prices?.sell
                const policies = offer.plan.cancellationPolicies || []
                const zarRate = sell ? (zarRates[sell.currency?.toUpperCase()] ?? null) : null
                const guestPrice = sell ? calculateGuestPriceZAR(net?.price ?? sell.price, sell.price, sell.currency, isInsider, zarRate) : null
                return (
                  <div key={i} style={s.offerCard(isSelected)} onClick={() => { setSelectedOffer(offer); setPrebookError(null) }}>
                    <div style={s.offerTop}>
                      <div>
                        <div style={s.offerName}>{offer.room.roomName} — {offer.plan.ratePlanName}</div>
                        <div style={s.offerBoard}>{offer.plan.board} board · up to {offer.room.settings?.maxOccupancy} guests</div>
                      </div>
                      <div style={s.offerPrice}>{guestPrice ? formatDisplayPrice(guestPrice) : null}</div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginTop: -6, marginBottom: guestPrice?.totalAmountZAR ? 2 : 6 }}>
                      Taxes and fees included{guestPrice?.isInsiderRate && ' · Bly Insiders rate'}
                    </div>
                    {guestPrice?.totalAmountZAR != null && (() => {
                      const estimates = ['USD', 'EUR', 'GBP'].map(cur => {
                        const rate = zarRates[cur]
                        if (!rate) return null
                        const est = Math.round(guestPrice.totalAmountZAR / rate)
                        return `${cur} ${est.toLocaleString()}`
                      }).filter(Boolean)
                      return estimates.length > 0
                        ? <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 6 }}>{'Est. ' + estimates.join(' · ')}</div>
                        : null
                    })()}
                    <div style={s.offerBadges}>
                      {offer.plan.ratePlanInfo?.isPackageRate && <span style={s.packageBadge}>Package rate</span>}
                      {offer.plan.ratePlanInfo?.isPromotion && <span style={s.packageBadge}>Promo</span>}
                      {offer.plan.isImmediate && <span style={s.badge}>Instant confirmation</span>}
                    </div>
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
          {/* ── "MORE ABOUT THIS PROPERTY" ── */}
          <details style={s.moreSection}>
            <summary style={s.moreSummary}>More about this property</summary>
            {photos.length > 0 && (
              <div style={s.moreGallery}>
                {photos.slice(0, 12).map((p, i) => (
                  <img
                    key={i} src={p.uri} style={s.moreGalleryImg} alt=""
                    onClick={() => { setGalleryIndex(i); setGalleryOpen(true) }}
                  />
                ))}
              </div>
            )}
            {description && <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>{description}</p>}
            {facilities.length > 0 && (
              <>
                <div style={{ ...s.sectionTitle, fontSize: 15, marginBottom: 8 }}>Facilities</div>
                <div style={s.facilities}>
                  {facilities.map((f, i) => <span key={i} style={s.facilityTag}>{f.name}</span>)}
                </div>
              </>
            )}
          </details>
        </div>
        {/* ── STICKY BOTTOM CTA ── */}
        <div style={s.ctaBar}>
          <div style={s.ctaInfo}>
            <div style={s.ctaDates}>{checkIn} → {addNights(checkIn, nights)} · {nights}n · {adults}a</div>
            <div style={s.ctaSelection}>{ctaLabel}</div>
          </div>
          <button
            style={{ ...s.ctaBtn, ...(!selectedOffer || prebooking ? s.ctaBtnDisabled : {}) }}
            disabled={!selectedOffer || prebooking}
            onClick={handlePrebook}
          >
            {prebooking ? 'Checking…' : 'Check price'}
          </button>
        </div>
      </div>
      {/* ── LIGHTBOX ── */}
      {galleryOpen && photos.length > 0 && (
        <div style={s.lightboxOverlay} onClick={() => setGalleryOpen(false)}>
          <button style={s.lightboxClose} onClick={() => setGalleryOpen(false)} aria-label="Close gallery">✕</button>
          {photos.length > 1 && (
            <button style={s.lightboxNav('left')} onClick={e => { e.stopPropagation(); goPrevPhoto() }} aria-label="Previous photo">‹</button>
          )}
          <img
            src={photos[galleryIndex]?.uri}
            alt=""
            style={s.lightboxImg}
            onClick={e => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <button style={s.lightboxNav('right')} onClick={e => { e.stopPropagation(); goNextPhoto() }} aria-label="Next photo">›</button>
          )}
          <div style={s.lightboxCounter}>{galleryIndex + 1} / {photos.length}</div>
        </div>
      )}
    </main>
  )
}
