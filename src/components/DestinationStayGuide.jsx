import { Link } from 'react-router-dom'

// ─────────────────────────────────────────────────────────────────────────────
// Bly — "Where to stay" guide on a destination page (/accommodation/:slug)
// Data lives in src/data/destinations.js:
//   whereToStay: { heading, intro, towns: [{ name, bestFor, copy, searchCity?, guideSlug? }], byType? }
//   partOf:      { slug, text, linkText }   (links a town page up to its region page)
// Renders nothing for destinations that have neither.
// ─────────────────────────────────────────────────────────────────────────────

const PINK      = '#EF4056'
const DARK      = '#0a0a0a'
const OFF_WHITE = '#F8F7F5'
const BORDER    = 'rgba(0,0,0,0.09)'
const MID       = '#6b6b6b'

const PAD = 'clamp(48px, 7vw, 72px) clamp(24px, 6vw, 80px)'

export default function DestinationStayGuide({ dest }) {
  const w = dest.whereToStay
  const partOf = dest.partOf

  if (!w && !partOf) return null

  if (!w) {
    return (
      <section style={{ background: OFF_WHITE, padding: '20px clamp(24px, 6vw, 80px)', borderBottom: `1px solid ${BORDER}` }}>
        <p style={{ fontSize: 14, color: '#2a2a2a', margin: 0 }}>
          {partOf.text}{' '}
          <Link to={`/accommodation/${partOf.slug}`} style={{ color: DARK, fontWeight: 700 }}>{partOf.linkText} →</Link>
        </p>
      </section>
    )
  }

  return (
    <section style={{ background: '#fff', padding: PAD, borderBottom: `1px solid ${BORDER}` }}>
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
        Where To Stay
      </p>
      <h2 style={{
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
        letterSpacing: '-0.02em',
        color: DARK,
        margin: '0 0 12px',
        textWrap: 'balance',
      }}>
        {w.heading}<span style={{ color: PINK }}>.</span>
      </h2>
      <p style={{ fontSize: 15, lineHeight: 1.75, color: '#2a2a2a', maxWidth: 720, margin: '0 0 32px' }}>{w.intro}</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: 16,
        maxWidth: 1100,
      }}>
        {w.towns.map((t) => (
          <div key={t.name} style={{
            background: OFF_WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PINK, marginBottom: 6 }}>
              {t.bestFor}
            </span>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: DARK, margin: '0 0 8px' }}>{t.name}</h3>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: MID, margin: '0 0 14px', flex: 1 }}>{t.copy}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: 13 }}>
              {t.searchCity && (
                <Link to={`/search?city=${encodeURIComponent(t.searchCity)}`} style={{ color: DARK, fontWeight: 700 }}>
                  Search stays in {t.searchCity} →
                </Link>
              )}
              {t.guideSlug && (
                <Link to={`/accommodation/${t.guideSlug}`} style={{ color: MID, fontWeight: 600 }}>
                  {t.name} guide
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {w.byType && w.byType.length > 0 && (
        <div style={{ maxWidth: 1100, marginTop: 32 }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 18, color: DARK, margin: '0 0 12px' }}>
            {dest.name} accommodation by type
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.8, color: '#2a2a2a' }}>
            {w.byType.map((b) => (
              <li key={b.name}><strong>{b.name}:</strong> {b.copy}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
