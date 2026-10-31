import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { hotelTitle, relatedForEvent } from '../seo/seo.js'
import { calculateGuestPriceZAR, prefetchZARRates, formatDisplayPrice } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'

// ─────────────────────────────────────────────────────────────────────────────
// Bly — THE hotel page. Route: /hotel/hg-<propertyId>
//
// Search results link here with ?checkIn=&nights=&adults= . When those are present the
// form is pre-filled and availability is checked straight away; live rooms and rates then
// list below the form (grouped by room, Booking.com style). "Select" pre-books the rate
// and moves the guest to /checkout. Opened without dates (direct link, shared link) it
// shows the saved hotel content and the form, and checks availability on submit.
// No prices are stored: BLY. only ever shows live ones.
// ─────────────────────────────────────────────────────────────────────────────

const PINK = '#EF4056'
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'

function isoDate(daysFromToday) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  return d.toISOString().split('T')[0]
}

function countryName(code) {
  if (!code) return ''
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

// Supplier descriptions can contain HTML tags; show them as plain paragraphs.
function toParagraphs(text) {
  return String(text || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function addNights(dateStr, nights) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}

const BOARD_LABEL = { RO: 'Room only', BB: 'Breakfast included', HB: 'Half board', FB: 'Full board', AI: 'All inclusive' }

function describeCancellationPolicy(p) {
  const penalty = p.penaltyType === 'percent' ? `${p.amount}%`
    : p.penaltyType === 'nights' ? `${p.amount} night(s)`
    : `${p.currency} ${p.amount}`
  const when = p.daysBefore >= 999 ? 'always (non-refundable)' : `${p.daysBefore} day(s) before check-in`
  const deadline = p.cancellationDeadlineHour ? `, deadline ${p.cancellationDeadlineHour}` : ''
  return `Penalty: ${penalty} — applies ${when}${deadline}`
}

// { refundable, label } from HyperGuest's cancellation policies.
function cancellationSummary(policies, checkIn) {
  const list = (policies || []).filter((p) => Number(p.amount) > 0)
  if (!policies || policies.length === 0) return { refundable: null, label: 'Cancellation terms apply' }
  if (list.some((p) => Number(p.daysBefore) >= 999)) return { refundable: false, label: 'Non-refundable' }
  if (list.length === 0) return { refundable: true, label: 'Free cancellation' }
  const days = Math.max(...list.map((p) => Number(p.daysBefore) || 0))
  const until = new Date(addNights(checkIn, -days) + 'T00:00:00')
  if (until < new Date(new Date().toDateString())) return { refundable: false, label: 'Cancellation charges apply' }
  return { refundable: true, label: `Free cancellation until ${until.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}` }
}

function flattenByRoom(property) {
  const rooms = []
  for (const room of property?.rooms ?? []) {
    const plans = (room.ratePlans ?? []).filter((pl) => pl.prices?.sell)
    if (plans.length === 0) continue
    plans.sort((a, b) => (a.prices.sell.price ?? 0) - (b.prices.sell.price ?? 0))
    rooms.push({ room, plans })
  }
  return rooms.sort((a, b) => (a.plans[0].prices.sell.price ?? 0) - (b.plans[0].prices.sell.price ?? 0))
}

function bedText(room) {
  const beds = (room.settings?.beddingConfigurations || []).map((b) => `${b.quantity || 1} ${String(b.type || 'bed').toLowerCase()}`)
  return beds.join(', ')
}

const s = {
  page: { maxWidth: 1000, margin: '0 auto', padding: '20px 24px 72px' },
  back: { display: 'inline-block', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 16 },
  name: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.15, margin: '0 0 6px' },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: 14, color: 'var(--text-muted)', marginBottom: 18 },
  gallery: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 8, marginBottom: 24 },
  galleryImg: { width: '100%', height: 190, objectFit: 'cover', borderRadius: 14, display: 'block' },
  card: { border: '1px solid var(--border)', borderRadius: 18, padding: '20px 20px', background: 'var(--bg-card)', marginBottom: 28 },
  cardTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, margin: '0 0 4px' },
  cardSub: { fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' },
  form: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 140px', minWidth: 0 },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  input: { height: 46, borderRadius: 12, border: '1px solid var(--border)', padding: '0 12px', fontSize: 15, background: '#fff', width: '100%', boxSizing: 'border-box' },
  button: (busy) => ({
    height: 46, borderRadius: 99, border: 'none', padding: '0 26px', fontSize: 15, fontWeight: 700,
    background: PINK, color: '#fff', cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1, flex: '1 1 180px',
  }),
  notice: { marginTop: 14, fontSize: 14, color: '#b42318' },
  h2: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, margin: '28px 0 10px' },
  p: { fontSize: 15, lineHeight: 1.7, color: '#2a2a2a', margin: '0 0 12px', maxWidth: 760 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 99, fontSize: 13, color: '#2a2a2a' },
  rooms: { margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.8, color: '#2a2a2a' },
  muted: { padding: 80, textAlign: 'center', color: 'var(--text-muted)' },
  ratesTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, margin: '8px 0 6px' },
  ratesSub: { fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px' },
  roomCard: { border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-card)', marginBottom: 16, overflow: 'hidden' },
  roomHead: { padding: '16px 18px 12px', borderBottom: '1px solid var(--border)' },
  roomName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, margin: 0 },
  roomMeta: { fontSize: 13, color: 'var(--text-muted)', marginTop: 4 },
  planRow: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid var(--border)' },
  planInfo: { flex: '1 1 220px', minWidth: 0, fontSize: 14, lineHeight: 1.6 },
  planBoard: { fontWeight: 700 },
  tagGood: { color: '#15803d', fontWeight: 600 },
  tagBad: { color: '#b45309', fontWeight: 600 },
  planBuy: { textAlign: 'right', flex: '0 1 220px', marginLeft: 'auto' },
  price: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 },
  priceNote: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 },
  selectBtn: (busy) => ({ background: PINK, color: '#fff', border: 'none', borderRadius: 99, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }),
  details: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  skeleton: { height: 110, borderRadius: 16, background: 'linear-gradient(90deg,#eee,#f6f6f6,#eee)', marginBottom: 16 },
}

