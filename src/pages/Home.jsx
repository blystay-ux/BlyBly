import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'

// Swap this for your own BLY. hero photography (real SA landscape/urban per the CI).
const HERO_IMG =
  'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1920&q=80'

// Brand city lines — the signature BLY. destination copy.
const CITIES = [
  { name: 'Cape Town',    line: 'Beautiful enough to make your ex jealous.' },
  { name: 'Pretoria',     line: 'Come for the Jacarandas, stay for the braai!' },
  { name: 'Durban',       line: 'Beach, bunny chow and repeat!' },
  { name: 'Johannesburg', line: 'More than gold. More than business.' },
]

function FeaturedCard({ hotel }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/hotel/${hotel.slug}`)}
      style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)', cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img
          src={hotel.image_url || HERO_IMG}
          alt={hotel.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', top: 14, left: 14, background: '#ef4056',
          color: '#fff', borderRadius: 99, padding: '4px 12px',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        }}>
          FEATURED
        </div>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 17, letterSpacing: '-0.03em' }}>
              {hotel.name}
            </h3>
            <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>📍 {hotel.location || hotel.city}</p>
          </div>
          {hotel.rating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{hotel.rating}</span>
            </div>
          ) : null}
        </div>
        <div style={{ marginTop: 14 }}>
          {hotel.price_per_night ? (
            <>
              <span style={{ fontWeight: 800, fontSize: 18 }}>
                R {Number(hotel.price_per_night).toLocaleString('en-ZA')}
              </span>
              <span style={{ fontSize: 13, color: '#999' }}> / night</span>
            </>
          ) : (
            <span style={{ fontSize: 14, color: '#aaa' }}>Price on request</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const cols = 'id, name, slug, city, location, image_url, price_per_night, rating, is_featured'
      // Prefer featured; fall back to any live listing so the strip isn't empty.
      let { data } = await supabase
        .from('hotels').select(cols)
        .eq('is_active', true).eq('is_featured', true)
        .order('created_at', { ascending: false }).limit(7)
      if (!data || data.length === 0) {
        const res = await supabase
          .from('hotels').select(cols)
          .eq('is_active', true)
          .order('created_at', { ascending: false }).limit(7)
        data = res.data || []
      }
      setFeatured(data || [])
      setLoading(false)
    })()
  }, [])

  return (
    <main style={{ fontFamily: "'Inter', sans-serif", background: '#F8F7F5', color: '#111' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
        .bly-fade { animation: blyFade 0.7s ease both; }
        @keyframes blyFade { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @media (max-width: 768px) {
          .bly-hero-inner { padding: 60px 20px !important; }
          .bly-h1 { font-size: clamp(44px, 13vw, 64px) !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '78vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <img src={HERO_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 45%, rgba(10,10,10,0.65) 100%)' }} />

        <div className="bly-hero-inner bly-fade" style={{ position: 'relative', zIndex: 2, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '90px 40px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.14)',
            backdropFilter: 'blur(6px)', color: '#fff', borderRadius: 99, padding: '7px 16px',
            fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', marginBottom: 26,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5D6DE', display: 'inline-block' }} />
            Find. Book. Bly.
          </div>

          <h1 className="bly-h1" style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 900, color: '#fff',
            fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '-0.06em', marginBottom: 18,
          }}>
            Stay where<br />it matters<span style={{ color: '#F5D6DE' }}>.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: 540, lineHeight: 1.6, marginBottom: 40 }}>
            Discover and book real South African stays — direct, simple, and better value.
          </p>

          <SearchBar />
        </div>
      </section>

      {/* ── FEATURED ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 40px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 26 }}>
          <div>
            <p style={{ fontSize: 12, color: '#ef4056', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Hand-picked
            </p>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 'clamp(30px, 4vw, 44px)', letterSpacing: '-0.05em', marginTop: 4 }}>
              Featured stays<span style={{ color: '#ef4056' }}>.</span>
            </h2>
          </div>
          <button
            onClick={() => navigate('/search')}
            style={{ background: 'none', border: '1.5px solid #111', borderRadius: 99, padding: '10px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Browse all stays →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 320, borderRadius: 20, background: '#fff', opacity: 0.7 }} />)}
          </div>
        ) : featured.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏨</div>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 18 }}>Featured stays are on their way</p>
            <p style={{ color: '#888', fontSize: 14, marginTop: 6 }}>New South African properties are being approved right now. Check back soon.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22 }}>
            {featured.map(h => <FeaturedCard key={h.id} hotel={h} />)}
          </div>
        )}
      </section>

      {/* ── EXPLORE BY CITY ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 40px 72px' }}>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 'clamp(26px, 3.5vw, 38px)', letterSpacing: '-0.05em', marginBottom: 22 }}>
          Explore by city<span style={{ color: '#ef4056' }}>.</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {CITIES.map(c => (
            <button
              key={c.name}
              onClick={() => navigate(`/search?city=${encodeURIComponent(c.name)}`)}
              style={{
                textAlign: 'left', background: '#0a0a0a', color: '#fff', border: 'none',
                borderRadius: 20, padding: '26px 24px', cursor: 'pointer', minHeight: 150,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.04em' }}>
                {c.name}<span style={{ color: '#F5D6DE' }}>.</span>
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginTop: 18 }}>
                <span style={{ color: '#ef4056' }}>“</span>{c.line}<span style={{ color: '#ef4056' }}>”</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a0a0a', padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 20, letterSpacing: '-0.05em', color: '#fff' }}>
          Bly<span style={{ color: '#ef4056' }}>.</span>
        </span>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>© 2026 BLY. — Bly waar dit saak maak.</p>
      </footer>
    </main>
  )
}
