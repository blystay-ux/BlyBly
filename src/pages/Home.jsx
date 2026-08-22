import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'
// Swap this for your own BLY. hero photography (real SA landscape/urban per the CI).
const HERO_IMG =
  'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=75&fm=webp'
// Brand city lines — the signature BLY. destination copy. Same 4 priority
// cities as the search bar's "Popular" group, in the same order.
const CITIES = [
  { name: 'Cape Town',    line: 'Beautiful enough to make your ex jealous.' },
  { name: 'Johannesburg', line: 'More than gold. More than business.' },
  { name: 'Pretoria',     line: 'Come for the Jacarandas, stay for the braai!' },
  { name: 'Durban',       line: 'Beach, bunny chow and repeat!' },
]
const PRIORITY_CITIES = CITIES.map(c => c.name)
const FEATURED_POOL_LIMIT = 60   // how many candidates to fetch and rotate through
const FEATURED_VISIBLE_COUNT = 8 // how many show on screen at once
const ROTATE_INTERVAL_MS = 9000  // how often the visible set reshuffles
function defaultCheckIn() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
// Fisher-Yates -- unbiased shuffle, unlike naively sorting on Math.random().
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function FeaturedCard({ property }) {
  const navigate = useNavigate()
  const photo = (property.images || []).find(img => img.type === 'photo')?.uri
  const goToCity = () => {
    const params = new URLSearchParams({
      city: property.city,
      checkIn: defaultCheckIn(),
      nights: '2',
      adults: '1',
    })
    navigate(`/search?${params}`)
  }
  return (
    <div
      onClick={goToCity}
      style={{
        background: 'var(--bg-card)', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)', cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img
          src={photo || HERO_IMG}
          alt={property.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', top: 14, left: 14, background: 'var(--accent)',
          color: '#fff', borderRadius: 99, padding: '4px 12px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        }}>
          FEATURED
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>
              {property.name}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>📍 {property.city}</p>
          </div>
          {property.star_rating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{property.star_rating}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
export default function Home() {
  const navigate = useNavigate()
  const [showInsidersBanner, setShowInsidersBanner] = useState(true)
  const [pool, setPool] = useState([])       // full candidate set, fetched once
  const [visible, setVisible] = useState([]) // the random subset currently shown
  const [loading, setLoading] = useState(true)
  const rotateTimer = useRef(null)
  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        // Candidate properties from the 4 priority cities.
        const { data: indexRows, error: indexErr } = await supabase
          .from('hg_property_index')
          .select('hotel_id, name, city, country')
          .in('city', PRIORITY_CITIES)
          .limit(FEATURED_POOL_LIMIT * 3) // over-fetch since not all will have cached photos yet
        if (indexErr) throw indexErr
        if (!indexRows?.length) {
          setPool([])
          setLoading(false)
          return
        }
        const ids = indexRows.map(r => r.hotel_id)
        const { data: staticRows, error: staticErr } = await supabase
          .from('hg_property_static')
          .select('hotel_id, images, star_rating')
          .in('hotel_id', ids)
        if (staticErr) throw staticErr
        const indexByCity = new Map(indexRows.map(r => [r.hotel_id, r]))
        const merged = (staticRows || [])
          .filter(row => (row.images || []).some(img => img.type === 'photo')) // only properties with a real photo cached
          .map(row => {
            const idx = indexByCity.get(row.hotel_id)
            return {
              hotelId: row.hotel_id,
              name: idx?.name || 'Property',
              city: idx?.city || '',
              images: row.images,
              star_rating: row.star_rating,
            }
          })
          .slice(0, FEATURED_POOL_LIMIT)
        setPool(merged)
        setVisible(shuffle(merged).slice(0, FEATURED_VISIBLE_COUNT))
      } catch (err) {
        console.error('Failed to load featured properties:', err)
        setPool([])
      }
      setLoading(false)
    })()
  }, [])
  // Rotates the visible subset from the already-fetched pool every few
  // seconds -- no new network requests needed, just a fresh random sample.
  useEffect(() => {
    if (pool.length <= FEATURED_VISIBLE_COUNT) return // nothing to rotate if the pool isn't bigger than what's shown
    rotateTimer.current = setInterval(() => {
      setVisible(shuffle(pool).slice(0, FEATURED_VISIBLE_COUNT))
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(rotateTimer.current)
  }, [pool])
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        .bly-fade { animation: blyFade 0.7s ease both; }
        @keyframes blyFade { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .bly-hero-inner { padding: 90px 40px; }
        .bly-h1 { font-size: clamp(52px, 8vw, 96px); }
        .bly-section { padding: 64px 40px 20px; }
        .bly-section-tight { padding: 48px 40px 72px; }
        .bly-city-card { min-height: 150px; padding: 26px 24px; }
        /* Tablet */
        @media (max-width: 768px) {
          .bly-hero-inner { padding: 56px 24px; }
          .bly-h1 { font-size: clamp(40px, 11vw, 64px); }
          .bly-section { padding: 44px 24px 16px; }
          .bly-section-tight { padding: 36px 24px 56px; }
        }
        /* Phone */
        @media (max-width: 480px) {
          .bly-hero-inner { padding: 40px 18px; }
          .bly-h1 { font-size: clamp(34px, 12vw, 48px); letter-spacing: -0.04em !important; }
          .bly-hero-sub { font-size: 15px !important; }
          .bly-section { padding: 32px 18px 12px; }
          .bly-section-tight { padding: 28px 18px 44px; }
          .bly-city-card { min-height: 120px; padding: 20px 18px; }
          .bly-featured-header { flex-direction: column; align-items: flex-start !important; gap: 14px !important; }
        }
      `}</style>
      {/* ── BLY INSIDERS BANNER ── */}
      {showInsidersBanner && (
        <div style={{
          background: 'var(--bg-dark)', color: '#fff', padding: '18px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          fontSize: 16, position: 'relative', flexWrap: 'wrap', textAlign: 'center',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: 18 }}>✨</span>
          <span>Travel industry professional? Get Insider rates on every stay —</span>
          <span
            onClick={() => navigate('/insiders')}
            style={{ fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer' }}
          >
            Join Bly Insiders →
          </span>
          <button
            onClick={() => setShowInsidersBanner(false)}
            aria-label="Dismiss"
            style={{
              position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '78vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <img src={HERO_IMG} alt="Accommodation in South Africa" fetchPriority="high" loading="eager" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 45%, rgba(10,10,10,0.65) 100%)' }} />
        {/* Big wordmark, layered on the photo itself -- separate from the
            small logo in the site-wide Navbar above. */}
        <div style={{
          position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(48px, 8vw, 84px)',
          letterSpacing: '-3px', color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Bly<span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', marginLeft: 3, marginBottom: -6 }} />
        </div>
        <div className="bly-hero-inner bly-fade" style={{ position: 'relative', zIndex: 2, maxWidth: 1100, width: '100%', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.14)',
            backdropFilter: 'blur(6px)', color: '#fff', borderRadius: 99, padding: '7px 16px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', marginBottom: 26,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-light)', display: 'inline-block' }} />
            Find. Book. Bly.
          </div>
          {/* SEO: brand tagline above, keyword H1 below — best of both */}
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, color: 'rgba(255,255,255,0.65)',
            fontSize: 'clamp(18px, 2.5vw, 28px)', letterSpacing: '-0.03em', marginBottom: 8,
          }}>
            Stay where it matters.
          </p>
          <h1 className="bly-h1" style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff',
            lineHeight: 0.92, letterSpacing: '-0.06em', marginBottom: 18,
          }}>
            Book Accommodation,<br />South Africa &amp; Beyond<span style={{ color: 'var(--accent-light)' }}>.</span>
          </h1>
          <p className="bly-hero-sub" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: 540, lineHeight: 1.6, marginBottom: 40 }}>
            Discover real stays across Cape Town, Joburg, Durban and Pretoria — direct from the host, better value.
          </p>
          <SearchBar />
        </div>
      </section>
      {/* ── FEATURED ── */}
      <section className="bly-section" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="bly-featured-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 26 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Hand-picked
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.05em', marginTop: 4, color: 'var(--text)' }}>
              Featured stays<span style={{ color: 'var(--accent)' }}>.</span>
            </h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            style={{ background: 'none', border: '1.5px solid var(--text)', borderRadius: 99, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text)' }}
          >
            Browse all stays →
          </button>
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 22 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 320, borderRadius: 20, background: 'var(--bg-card)', opacity: 0.7 }} />)}
          </div>
        ) : visible.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', borderRadius: 20, padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏨</div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>Featured stays are on their way</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>We're still gathering photos for properties in Cape Town, Johannesburg, Pretoria, and Durban. Check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 22 }}>
            {visible.map(p => <FeaturedCard key={p.hotelId} property={p} />)}
          </div>
        )}
      </section>
      {/* ── EXPLORE BY CITY ── */}
      <section className="bly-section-tight" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 38px)', letterSpacing: '-0.05em', marginBottom: 22, color: 'var(--text)' }}>
          Explore by city<span style={{ color: 'var(--accent)' }}>.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
          {CITIES.map(c => (
            <button
              key={c.name}
              className="bly-city-card"
              onClick={() => navigate(`/search?city=${encodeURIComponent(c.name)}`)}
              style={{
                textAlign: 'left', background: 'var(--bg-dark)', color: '#fff', border: 'none',
                borderRadius: 20, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em' }}>
                {c.name}<span style={{ color: 'var(--accent-light)' }}>.</span>
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginTop: 18 }}>
                <span style={{ color: 'var(--accent)' }}>&ldquo;</span>{c.line}<span style={{ color: 'var(--accent)' }}>&rdquo;</span>
              </span>
            </button>
          ))}
        </div>
      </section>
      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--bg-dark)', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, letterSpacing: '-0.05em', color: '#fff' }}>
          Bly<span style={{ color: 'var(--accent)' }}>.</span>
        </span>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>© 2026 BLY. — Bly waar dit saak maak.</p>
      </footer>
    </main>
  )
}
