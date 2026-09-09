import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['All', 'Festival', 'Sport', 'Business', 'Global', 'Convention']
const PRIORITIES  = ['All', 'MEGA', 'LARGE', 'MEDIUM']

const PRIORITY_STYLE = {
  MEGA:   { bg: '#fff0f2', color: '#c8001e' },
  LARGE:  { bg: '#fff7ed', color: '#c2570a' },
  MEDIUM: { bg: '#f0f9ff', color: '#0369a1' },
}

// Build the search URL from event data — pre-fills city, checkIn, nights, adults
function buildSearchUrl(ev) {
  const params = new URLSearchParams({ city: ev.city, adults: 2 })
  if (ev.event_start) {
    params.set('checkIn', ev.event_start)
    if (ev.event_end) {
      const start = new Date(ev.event_start)
      const end   = new Date(ev.event_end)
      const nights = Math.max(1, Math.round((end - start) / 86_400_000))
      params.set('nights', nights)
    } else {
      params.set('nights', 2)
    }
  }
  return `/search?${params.toString()}`
}

const s = {
  page: { minHeight: '100vh', background: '#F8F7F5', paddingBottom: 80 },
  hero: {
    background: '#1a1a2e', color: '#fff',
    padding: '64px 40px 56px', textAlign: 'center',
  },
  heroEyebrow: {
    fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
    color: '#ef4056', textTransform: 'uppercase', marginBottom: 14,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontWeight: 800,
    fontSize: 'clamp(32px, 5vw, 54px)', letterSpacing: '-0.04em',
    lineHeight: 1.1, marginBottom: 16,
  },
  heroSub: { fontSize: 16, color: '#aaa', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 },
  dot: { color: '#ef4056' },
  body: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  filterBar: {
    background: '#fff', borderRadius: 20,
    padding: '20px 24px', margin: '32px 0 28px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
  },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 160px' },
  filterLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa' },
  filterSelect: {
    padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e0db',
    fontSize: 13, fontFamily: 'var(--font-body)', color: '#1a1a2e',
    background: '#fff', cursor: 'pointer', outline: 'none',
  },
  count: { fontSize: 13, color: '#aaa', marginBottom: 20 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#fff', borderRadius: 18,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    padding: '22px 24px', display: 'flex', flexDirection: 'column',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  icon: { fontSize: 28, lineHeight: 1 },
  pill: (p) => ({
    display: 'inline-block', borderRadius: 99,
    padding: '3px 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
    background: PRIORITY_STYLE[p]?.bg || '#f1f5f9',
    color:      PRIORITY_STYLE[p]?.color || '#475569',
  }),
  cat: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#aaa', marginBottom: 4,
  },
  name: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
    letterSpacing: '-0.03em', color: '#1a1a2e', lineHeight: 1.15, marginBottom: 2,
  },
  sub: { fontSize: 12, color: '#aaa', marginBottom: 8 },
  meta: { display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 },
  desc: { fontSize: 13, color: '#555', lineHeight: 1.55, flex: 1, marginBottom: 16 },
  cta: {
    marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#1a1a2e', color: '#fff', borderRadius: 99,
    padding: '9px 18px', fontSize: 13, fontWeight: 700,
    textDecoration: 'none', alignSelf: 'flex-start',
    fontFamily: 'var(--font-display)',
  },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#aaa', fontSize: 15 },
  skeleton: { background: '#e8e6e2', borderRadius: 18, height: 280, animation: 'pulse 1.4s ease-in-out infinite' },
}

export default function EventsCalendar() {
  const [events,   setEvents]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [cat,      setCat]      = useState('All')
  const [city,     setCity]     = useState('All')
  const [priority, setPriority] = useState('All')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('active', true)
      .order('year')
      .order('month')
      .then(({ data }) => {
        setEvents(data || [])
        setLoading(false)
      })
  }, [])

  // Build city list dynamically from fetched events
  const cityOptions = useMemo(() => {
    const cities = ['All', ...new Set(events.map(e => e.city))]
    return cities
  }, [events])

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (cat      !== 'All' && e.category !== cat)  return false
      if (city     !== 'All' && e.city     !== city)  return false
      if (priority !== 'All' && e.priority !== priority) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.name.toLowerCase().includes(q) &&
          !(e.sub || '').toLowerCase().includes(q) &&
          !e.city.toLowerCase().includes(q) &&
          !(e.description || '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [events, cat, city, priority, search])

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media(max-width:600px){
          .ec-hero { padding: 40px 20px 36px !important; }
          .ec-body { padding: 0 16px !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={s.hero} className="ec-hero">
        <div style={s.heroEyebrow}>South Africa &amp; Beyond</div>
        <h1 style={s.heroTitle}>
          Events Calendar<span style={s.dot}>.</span>
        </h1>
        <p style={s.heroSub}>
          50+ events. Every major festival, race, conference and sporting moment —
          with BLY. accommodation for each one.
        </p>
      </div>

      <div style={s.body} className="ec-body">
        {/* Filters */}
        <div style={s.filterBar}>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Search</div>
            <input
              style={{ ...s.filterSelect, minWidth: 180 }}
              placeholder="Event name or city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Category</div>
            <select style={s.filterSelect} value={cat} onChange={e => setCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>City</div>
            <select style={s.filterSelect} value={city} onChange={e => setCity(e.target.value)}>
              {cityOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={s.filterGroup}>
            <div style={s.filterLabel}>Priority</div>
            <select style={s.filterSelect} value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {(cat !== 'All' || city !== 'All' || priority !== 'All' || search) && (
            <button
              style={{ ...s.filterSelect, border: 'none', color: '#ef4056', cursor: 'pointer', fontWeight: 700, fontSize: 12, flexShrink: 0 }}
              onClick={() => { setCat('All'); setCity('All'); setPriority('All'); setSearch('') }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={s.grid}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={s.skeleton} />)}
          </div>
        ) : (
          <>
            <div style={s.count}>{filtered.length} event{filtered.length !== 1 ? 's' : ''}</div>

            {filtered.length === 0 ? (
              <div style={s.empty}>No events match your filters.</div>
            ) : (
              <div style={s.grid}>
                {filtered.map(e => (
                  <div key={e.id} style={s.card}>
                    <div style={s.cardTop}>
                      <span style={s.icon}>{e.icon}</span>
                      <span style={s.pill(e.priority)}>{e.priority}</span>
                    </div>
                    <div style={s.cat}>{e.category}</div>
                    <div style={s.name}>{e.name}</div>
                    {e.sub && <div style={s.sub}>{e.sub}</div>}
                    <div style={s.meta}>
                      <span style={s.metaItem}>📅 {e.date_label}</span>
                      <span style={s.metaItem}>📍 {e.city}</span>
                    </div>
                    <div style={s.desc}>{e.description}</div>
                    <Link to={buildSearchUrl(e)} style={s.cta}>
                      Find accommodation →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
