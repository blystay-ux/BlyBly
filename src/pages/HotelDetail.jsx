import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SAMPLE = {
  'the-silo-hotel': { id: '5', name: 'The Silo Hotel', slug: 'the-silo-hotel', city: 'Cape Town', province: 'Western Cape', short_desc: "Cape Town's most iconic luxury address", description: 'Perched atop the Zeitz Museum of Contemporary Art Africa in the historic V&A Waterfront, The Silo is a design landmark offering panoramic views of Table Mountain and the harbour.', price_per_night: 9200, rating: 4.8, review_count: 178, images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900'], amenities: ['Rooftop pool','Spa','Restaurant','Bar','Gym','WiFi','Concierge'], category: 'boutique', seasonal_rates: [] },
}

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'

function slugifyName(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'property'
}

// Builds the guest-facing HyperGuest storefront link for this specific property.
// Falls back to the generic storefront if we don't have a HyperGuest property id
// (e.g. a hotel that was added directly rather than via the HyperGuest catalog).
function hyperguestUrl(hotel) {
  if (!hotel?.hotel_code) return 'https://agents.hyperguest.store/'
  return `https://agents.hyperguest.store/properties/${hotel.hotel_code}-${slugifyName(hotel.name)}`
}

// Today's date is used only as a reference point for looking up an industry
// rate plan, if one exists — there's no user-facing date picker anymore since
// actual dates and pricing are confirmed on HyperGuest.
function todayISO() {
  return new Date().toISOString().split('T')[0]
}

const s = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '40px 40px' },
  back: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', cursor: 'pointer', marginBottom: 28, background: 'none', border: 'none' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' },
  imgMain: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  img: { width: '100%', height: 420, objectFit: 'cover', display: 'block' },
  imgRow: { display: 'flex', gap: 12 },
  imgThumb: { flex: 1, height: 140, objectFit: 'cover', borderRadius: 12 },
  badge: { display: 'inline-block', background: '#F5D6DE', color: '#000000', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99, textTransform: 'capitalize', marginBottom: 12 },
  name: { fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: '-1px', color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 },
  meta: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, fontSize: 14, color: 'var(--text-muted)' },
  desc: { fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28, fontWeight: 300 },
  amenitiesTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 12 },
  amenities: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  amenity: { padding: '7px 14px', background: 'var(--bg)', borderRadius: 99, fontSize: 13, fontWeight: 500, color: 'var(--text)', border: '1px solid var(--border)' },
  roomsSection: { marginTop: 36 },
  roomsSectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 16, letterSpacing: '-0.3px' },
  roomCard: (selected) => ({
    border: selected ? '2px solid #000000' : '1.5px solid var(--border)',
    borderRadius: 16, padding: '18px 20px', marginBottom: 12,
    cursor: 'pointer', background: selected ? '#F8F7F5' : '#fff',
    transition: 'all 0.15s',
  }),
  roomTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  roomName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 },
  roomPrice: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)' },
  roomPricePer: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 },
  roomDesc: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 },
  roomChips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  roomChip: { padding: '4px 10px', background: 'var(--bg)', borderRadius: 99, fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border)' },
  selectedTick: { width: 20, height: 20, borderRadius: '50%', background: 'var(--text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  card: { background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', position: 'sticky', top: 84 },
  bookBtn: { width: '100%', padding: '16px 0', borderRadius: 99, background: '#ef4056', color: '#fff', fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' },
  // Nearby stays
  nearbySection: { marginTop: 64 },
  nearbyTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.04em', marginBottom: 20 },
  nearbyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 },
  nearbyCard: { background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', cursor: 'pointer' },
  nearbyImg: { width: '100%', height: 150, objectFit: 'cover', display: 'block' },
  nearbyBody: { padding: '14px 16px 16px' },
  nearbyName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.3 },
  nearbyLoc: { fontSize: 12, color: 'var(--text-muted)' },
}

