import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSADestinations, getInternationalDestinations } from '../data/destinations'

// ─────────────────────────────────────────────────────────────────────────────
// Bly — Destinations Index Page
// Route: /destinations
// ─────────────────────────────────────────────────────────────────────────────

const PINK   = '#EF4056'
const DARK   = '#0a0a0a'
const OFF_WHITE = '#F8F7F5'
const BORDER = 'rgba(0,0,0,0.09)'

const saDestinations           = getSADestinations()
const internationalDestinations = getInternationalDestinations()

export default function DestinationsPage() {
  const [tab, setTab] = useState('south-africa') // 'south-africa' | 'international'

  const destinations = tab === 'south-africa' ? saDestinations : internationalDestinations

  return (
    <div style={{ background: OFF_WHITE, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ── */}
      <section style={{
        background: DARK,
        padding: 'clamp(64px, 10vw, 96px) clamp(24px, 6vw, 80px) clamp(48px, 8vw, 72px)',
        borderBottom: `3px solid ${PINK}`,
      }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: PINK,
          marginBottom: 16,
        }}>
          Bly Travel · Destinations
        </p>
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 900,
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          lineHeight: 1.0,
          color: '#F8F7F5',
          textWrap: 'balance',
          marginBottom: 20,
        }}>
          Where are<br />you headed?
        </h1>
        <p style={{
          color: '#888',
          fontSize: 16,
          maxWidth: 520,
          lineHeight: 1.65,
        }}>
          South Africa's best destinations and the international spots SA travellers love most. Book direct. No middleman. Better value.
        </p>
      </section>

      {/* ── TABS ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: OFF_WHITE,
        borderBottom: `1px solid ${BORDER}`,
        padding: '0 clamp(24px, 6vw, 80px)',
        display: 'flex',
        gap: 0,
      }}>
        {[
          { id: 'south-africa',  label: 'South Africa', count: saDestinations.length },
          { id: 'international', label: 'International', count: internationalDestinations.length },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '18px 0',
              marginRight: 32,
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: tab === id ? DARK : '#888',
              borderBottom: tab === id ? `2px solid ${PINK}` : '2px solid transparent',
              transition: 'all 0.15s',
              letterSpacing: '0.01em',
            }}
          >
            {label}
            <span style={{
              marginLeft: 8,
              fontSize: 11,
              fontWeight: 700,
              background: tab === id ? PINK : '#e5e3df',
              color: tab === id ? '#fff' : '#888',
              padding: '2px 7px',
              borderRadius: 100,
              transition: 'all 0.15s',
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── DESTINATION GRID ── */}
      <section style={{
        padding: 'clamp(40px, 6vw, 64px) clamp(24px, 6vw, 80px)',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: 24,
        }}>
          {destinations.map((dest) => (
            <DestinationCard key={dest.slug} dest={dest} />
          ))}
        </div>
      </section>
    </div>
  )
}

// ── Destination Card ──────────────────────────────────────────────────────────

function DestinationCard({ dest }) {
  const [hovered, setHovered] = useState(false)
  const isStub = dest.overview.length === 0

  return (
    <Link
      to={`/accommodation/${dest.slug}`}
      style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        border: `1px solid ${hovered ? PINK : BORDER}`,
        transition: 'all 0.18s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 32px rgba(239,64,86,0.10)` : '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        {/* Image */}
        <div style={{
          height: 200,
          background: isStub ? '#1a1a1a' : `url(${dest.heroImage}) center/cover no-repeat`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)',
          }} />
          {/* Region badge */}
          <div style={{
            position: 'absolute',
            top: 14,
            left: 14,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: 100,
          }}>
            {dest.regionLabel}
          </div>
          {/* Fly time */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            color: 'rgba(255,255,255,0.8)',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <span style={{ fontSize: 14 }}>✈</span>
            {dest.flyTime}
          </div>
          {/* Best time */}
          <div style={{
            position: 'absolute',
            bottom: 12,
            right: 14,
            background: PINK,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 100,
          }}>
            {dest.bestTimeShort}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 22px 22px' }}>
          <h3 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 900,
            fontSize: '1.25rem',
            color: DARK,
            marginBottom: 6,
            lineHeight: 1.1,
          }}>
            {dest.name}
          </h3>
          <p style={{
            fontSize: 13.5,
            color: '#6b6b6b',
            lineHeight: 1.55,
            marginBottom: 18,
          }}>
            {dest.cardTagline}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#aaa',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {dest.currency}
            </span>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: hovered ? PINK : '#333',
              transition: 'color 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {isStub ? 'Coming soon' : 'Explore →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
