import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'

function addNights(dateStr, nights) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}

// Finds the cheapest sell price across all rooms/rate plans for a property,
// so the card can show one headline "from RXXX/night" figure.
function cheapestOffer(property) {
  let cheapest = null
  for (const room of property.rooms ?? []) {
    for (const plan of room.ratePlans ?? []) {
      const sell = plan.prices?.sell
      if (!sell) continue
      if (!cheapest || sell.price < cheapest.price) {
        cheapest = { price: sell.price, currency: sell.currency, roomName: room.roomName, boardBasis: plan.board }
      }
    }
  }
  return cheapest
}

function ResultCard({ property, checkIn, nights, adults }) {
  const navigate = useNavigate()
  const offer = cheapestOffer(property)
  const info = property.propertyInfo

  const handleView = () => {
    // Hand the full search result forward via router state so HotelDetail
    // doesn't need to re-run a search just to show what we already have.
    navigate(`/hotel/hg-${property.propertyId}`, {
      state: { property, checkIn, nights, adults },
    })
  }

  return (
    <div
      onClick={handleView}
      style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)', cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <img
          src={property.thumbnailImage || PLACEHOLDER_IMG}
          alt={info.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: '18px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', marginBottom: 2 }}>
              {info.name}
            </h3>
            <p style={{ fontSize: 13, color: '#888' }}>📍 {info.cityName}, {info.countryCode}</p>
          </div>
          {info.starRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{info.starRating}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            {offer ? (
              <>
                <span style={{ fontSize: 11, color: '#999', display: 'block' }}>from</span>
                <span style={{ fontWeight: 800, fontSize: 18 }}>
                  {offer.currency} {Number(offer.price).toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: '#999' }}> / night</span>
              </>
            ) : (
              <span style={{ fontSize: 14, color: '#aaa' }}>No availability for these dates</span>
            )}
          </div>
          <button
            style={{
              background: '#111', color: '#fff', borderRadius: 99,
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
            }}
          >
            View →
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ city, noneAvailable }) {
  const navigate = useNavigate()
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em', marginBottom: 8 }}>
        {noneAvailable ? `No availability in ${city} for these dates` : `No stays found in ${city}`}
      </h2>
      <p style={{ color: '#888', fontSize: 15, marginBottom: 28 }}>
        {noneAvailable
          ? 'Try different dates or another destination.'
          : "We don't have any properties there yet — try another destination."}
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#ef4056', color: '#fff', borderRadius: 99,
          padding: '12px 28px', fontSize: 14, fontWeight: 700,
          border: 'none', cursor: 'pointer',
        }}
      >
        ← Back to home
      </button>
    </div>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()

  const city = searchParams.get('city') || 'Cape Town'
  const checkIn = searchParams.get('checkIn')
  const nights = Number(searchParams.get('nights') || 2)
  const adults = Number(searchParams.get('adults') || 2)

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function runSearch() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fnError } = await supabase.functions.invoke('hyperguest-city-search', {
          body: { city, checkIn, nights, adults, customerNationality: 'ZA', currency: 'ZAR' },
        })
        if (fnError) throw fnError
        // Only show properties that actually have rooms available for these dates.
        const withAvailability = (data?.results ?? []).filter(p => p.rooms?.length > 0)
        setResults(withAvailability)
      } catch (err) {
        console.error('City search failed:', err)
        setError(err.message || 'Search failed. Please try again.')
        setResults([])
      }
      setLoading(false)
    }
    if (checkIn) runSearch()
  }, [city, checkIn, nights, adults])

  return (
    <div style={{ minHeight: 'calc(100vh - var(--nav-height))', background: '#F8F7F5' }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #E2DFDB',
        padding: '16px 40px', display: 'flex', justifyContent: 'center',
      }}>
        <SearchBar initialCity={city} initialCheckIn={checkIn} initialCheckOut={addNights(checkIn, nights)} initialAdults={adults} />
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px 60px' }}>
        {!loading && !error && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: '#ef4056', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Search results
            </p>
            <h1 style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-0.05em', marginTop: 4 }}>
              Stays in {city}
              <span style={{ fontWeight: 400, fontSize: 18, color: '#999', marginLeft: 12 }}>
                {results.length} {results.length === 1 ? 'property' : 'properties'} · {checkIn} · {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </h1>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 360, borderRadius: 20, background: '#fff', opacity: 0.7 }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 18 }}>Something went wrong</p>
            <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>{error}</p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState city={city} noneAvailable />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {results.map(property => (
              <ResultCard key={property.propertyId} property={property} checkIn={checkIn} nights={nights} adults={adults} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