// Always at most 8 photos (2 rows of 4); photo 8 shows "+N photos" when there are more.
// Click any photo to open the full set large; arrows / keyboard to move, Esc to close.
function PhotoGallery({ photos, name }) {
  const [open, setOpen] = useState(null)
  const count = photos.length

  useEffect(() => {
    if (open === null) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null)
      else if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % count)
      else if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, count])

  const btn = { position: 'absolute', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 24, cursor: 'pointer', lineHeight: 1 }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
        {photos.slice(0, 8).map((img, i) => {
          const extra = i === 7 ? count - 8 : 0
          return (
            <div
              key={img.uri}
              onClick={() => setOpen(i)}
              style={{ position: 'relative', cursor: 'zoom-in', borderRadius: 14, overflow: 'hidden', aspectRatio: '4 / 3' }}
            >
              <img
                src={img.uri}
                alt={`${name} photo ${i + 1}`}
                loading={i < 4 ? 'eager' : 'lazy'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {extra > 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 'clamp(16px, 3vw, 26px)' }}>
                  +{extra} photos
                </div>
              )}
            </div>
          )
        })}
      </div>
      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photos`}
          onClick={() => setOpen(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={photos[open].uri}
            alt={`${name} photo ${open + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }}
          />
          <button type="button" aria-label="Close" onClick={() => setOpen(null)} style={{ ...btn, top: 16, right: 16 }}>×</button>
          {count > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + count) % count) }} style={{ ...btn, left: 16, top: '50%', transform: 'translateY(-50%)' }}>‹</button>
              <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % count) }} style={{ ...btn, right: 16, top: '50%', transform: 'translateY(-50%)' }}>›</button>
              <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 14 }}>{open + 1} / {count}</div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default function HotelStandalone({ slug }) {
  const navigate = useNavigate()
  const propertyId = Number(String(slug || '').replace(/^hg-/, ''))

  const [loading, setLoading] = useState(true)
  const [hotel, setHotel] = useState(null)     // row from hg_property_index
  const [detail, setDetail] = useState(null)   // row from hg_property_static

  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isInsider, corporateAccount, role } = useAuth()
  const effectiveIsInsider = isInsider && role !== 'admin'

  // Search details come from the URL (search results link), then router state, then defaults.
  const urlCheckIn = searchParams.get('checkIn') || location.state?.checkIn || null
  const [checkIn, setCheckIn] = useState(urlCheckIn || isoDate(14))
  const [nights, setNights] = useState(Number(searchParams.get('nights') || location.state?.nights || 2))
  const [adults, setAdults] = useState(Number(searchParams.get('adults') || location.state?.adults || 2))
  const [checking, setChecking] = useState(!!urlCheckIn)
  const [notice, setNotice] = useState(null)
  const [property, setProperty] = useState(null)   // live availability result
  const [searched, setSearched] = useState(null)   // { checkIn, nights, adults } the results are for
  const [zarRates, setZarRates] = useState({})
  const [prebookingKey, setPrebookingKey] = useState(null)
  const [prebookError, setPrebookError] = useState(null)
  const ratesRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      if (!Number.isInteger(propertyId) || propertyId <= 0) {
        setLoading(false)
        return
      }
      const [{ data: indexRow }, { data: staticRow }] = await Promise.all([
        supabase.from('hg_property_index').select('hotel_id, name, city, country').eq('hotel_id', propertyId).maybeSingle(),
        supabase
          .from('hg_property_static')
          .select('star_rating, city_name, country_code, descriptions, images, facilities, rooms, settings')
          .eq('hotel_id', propertyId)
          .maybeSingle(),
      ])
      if (cancelled) return
      setHotel(indexRow || null)
      setDetail(staticRow || null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [propertyId])

  const city = hotel?.city || detail?.city_name || ''
  const country = hotel?.country || detail?.country_code || ''

  useEffect(() => {
    if (hotel?.name) document.title = hotelTitle(hotel.name, city)
  }, [hotel, city])

  async function runSearch(ci, n, a) {
    setChecking(true)
    setNotice(null)
    setPrebookError(null)
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-search', {
        body: {
          checkIn: ci,
          nights: Number(n),
          rooms: [{ adults: Number(a) }],
          hotelIds: [propertyId],
          customerNationality: 'ZA',
          currency: 'ZAR',
        },
      })
      if (error) throw error
      const result = (data?.results || []).find((r) => Number(r.propertyId) === propertyId) || data?.results?.[0]
      const hasRates = (result?.rooms || []).some((r) => (r.ratePlans || []).length > 0)
      if (!result || !hasRates) {
        setProperty(null)
        setSearched(null)
        setNotice('No rooms are available for these dates. Try different dates or fewer nights.')
      } else {
        const currencies = (result.rooms || []).flatMap((r) => (r.ratePlans || []).map((pl) => pl.prices?.sell?.currency)).filter(Boolean)
        prefetchZARRates([...new Set([...currencies, 'USD', 'EUR', 'GBP'])]).then(setZarRates)
        setProperty(result)
        setSearched({ checkIn: ci, nights: Number(n), adults: Number(a) })
        setTimeout(() => ratesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
      }
    } catch (err) {
      console.error('Availability check failed:', err)
      setNotice('We could not check availability just now. Please try again in a moment.')
    }
    setChecking(false)
  }

  function checkAvailability(e) {
    e.preventDefault()
    if (checking) return
    setSearchParams({ checkIn, nights: String(nights), adults: String(adults) }, { replace: true })
    runSearch(checkIn, nights, adults)
  }

  // Arrived from search results (or a link with dates): check availability straight away.
  useEffect(() => {
    if (urlCheckIn && Number.isInteger(propertyId) && propertyId > 0) runSearch(urlCheckIn, nights, adults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId])

  async function handleSelect(room, plan) {
    if (prebookingKey || !property || !searched) return
    const key = `${room.roomId}:${plan.ratePlanId}`
    setPrebookingKey(key)
    setPrebookError(null)
    const net = plan.prices?.net
    const sell = plan.prices?.sell
    const priceForHyperGuest = net || sell
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-prebook', {
        body: {
          propertyId: property.propertyId,
          checkIn: searched.checkIn,
          checkOut: addNights(searched.checkIn, searched.nights),
          nationality: 'ZA',
          pax: [{ adults: searched.adults, children: [] }],
          rooms: [{
            roomId: room.roomId,
            ratePlanId: plan.ratePlanId,
            expectedPrice: { amount: priceForHyperGuest.price, currency: priceForHyperGuest.currency },
          }],
        },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      const photos = (detail?.images || []).filter((i) => i.type === 'photo' && i.uri)
      navigate('/checkout', {
        state: {
          property: { ...property, thumbnailImage: property.thumbnailImage || photos[0]?.uri || null },
          selectedOffer: { room, plan },
          prebookResult: data,
          checkIn: searched.checkIn,
          nights: searched.nights,
          adults: searched.adults,
          rooms: 1,
        },
      })
    } catch (err) {
      console.error('Pre-book failed:', err)
      setPrebookError(err.message || 'Something went wrong confirming this price. Please try again.')
      setPrebookingKey(null)
    }
  }

  if (loading) return <div style={s.muted}>Loading…</div>

  if (!hotel) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 20 }}>We could not find this hotel.</p>
        <Link to="/" style={{ background: PINK, color: '#fff', borderRadius: 99, padding: '12px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Search stays
        </Link>
      </div>
    )
  }

  const photos = (detail?.images || []).filter((i) => i.type === 'photo' && i.uri)
    .filter((i, idx, arr) => arr.findIndex((o) => o.uri === i.uri) === idx)
  const description = (detail?.descriptions || []).find((d) => d.type === 'general')?.description
  const facilities = (detail?.facilities || [])
    .filter((f) => f.name)
    .sort((a, b) => (b.popular || 0) - (a.popular || 0))
    .slice(0, 18)
  const roomTypes = (detail?.rooms || []).filter((r) => r.name).slice(0, 12)
  const stars = Math.round(Number(detail?.star_rating) || 0)
  const times = detail?.settings || {}
  const related = city ? relatedForEvent({ city }) : { destination: null }

  return (
    <main>
      <div style={s.page}>
        <Link to={city ? `/search?city=${encodeURIComponent(city)}${country ? `&country=${country}` : ''}` : '/'} style={s.back}>
          ← {city ? `All stays in ${city}` : 'Search stays'}
        </Link>

        <h1 style={s.name}>{hotel.name}</h1>
        <div style={s.meta}>
          {stars > 0 && <span style={{ color: '#f59e0b' }}>{'★'.repeat(stars)}</span>}
          <span>📍 {[city, countryName(country)].filter(Boolean).join(', ')}</span>
        </div>

        <PhotoGallery photos={photos.length ? photos : [{ uri: PLACEHOLDER_IMG }]} name={hotel.name} />

        <div style={s.card}>
          <h2 style={s.cardTitle}>Check availability</h2>
          <p style={s.cardSub}>Choose your dates to see live rooms and rates for {hotel.name}.</p>
          <form style={s.form} onSubmit={checkAvailability}>
            <label style={s.field}>
              <span style={s.label}>Check-in</span>
              <input id="hs-checkin" type="date" required min={isoDate(0)} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} style={s.input} />
            </label>
            <label style={{ ...s.field, flex: '1 1 100px' }}>
              <span style={s.label}>Nights</span>
              <select id="hs-nights" value={nights} onChange={(e) => setNights(e.target.value)} style={s.input}>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label style={{ ...s.field, flex: '1 1 100px' }}>
              <span style={s.label}>Adults</span>
              <select id="hs-adults" value={adults} onChange={(e) => setAdults(e.target.value)} style={s.input}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button type="submit" disabled={checking} style={s.button(checking)}>
              {checking ? 'Checking…' : 'Check availability'}
            </button>
          </form>
          {notice && <p style={s.notice}>{notice}</p>}
        </div>

        {/* ── LIVE ROOMS & RATES (below the search, Booking.com style) ── */}
        <div ref={ratesRef} style={{ scrollMarginTop: 90 }}>
          {checking && !property && (
            <>
              <div style={s.skeleton} /><div style={s.skeleton} />
            </>
          )}
          {property && searched && (
            <>
              <h2 style={s.ratesTitle}>Choose your room</h2>
              <p style={s.ratesSub}>
                {new Date(searched.checkIn + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                {' → '}
                {new Date(addNights(searched.checkIn, searched.nights) + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                {' · '}{searched.nights} night{searched.nights > 1 ? 's' : ''} · {searched.adults} adult{searched.adults > 1 ? 's' : ''}
              </p>
              {prebookError && <p style={{ ...s.notice, marginBottom: 14 }}>{prebookError}</p>}
              {flattenByRoom(property).map(({ room, plans }) => (
                <div key={room.roomId} style={s.roomCard}>
                  <div style={s.roomHead}>
                    <h3 style={s.roomName}>{room.roomName}</h3>
                    <div style={s.roomMeta}>
                      {[bedText(room), room.settings?.maxOccupancy ? `Sleeps ${room.settings.maxOccupancy}` : '', room.settings?.roomSize ? `${room.settings.roomSize} m²` : ''].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {plans.map((plan) => {
                    const net = plan.prices?.net
                    const sell = plan.prices?.sell
                    const zarRate = zarRates[sell.currency?.toUpperCase()] ?? null
                    const guestPrice = calculateGuestPriceZAR(net?.price ?? sell.price, sell.price, sell.currency, effectiveIsInsider, zarRate, corporateAccount?.commission_pct ?? 0)
                    const cx = cancellationSummary(plan.cancellationPolicies, searched.checkIn)
                    const key = `${room.roomId}:${plan.ratePlanId}`
                    return (
                      <div key={key} style={s.planRow}>
                        <div style={s.planInfo}>
                          <div style={s.planBoard}>{BOARD_LABEL[plan.board] || plan.board}</div>
                          <div style={cx.refundable === false ? s.tagBad : cx.refundable ? s.tagGood : undefined}>{cx.label}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pay online{plan.isImmediate ? ' · Instant confirmation' : ''}</div>
                          {(plan.cancellationPolicies || []).length > 0 && (
                            <details style={s.details}>
                              <summary style={{ cursor: 'pointer' }}>Cancellation policy</summary>
                              {plan.cancellationPolicies.map((p, i) => <div key={i}>{describeCancellationPolicy(p)}</div>)}
                            </details>
                          )}
                        </div>
                        <div style={s.planBuy}>
                          <div style={s.price}>{formatDisplayPrice(guestPrice)}</div>
                          <div style={s.priceNote}>
                            for {searched.nights} night{searched.nights > 1 ? 's' : ''} · taxes and fees included{guestPrice.isInsiderRate ? ' · Bly Insiders rate' : ''}
                          </div>
                          <button type="button" style={s.selectBtn(prebookingKey === key)} disabled={!!prebookingKey} onClick={() => handleSelect(room, plan)}>
                            {prebookingKey === key ? 'Checking price…' : 'Select'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {description && (
          <>
            <h2 style={s.h2}>About {hotel.name}</h2>
            {toParagraphs(description).map((p, i) => <p key={i} style={s.p}>{p}</p>)}
          </>
        )}

        {facilities.length > 0 && (
          <>
            <h2 style={s.h2}>Facilities</h2>
            <div style={s.chips}>
              {facilities.map((f, i) => <span key={i} style={s.chip}>{f.name}</span>)}
            </div>
          </>
        )}

        {roomTypes.length > 0 && (
          <>
            <h2 style={s.h2}>Room types</h2>
            <ul style={s.rooms}>
              {roomTypes.map((r, i) => <li key={i}>{r.name}</li>)}
            </ul>
          </>
        )}

        {(times.checkIn || times.checkOut) && (
          <>
            <h2 style={s.h2}>Good to know</h2>
            <p style={s.p}>
              {times.checkIn ? `Check-in from ${times.checkIn}. ` : ''}
              {times.checkOut ? `Check-out by ${times.checkOut}.` : ''}
            </p>
          </>
        )}

        {related.destination && (
          <p style={{ ...s.p, marginTop: 28 }}>
            Planning a trip?{' '}
            <Link to={`/accommodation/${related.destination.slug}`} style={{ color: '#0a0a0a', fontWeight: 700 }}>
              {related.destination.name} travel guide: things to do, tips and where to stay →
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
