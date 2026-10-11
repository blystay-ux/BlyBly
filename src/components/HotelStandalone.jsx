import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { hotelTitle, relatedForEvent } from '../seo/seo.js'

// ─────────────────────────────────────────────────────────────────────────────
// Bly — Hotel page opened WITHOUT a search (direct link, refresh, shared link)
// Route: /hotel/hg-<propertyId>, rendered by HotelDetail when there is no search state.
//
// Shows the hotel's saved content (hg_property_index + hg_property_static) and a
// "Check availability" form. A successful check navigates to the same URL WITH
// search state, and HotelDetail then shows live rooms and rates as usual.
// No prices are shown here: BLY. holds no stored rates, only live ones.
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
}

export default function HotelStandalone({ slug }) {
  const navigate = useNavigate()
  const propertyId = Number(String(slug || '').replace(/^hg-/, ''))

  const [loading, setLoading] = useState(true)
  const [hotel, setHotel] = useState(null)     // row from hg_property_index
  const [detail, setDetail] = useState(null)   // row from hg_property_static

  const [checkIn, setCheckIn] = useState(isoDate(14))
  const [nights, setNights] = useState(2)
  const [adults, setAdults] = useState(2)
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState(null)

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

  async function checkAvailability(e) {
    e.preventDefault()
    if (checking) return
    setChecking(true)
    setNotice(null)
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-search', {
        body: {
          checkIn,
          nights: Number(nights),
          rooms: [{ adults: Number(adults) }],
          hotelIds: [propertyId],
          customerNationality: 'ZA',
          currency: 'ZAR',
        },
      })
      if (error) throw error
      const result = (data?.results || []).find((r) => Number(r.propertyId) === propertyId) || data?.results?.[0]
      const hasRates = (result?.rooms || []).some((r) => (r.ratePlans || []).length > 0)
      if (!result || !hasRates) {
        setNotice('No rooms are available for these dates. Try different dates or fewer nights.')
        setChecking(false)
        return
      }
      const photos = (detail?.images || []).filter((i) => i.type === 'photo' && i.uri)
      navigate(`/hotel/${slug}`, {
        state: {
          property: { ...result, thumbnailImage: result.thumbnailImage || photos[0]?.uri || null },
          checkIn,
          nights: Number(nights),
          adults: Number(adults),
          rooms: 1,
        },
      })
    } catch (err) {
      console.error('Availability check failed:', err)
      setNotice('We could not check availability just now. Please try again in a moment.')
      setChecking(false)
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

  const photos = (detail?.images || []).filter((i) => i.type === 'photo' && i.uri).slice(0, 6)
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

        <div style={s.gallery}>
          {(photos.length ? photos : [{ uri: PLACEHOLDER_IMG }]).map((img, i) => (
            <img key={i} src={img.uri} alt={`${hotel.name} photo ${i + 1}`} style={s.galleryImg} loading={i === 0 ? 'eager' : 'lazy'} />
          ))}
        </div>

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
