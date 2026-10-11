import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { eventCitiesForDestination, hotelsForDestination, hotelPath } from '../seo/seo.js'

// ─────────────────────────────────────────────────────────────────────────────
// Bly — "Hotels in {destination}" block on a destination page (/accommodation/:slug)
// Links each city guide to the hotel pages for that area (/hotel/hg-<id>).
// Hotels come from the Supabase view `hg_hotel_pages` (hotels with a full public page).
// Only South African destinations for now, matching the hotel pages that exist.
// Renders nothing when there are no hotels to list.
// ─────────────────────────────────────────────────────────────────────────────

const PINK      = '#EF4056'
const DARK      = '#0a0a0a'
const OFF_WHITE = '#F8F7F5'
const BORDER    = 'rgba(0,0,0,0.09)'
const MID       = '#6b6b6b'
const SHOWN     = 12

export default function DestinationHotels({ dest }) {
  const [hotels, setHotels] = useState([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    setHotels([])
    setShowAll(false)
    if (dest.region !== 'south-africa' || !eventCitiesForDestination(dest.slug).length) return
    supabase
      .from('hg_hotel_pages')
      .select('hotel_id,name,city,star_rating')
      .eq('country', 'ZA')
      .limit(1000)
      .then(({ data }) => {
        if (!cancelled) setHotels(hotelsForDestination(dest.slug, data || []))
      })
    return () => { cancelled = true }
  }, [dest.slug, dest.region])

  if (!hotels.length) return null
  const list = showAll ? hotels : hotels.slice(0, SHOWN)

  return (
    <section style={{
      background: '#fff',
      padding: 'clamp(48px, 7vw, 72px) clamp(24px, 6vw, 80px)',
      borderBottom: `1px solid ${BORDER}`,
    }}>
      <p style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: MID,
        marginBottom: 16,
        paddingBottom: 10,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        Places To Stay
      </p>
      <h2 style={{
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(1.4rem, 3vw, 2rem)',
        letterSpacing: '-0.02em',
        color: DARK,
        margin: '0 0 20px',
      }}>
        Hotels in {dest.name}<span style={{ color: PINK }}>.</span>
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
        gap: 12,
        maxWidth: 1100,
      }}>
        {list.map((h) => {
          const stars = Math.round(Number(h.star_rating) || 0)
          return (
            <Link key={h.hotel_id} to={hotelPath(h)} style={{
              display: 'block',
              background: OFF_WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '16px 18px',
              textDecoration: 'none',
            }}>
              <strong style={{ display: 'block', fontSize: 15, fontWeight: 700, color: DARK, lineHeight: 1.35 }}>{h.name}</strong>
              <span style={{ display: 'block', fontSize: 12, color: MID, marginTop: 4 }}>
                {stars > 0 && <span style={{ color: '#f59e0b' }}>{'★'.repeat(stars)} </span>}
                {h.city}
              </span>
            </Link>
          )
        })}
      </div>
      {hotels.length > SHOWN && !showAll && (
        <button type="button" onClick={() => setShowAll(true)} style={{
          marginTop: 20, background: 'none', border: `1px solid ${DARK}`, borderRadius: 99,
          padding: '10px 22px', fontSize: 13, fontWeight: 700, color: DARK, cursor: 'pointer',
        }}>
          Show all {hotels.length} hotels
        </button>
      )}
    </section>
  )
}
