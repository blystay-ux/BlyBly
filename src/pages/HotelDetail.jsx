import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'

function addNights(dateStr, nights) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}

// Every (room, ratePlan) pair is a separately bookable offer -- flatten them
// into one list so they're easy to render and select from.
function flattenOffers(property) {
  const offers = []
  for (const room of property.rooms ?? []) {
    for (const plan of room.ratePlans ?? []) {
      offers.push({ room, plan })
    }
  }
  return offers.sort((a, b) => (a.plan.prices?.sell?.price ?? 0) - (b.plan.prices?.sell?.price ?? 0))
}

const s = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '40px 40px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 28, background: 'none', border: 'none' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' },
  imgMain: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  img: { width: '100%', height: 420, objectFit: 'cover', display: 'block' },
  name: { fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 },
  meta: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, fontSize: 14, color: 'var(--text-muted)' },
  remark: { background: '#F5D6DE', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#000', marginBottom: 10, lineHeight: 1.5 },
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
  card: { background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', position: 'sticky', top: 84 },
  bookBtn: { width: '100%', padding: '16px 0', borderRadius: 99, background: '#ef4056', color: '#fff', fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' },
  bookBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  prebookBox: { marginTop: 20, padding: 16, background: '#F8F7F5', borderRadius: 14 },
  errorBox: { marginTop: 12, padding: 12, background: '#FDEBEC', borderRadius: 10, fontSize: 13, color: '#ef4056', fontWeight: 600 },
}

export default function HotelDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const isHyperGuest = slug?.startsWith('hg-')
  const propertyIdFromUrl = isHyperGuest ? Number(slug.replace('hg-', '')) : null

  // Handed forward from the Search page -- no re-fetch needed on the happy path.
  const stateProperty = location.state?.property
  const stateCheckIn = location.state?.checkIn
  const stateNights = location.state?.nights
  const stateAdults = location.state?.adults

  const [property, setProperty] = useState(stateProperty || null)
  const [checkIn] = useState(stateCheckIn)
  const [nights] = useState(stateNights)
  const [adults] = useState(stateAdults || 2)

  const [selectedOffer, setSelectedOffer] = useState(null)
  const [prebooking, setPrebooking] = useState(false)
  const [prebookResult, setPrebookResult] = useState(null)
  const [prebookError, setPrebookError] = useState(null)

  // Legacy path: non-HyperGuest hotels still come from the Supabase `hotels`
  // table directly (unchanged from before).
  const [legacyLoading, setLegacyLoading] = useState(!isHyperGuest)

  useEffect(() => {
    if (isHyperGuest) return
    async function loadLegacy() {
      setLegacyLoading(true)
      const { data: h } = await supabase.from('hotels').select('*').eq('slug', slug).single()
      setProperty(h ? { legacy: h } : null)
      setLegacyLoading(false)
    }
    loadLegacy()
  }, [slug, isHyperGuest])

  const offers = property && !property.legacy ? flattenOffers(property) : []

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
    } catch (err) {
      console.error('Pre-book failed:', err)
      setPrebookError(err.message || 'Something went wrong confirming this price. Please try again.')
    }
    setPrebooking(false)
  }

  // ── Direct link / page refresh with no router state ──
  // We don't have checkIn/nights/adults in this case, so we can't safely
  // re-run a search. Send the person back rather than guess at dates.
  if (isHyperGuest && !stateProperty) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 20 }}>
          This page needs search details (dates, guests) that aren't available on a direct link or refresh yet.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: '#ef4056', color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          ← Search again
        </button>
      </div>
    )
  }

  if (!isHyperGuest && legacyLoading) {
    return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  }
  if (!isHyperGuest && !property) {
    return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Hotel not found.</div>
  }

  // ── Legacy (non-HyperGuest) rendering stays simple ──
  if (property?.legacy) {
    const hotel = property.legacy
    return (
      <main>
        <div style={s.page}>
          <button style={s.back} onClick={() => navigate(-1)}>← Back to results</button>
          <h1 style={s.name}>{hotel.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{hotel.description}</p>
        </div>
      </main>
    )
  }

  const info = property.propertyInfo

  return (
    <main>
      <div style={s.page} className="fade-up">
        <button style={s.back} onClick={() => navigate(-1)}>← Back to results</button>
        <div style={s.grid}>

          <div>
            <div style={s.imgMain}>
              <img src={property.thumbnailImage || PLACEHOLDER_IMG} alt={info.name} style={s.img} />
            </div>
            <div style={{ marginTop: 36 }}>
              <h1 style={s.name}>{info.name}</h1>
              <div style={s.meta}>
                {info.starRating > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--text)' }}>★ {info.starRating}</span>}
                <span>📍 {info.cityName}, {info.countryCode}</span>
              </div>

              {property.remarks?.map((r, i) => (
                <div key={i} style={s.remark}>{r}</div>
              ))}
            </div>

            {offers.length > 0 && (
              <div style={s.roomsSection}>
                <div style={s.roomsSectionTitle}>Choose your room & rate</div>
                {offers.map((offer, i) => {
                  const isSelected = selectedOffer === offer
                  const sell = offer.plan.prices?.sell
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
                        {offer.plan.cancellationPolicies?.length > 0 && <span style={s.badge}>Has cancellation policy</span>}
                      </div>
                    </div>
                  )
                })}
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

            {prebookResult && (
              <div style={s.prebookBox}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                  ✓ Price confirmed: {prebookResult.content?.rooms?.[0]?.prices?.sell?.currency} {Number(prebookResult.content?.rooms?.[0]?.prices?.sell?.price).toLocaleString()}
                </div>
                {prebookResult.content?.rooms?.[0]?.cancellationPolicies?.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Cancellation policy applies — see terms before booking.
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Guest details and payment step coming next.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
