import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'
import { calculateGuestPrice } from '../lib/pricing'
import { useAuth } from '../contexts/AuthContext'

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'

function addNights(dateStr, nights) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}

// Finds the cheapest offer across all rooms/rate plans for a property, so
// the card can show one headline "from RXXX/night" figure -- BLY's
// commission applied via the Net/Sell conditional logic in
// src/lib/pricing.js (re-confirmed correct 2026-08-20 after an unrelated
// file-content bug in HotelDetail.jsx was mistaken for a pricing bug).
function cheapestOffer(property) {
  let cheapest = null
  for (const room of property.rooms ?? []) {
    for (const plan of room.ratePlans ?? []) {
      const sell = plan.prices?.sell
      const net = plan.prices?.net
      if (!sell) continue
      if (!cheapest || sell.price < cheapest.sellPrice) {
        cheapest = {
          sellPrice: sell.price, netPrice: net?.price ?? sell.price, currency: sell.currency,
          roomName: room.roomName, boardBasis: plan.board,
        }
      }
    }
  }
  return cheapest
}

function ResultCard({ property, checkIn, nights, adults }) {
  const navigate = useNavigate()
  const { isInsider } = useAuth()
  const cheapestRaw = cheapestOffer(property)
  const offer = cheapestRaw ? calculateGuestPrice(cheapestRaw.netPrice, cheapestRaw.sellPrice, cheapestRaw.currency, isInsider) : null
  const info = property.propertyInfo

  const handleView = () => {
    navigate(`/hotel/hg-${property.propertyId}`, {
      state: { property, checkIn, nights, adults },
    })
  }

  return (
    <div
      onClick={handleView}
      style={{
        background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden',
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
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em', marginBottom: 2, color: 'var(--text)' }}>
              {info.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 {info.cityName}, {info.countryCode}</p>
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>from</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
                  {offer.currency} {Number(offer.totalAmount).toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}> / night</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>Taxes and fees included</span>
              </>
            ) : (
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>No availability for these dates</span>
            )}
          </div>
          <button
            style={{
              background: 'var(--text)', color: '#fff', borderRadius: 99,
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
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
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em', marginBottom: 8, color: 'var(--text)' }}>
        {noneAvailable ? `No availability in ${city} for these dates` : `No stays found in ${city}`}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 28 }}>
        {noneAvailable
          ? 'Try different dates or another destination.'
          : "We don't have any properties there yet — try another destination."}
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'var(--accent)', color: '#fff', borderRadius: 99,
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
    <div style={{ minHeight: 'calc(100vh - var(--nav-height))', background: 'var(--bg)' }}>
      <style>{`
        .bly-search-bar-wrap { padding: 16px 40px; }
        .bly-search-results { padding: 40px 40px 60px; }
        .bly-search-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        @media (max-width: 768px) {
          .bly-search-bar-wrap { padding: 14px 20px; }
          .bly-search-results { padding: 28px 20px 40px; }
        }
        @media (max-width: 480px) {
          .bly-search-bar-wrap { padding: 12px 16px; }
          .bly-search-results { padding: 20px 16px 32px; }
          .bly-search-grid { grid-template-columns: 1fr; gap: 16px; }
          .bly-search-heading { font-size: 26px !important; }
          .bly-search-meta { display: block !important; margin-left: 0 !important; margin-top: 6px !important; }
        }
      `}</style>

      <div className="bly-search-bar-wrap" style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'center',
      }}>
        <SearchBar initialCity={city} initialCheckIn={checkIn} initialCheckOut={addNights(checkIn, nights)} initialAdults={adults} />
      </div>

      <div className="bly-search-results" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {!loading && !error && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Search results
            </p>
            <h1 className="bly-search-heading" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.05em', marginTop: 4, color: 'var(--text)' }}>
              Stays in {city}
              <span className="bly-search-meta" style={{ fontWeight: 400, fontSize: 18, color: 'var(--text-muted)', marginLeft: 12 }}>
                {results.length} {results.length === 1 ? 'property' : 'properties'} · {checkIn} · {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </h1>
          </div>
        )}

        {loading ? (
          <div className="bly-search-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 360, borderRadius: 20, background: 'var(--bg-card)', opacity: 0.7 }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>Something went wrong</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>{error}</p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState city={city} noneAvailable />
        ) : (
          <div className="bly-search-grid">
            {results.map(property => (
              <ResultCard key={property.propertyId} property={property} checkIn={checkIn} nights={nights} adults={adults} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
