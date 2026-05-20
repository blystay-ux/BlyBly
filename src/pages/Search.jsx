import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import SearchBar from '../components/SearchBar'

function HotelCard({ hotel, checkIn, checkOut, guests }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
    : 1

  const total = hotel.price_per_night ? hotel.price_per_night * nights : null

  const handleBook = () => {
    if (!user) { navigate('/auth'); return }
    navigate(`/hotel/${hotel.slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
      cursor: 'pointer',
    }}>
      {/* Image */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}
        onClick={handleBook}>
        <img
          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
          alt={hotel.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        {hotel.is_featured && (
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: '#ef4056', color: '#fff',
            borderRadius: 99, padding: '4px 12px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          }}>
            FEATURED
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ padding: '18px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', marginBottom: 2 }}>
              {hotel.name}
            </h3>
            <p style={{ fontSize: 13, color: '#888' }}>
              📍 {hotel.location || hotel.city}
            </p>
          </div>
          {hotel.rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{hotel.rating}</span>
            </div>
          )}
        </div>

        {hotel.description && (
          <p style={{
            fontSize: 13, color: '#666', marginTop: 10,
            lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {hotel.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            {hotel.price_per_night ? (
              <>
                <span style={{ fontWeight: 800, fontSize: 18 }}>
                  R {Number(hotel.price_per_night).toLocaleString('en-ZA')}
                </span>
                <span style={{ fontSize: 13, color: '#999' }}> / night</span>
                {total && nights > 1 && (
                  <p style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                    R {Number(total).toLocaleString('en-ZA')} total · {nights} nights
                  </p>
                )}
              </>
            ) : (
              <span style={{ fontSize: 14, color: '#aaa' }}>Price on request</span>
            )}
          </div>
          <button
            onClick={handleBook}
            style={{
              background: '#111', color: '#fff', borderRadius: 99,
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = '#ef4056'}
            onMouseLeave={e => e.target.style.background = '#111'}
          >
            View →
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ city }) {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em', marginBottom: 8 }}>
        No stays found in {city}
      </h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 28 }}>
        We don't have any listings there yet — try another destination.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#ef4056', color: '#fff', borderRadius: 99,
          padding: '12px 28px', fontSize: 14, fontWeight: 700,
          border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        ← Back to home
      </button>
    </div>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()

  const city     = searchParams.get('city')     || 'Cape Town'
  const checkIn  = searchParams.get('checkIn')  || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests   = searchParams.get('guests')   || 2

  const [hotels,  setHotels]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHotels() {
      setLoading(true)

      let query = supabase
        .from('hotels')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      // Filter by city — case-insensitive match
      if (city) {
        query = query.ilike('city', `%${city}%`)
      }

      const { data, error } = await query

      if (!error && data) setHotels(data)
      setLoading(false)
    }

    fetchHotels()
  }, [city])

  return (
    <div style={{ minHeight: 'calc(100vh - var(--nav-height))', background: '#F8F7F5' }}>

      {/* Search bar strip */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E2DFDB',
        padding: '16px 40px', display: 'flex', justifyContent: 'center',
      }}>
        <SearchBar
          initialCity={city}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={Number(guests)}
        />
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px 60px' }}>

        {/* Header */}
        {!loading && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: '#ef4056', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Search results
            </p>
            <h1 style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-0.05em', marginTop: 4 }}>
              Stays in {city}
              <span style={{ fontWeight: 400, fontSize: 18, color: '#999', marginLeft: 12 }}>
                {loading ? '' : `${hotels.length} ${hotels.length === 1 ? 'property' : 'properties'}`}
              </span>
            </h1>
          </div>
        )}

        {loading ? (
          /* Skeleton loader */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                height: 360, borderRadius: 20, background: '#fff',
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <EmptyState city={city} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {hotels.map(hotel => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
