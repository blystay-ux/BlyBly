import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { eventCitiesForDestination, eventsForDestination, eventHeading } from '../seo/seo.js'

// ─────────────────────────────────────────────────────────────────────────────
// Bly — "Upcoming events" block on a destination page (/accommodation/:slug)
// Links each city guide to the event pages for that city (/events/:slug).
// Renders nothing when the destination has no upcoming events.
// The city -> destination mapping lives in src/seo/seo.js (DEST_EVENT_CITIES).
// ─────────────────────────────────────────────────────────────────────────────

const PINK      = '#EF4056'
const DARK      = '#0a0a0a'
const OFF_WHITE = '#F8F7F5'
const BORDER    = 'rgba(0,0,0,0.09)'
const MID       = '#6b6b6b'

export default function DestinationEvents({ dest }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    let cancelled = false
    setEvents([])
    const cities = eventCitiesForDestination(dest.slug)
    if (!cities.length) return
    supabase
      .from('events')
      .select('name,slug,city,date_label,event_start,event_end')
      .eq('active', true)
      .then(({ data }) => {
        if (!cancelled) setEvents(eventsForDestination(dest.slug, data || []))
      })
    return () => { cancelled = true }
  }, [dest.slug])

  if (!events.length) return null

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
        Upcoming Events
      </p>
      <h2 style={{
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 900,
        fontSize: 'clamp(1.4rem, 3vw, 2rem)',
        letterSpacing: '-0.02em',
        color: DARK,
        margin: '0 0 20px',
      }}>
        Upcoming events in {dest.name}<span style={{ color: PINK }}>.</span>
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
        gap: 16,
        maxWidth: 1100,
      }}>
        {events.map((ev) => (
          <Link key={ev.slug} to={`/events/${ev.slug}`} style={{
            display: 'block',
            background: OFF_WHITE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: '20px 20px',
            textDecoration: 'none',
          }}>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PINK, marginBottom: 6 }}>
              {ev.date_label}
            </span>
            <strong style={{ display: 'block', fontSize: 15, fontWeight: 700, color: DARK, lineHeight: 1.35 }}>
              {eventHeading(ev)}
            </strong>
          </Link>
        ))}
      </div>
      <p style={{ marginTop: 20, fontSize: 13 }}>
        <Link to="/events/south-africa" style={{ color: DARK, fontWeight: 700 }}>See the full events calendar →</Link>
      </p>
    </section>
  )
}