export default function HotelDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [hotel, setHotel] = useState(null)
  const [roomTypes, setRoomTypes] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewCount, setReviewCount] = useState(0)
  const [industryPlanByRoom, setIndustryPlanByRoom] = useState({})
  const [industryNightRate, setIndustryNightRate] = useState(null)
  const [nearby, setNearby] = useState([])

  const publicNightRate = selectedRoom ? parseFloat(selectedRoom.price_per_night) : (hotel?.price_per_night || 0)
  const nightRate = industryNightRate != null ? industryNightRate : publicNightRate

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: h } = await supabase.from('hotels').select('*').eq('slug', slug).single()
        if (h) {
          setHotel(h)
          const { data: rooms } = await supabase.from('room_types').select('*').eq('hotel_id', h.id).order('price_per_night')
          if (rooms?.length) setRoomTypes(rooms)
          // Review count lives in its own table
          const { count } = await supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('hotel_id', h.id)
          setReviewCount(count || 0)
          // Industry rate plans — RLS only returns these to active industry members
          const { data: plans } = await supabase.from('rate_plans')
            .select('id, room_type_id').eq('hotel_id', h.id).eq('audience', 'industry').eq('is_active', true)
          if (plans?.length) {
            const map = {}
            plans.forEach(p => { if (p.room_type_id) map[p.room_type_id] = p.id })
            setIndustryPlanByRoom(map)
          }
        } else { setHotel(SAMPLE[slug] || null); setReviewCount(SAMPLE[slug]?.review_count || 0) }
      } catch (_) { setHotel(SAMPLE[slug] || null) }
      setLoading(false)
    }
    load()
  }, [slug])

  // Industry rate lookup uses today's date as a fixed reference point —
  // there's no date picker anymore, so this just checks whether a special
  // rate plan exists at all for the selected room.
  useEffect(() => {
    async function fetchIndustryRate() {
      const planId = selectedRoom && industryPlanByRoom[selectedRoom.id]
      if (!planId) { setIndustryNightRate(null); return }
      const { data } = await supabase.from('rates')
        .select('amount').eq('rate_plan_id', planId).eq('stay_date', todayISO()).eq('occupancy', 0).maybeSingle()
      setIndustryNightRate(data ? Number(data.amount) : null)
    }
    fetchIndustryRate()
  }, [selectedRoom, industryPlanByRoom])

  // Nearby stays — other live properties in the same city, once the current
  // hotel has loaded.
  useEffect(() => {
    async function loadNearby() {
      if (!hotel?.city) { setNearby([]); return }
      const { data } = await supabase
        .from('hotels')
        .select('id, name, slug, city, location, image_url, images, rating')
        .eq('is_active', true)
        .eq('city', hotel.city)
        .neq('id', hotel.id)
        .limit(6)
      setNearby(data || [])
    }
    loadNearby()
  }, [hotel])

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
  if (!hotel) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Hotel not found.</div>

  return (
    <main>
      <div style={s.page} className="fade-up">
        <button style={s.back} onClick={() => navigate(-1)}>← Back to results</button>
        <div style={s.grid}>

          {/* Left column */}
          <div>
            <div style={s.imgMain}>
              <img
                src={hotel.images?.[0] || hotel.image_url || PLACEHOLDER_IMG}
                alt={hotel.name}
                style={s.img}
              />
            </div>
            {hotel.images?.length > 1 && (
              <div style={s.imgRow}>
                {hotel.images.slice(1, 3).map((img, i) => <img key={i} src={img} alt="" style={s.imgThumb} />)}
              </div>
            )}
            <div style={{ marginTop: 36 }}>
              {hotel.category && <span style={s.badge}>{hotel.category}</span>}
              <h1 style={s.name}>{hotel.name}</h1>
              <div style={s.meta}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--text)' }}>★ {hotel.rating?.toFixed(1)}</span>
                <span>·</span><span>{reviewCount} reviews</span>
                <span>·</span><span>📍 {hotel.city}, {hotel.province}</span>
              </div>
              <p style={s.desc}>{hotel.description}</p>
              {hotel.amenities?.length > 0 && (
                <>
                  <div style={s.amenitiesTitle}>Property amenities</div>
                  <div style={s.amenities}>
                    {hotel.amenities.map(a => <span key={a} style={s.amenity}>{a}</span>)}
                  </div>
                </>
              )}
            </div>

            {/* Room types */}
            {roomTypes.length > 0 && (
              <div style={s.roomsSection}>
                <div style={s.roomsSectionTitle}>Choose your room</div>
                {roomTypes.map(room => {
                  const isSelected = selectedRoom?.id === room.id
                  return (
                    <div key={room.id} style={s.roomCard(isSelected)}
                      onClick={() => setSelectedRoom(isSelected ? null : room)}>
                      <div style={s.roomTop}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isSelected && <div style={s.selectedTick}>✓</div>}
                          <div style={s.roomName}>{room.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={s.roomPrice}>R{Number(room.price_per_night).toLocaleString()}<span style={s.roomPricePer}>/night</span></div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Up to {room.max_guests} guests</div>
                        </div>
                      </div>
                      {room.description && <div style={s.roomDesc}>{room.description}</div>}
                      {room.amenities?.length > 0 && (
                        <div style={s.roomChips}>
                          {room.amenities.slice(0, 4).map(a => <span key={a} style={s.roomChip}>{a}</span>)}
                          {room.amenities.length > 4 && <span style={s.roomChip}>+{room.amenities.length - 4}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Booking card */}
          <div style={s.card}>
            {nightRate > 0 ? (
              <>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, marginBottom: 4 }}>
                  R{Number(nightRate).toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}> / night</span>
                </div>
                {industryNightRate != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ background: '#ef4056', color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>INDUSTRY RATE</span>
                    {selectedRoom && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        R{Number(parseFloat(selectedRoom.price_per_night)).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                  {selectedRoom ? selectedRoom.name : 'Base rate · select a room above'}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Dates, rooms, and pricing are confirmed on HyperGuest.
              </div>
            )}

            {roomTypes.length > 0 && !selectedRoom && (
              <div style={{ background: '#F5D6DE', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#000000', marginBottom: 14, border: '1px solid #ef4056' }}>
                ☝️ Select a room type above to continue
              </div>
            )}

            <button
              style={s.bookBtn}
              onClick={() => window.open(hyperguestUrl(hotel), '_blank', 'noopener,noreferrer')}>
              Book now on HyperGuest →
            </button>
          </div>
        </div>

        {/* Nearby stays */}
        {nearby.length > 0 && (
          <div style={s.nearbySection}>
            <div style={s.nearbyTitle}>Nearby stays in {hotel.city}<span style={{ color: '#ef4056' }}>.</span></div>
            <div style={s.nearbyGrid}>
              {nearby.map(h => (
                <div key={h.id} style={s.nearbyCard} onClick={() => navigate(`/hotel/${h.slug}`)}>
                  <img
                    src={h.images?.[0] || h.image_url || PLACEHOLDER_IMG}
                    alt={h.name}
                    style={s.nearbyImg}
                  />
                  <div style={s.nearbyBody}>
                    <div style={s.nearbyName}>{h.name}</div>
                    <div style={s.nearbyLoc}>📍 {h.location || h.city}</div>
                    {h.rating > 0 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#f59e0b' }}>★ {Number(h.rating).toFixed(1)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
