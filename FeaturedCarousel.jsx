import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import HotelCard from './HotelCard'

const s = {
  section: {
    padding: '48px 40px',
    maxWidth: 1280,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  labelAccent: { color: 'var(--accent)' },
  title: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 28,
    color: 'var(--text)',
    letterSpacing: '-0.5px',
  },
  seeAll: {
    padding: '10px 20px',
    border: '1.5px solid var(--border)',
    borderRadius: 99,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text)',
    background: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'border-color 0.15s',
  },
  track: {
    display: 'flex',
    gap: 20,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',
    paddingBottom: 8,
  },
}

export default function FeaturedCarousel({ hotels }) {
  const navigate = useNavigate()
  const trackRef = useRef()

  if (!hotels?.length) return null

  return (
    <section style={s.section}>
      <div style={s.header}>
        <div>
          <div style={s.label}>
            <span style={s.labelAccent}>FEATURED</span> CAROUSEL
          </div>
          <h2 style={s.title}>{hotels.length} stays to start with.</h2>
        </div>
        <button style={s.seeAll} onClick={() => navigate('/search')}>
          See all 18 →
        </button>
      </div>

      <div
        ref={trackRef}
        style={{ ...s.track, msOverflowStyle: 'none' }}
      >
        {hotels.map((hotel, i) => (
          <div key={hotel.id} style={{ scrollSnapAlign: 'start', animationDelay: `${i * 0.07}s` }} className="fade-up">
            <HotelCard hotel={hotel} width={280} />
          </div>
        ))}
      </div>
    </section>
  )
}
