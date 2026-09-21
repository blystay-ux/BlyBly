import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { eventTitle, eventDescription, eventHeading, eventSearchUrl, relatedForEvent } from '../seo/seo.js'

const s = {
  page: { minHeight: '100vh', background: '#F8F7F5', paddingBottom: 80 },
  hero: { background: '#1a1a2e', color: '#fff', padding: '72px 0 48px' },
  wrap: { maxWidth: 860, margin: '0 auto', padding: '0 24px' },
  crumb: { fontSize: 12, color: '#9a9ab0', marginBottom: 20 },
  crumbLink: { color: '#9a9ab0', textDecoration: 'none' },
  icon: { fontSize: 40, lineHeight: 1, marginBottom: 12 },
  eyebrow: { fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', color: '#ef4056', textTransform: 'uppercase', marginBottom: 10 },
  h1: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4.5vw, 46px)', letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 },
  sub: { fontSize: 16, color: '#aaa', marginTop: 12, lineHeight: 1.5 },
  body: { maxWidth: 860, margin: '-24px auto 0', padding: '0 24px' },
  card: { background: '#fff', borderRadius: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', padding: '26px 28px', marginBottom: 18 },
  facts: { display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 16 },
  factLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#aaa' },
  factValue: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginTop: 2 },
  text: { fontSize: 15, color: '#444', lineHeight: 1.65, margin: '0 0 20px' },
  cta: { display: 'inline-block', background: '#ef4056', color: '#fff', borderRadius: 99, padding: '12px 24px', fontSize: 14, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-display)' },
  note: { fontSize: 12, color: '#999', marginTop: 12 },
  h2: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#1a1a2e' },
  list: { margin: 0, paddingLeft: 18, lineHeight: 2, fontSize: 14 },
  link: { color: '#ef4056', fontWeight: 600, textDecoration: 'none' },
}

export default function EventPage() {
  const { slug } = useParams()
  const [ev, setEv] = useState(null)
  const [more, setMore] = useState([])
  const [state, setState] = useState('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    supabase.from('events').select('*').eq('slug', slug).eq('active', true).maybeSingle().then(async ({ data }) => {
      if (!alive) return
      if (!data) { setState('missing'); return }
      setEv(data)
      setState('ready')
      const { data: rows } = await supabase.from('events').select('name,slug,date_label').eq('active', true).eq('city', data.city).neq('slug', slug).limit(5)
      if (alive) setMore(rows || [])
    })
    return () => { alive = false }
  }, [slug])

  useEffect(() => {
    if (!ev) return
    document.title = eventTitle(ev)
    let m = document.head.querySelector('meta[name="description"]')
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m) }
    m.setAttribute('content', eventDescription(ev))
  }, [ev])

  useEffect(() => {
    if (state !== 'missing') return
    let r = document.head.querySelector('meta[name="robots"]')
    if (!r) { r = document.createElement('meta'); r.setAttribute('name', 'robots'); document.head.appendChild(r) }
    r.setAttribute('content', 'noindex,follow')
  }, [state])

  if (state === 'loading') return <div style={s.page}><div style={s.hero}><div style={s.wrap}><div style={s.h1}>Loading...</div></div></div></div>
  if (state === 'missing') {
    return (
      <div style={s.page}>
        <div style={s.hero}><div style={s.wrap}><h1 style={s.h1}>Event not found</h1><p style={s.sub}>This event is no longer listed.</p></div></div>
        <div style={s.body}><div style={s.card}><Link to="/events/south-africa" style={s.link}>See all events</Link></div></div>
      </div>
    )
  }

  const rel = relatedForEvent(ev)
  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={s.wrap}>
          <div style={s.crumb}>
            <Link to="/" style={s.crumbLink}>Home</Link> &rsaquo; <Link to="/events/south-africa" style={s.crumbLink}>Events</Link>
          </div>
          <div style={s.icon}>{ev.icon}</div>
          <div style={s.eyebrow}>{ev.category}</div>
          <h1 style={s.h1}>{eventHeading(ev)}</h1>
          {ev.sub && <p style={s.sub}>{ev.sub}</p>}
        </div>
      </div>
      <div style={s.body}>
        <div style={s.card}>
          <div style={s.facts}>
            <div><div style={s.factLabel}>When</div><div style={s.factValue}>{ev.date_label}</div></div>
            <div><div style={s.factLabel}>Where</div><div style={s.factValue}>{ev.city}{ev.area && ev.area !== ev.city ? `, ${ev.area}` : ''}</div></div>
          </div>
          <p style={s.text}>{ev.description}</p>
          <Link to={eventSearchUrl(ev)} style={s.cta}>Search stays in {ev.city} &rarr;</Link>
          {!ev.event_start && <p style={s.note}>Exact dates are still to be confirmed, so pick your own dates in the search.</p>}
        </div>
        {(rel.destination || rel.guide || more.length > 0) && (
          <div style={s.card}>
            <h2 style={s.h2}>Plan your trip</h2>
            <ul style={s.list}>
              {rel.destination && <li><Link to={`/accommodation/${rel.destination.slug}`} style={s.link}>{rel.destination.name} accommodation guide</Link></li>}
              {rel.guide && <li><Link to={rel.guide.url} style={s.link}>{rel.guide.title}</Link></li>}
              {more.map((m) => <li key={m.slug}><Link to={`/events/${m.slug}`} style={s.link}>{m.name}</Link> - {m.date_label}</li>)}
              <li><Link to="/events/south-africa" style={s.link}>All events</Link></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
