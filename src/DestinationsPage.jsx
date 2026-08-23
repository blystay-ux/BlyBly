import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getDestinationBySlug, getSADestinations, getInternationalDestinations } from '../data/destinations'
 
// ─────────────────────────────────────────────────────────────────────────────
// Bly — Individual Destination Landing Page
// Route: /accommodation/:slug
// e.g.  /accommodation/cape-town
// ─────────────────────────────────────────────────────────────────────────────
 
const PINK      = '#EF4056'
const DARK      = '#0a0a0a'
const OFF_WHITE = '#F8F7F5'
const BORDER    = 'rgba(0,0,0,0.09)'
const MID       = '#6b6b6b'
 
export default function DestinationPage() {
  const { slug } = useParams()
  const dest = getDestinationBySlug(slug)
 
  // ── 404 if slug not found ─────────────────────────────────────────────────
  if (!dest) return <Navigate to="/destinations" replace />
 
  // ── LodgingBusiness / TouristDestination JSON-LD ─────────────────────────
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'TouristDestination',
      name: dest.name,
      description: dest.overview[0] || dest.cardTagline,
      url: `https://blytravel.co.za/accommodation/${dest.slug}`,
      image: dest.heroImage,
      touristType: 'Leisure travellers',
      includesAttraction: dest.thingsToDo.map((a) => ({
        '@type': 'TouristAttraction',
        name: a.name,
        description: a.desc,
      })),
    }
    const el = document.createElement('script')
    el.type  = 'application/ld+json'
    el.id    = `bly-destination-schema`
    el.innerHTML = JSON.stringify(schema)
    document.head.appendChild(el)
    return () => document.getElementById('bly-destination-schema')?.remove()
  }, [dest])
 
  // ── Page title ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = `${dest.name} Accommodation | Book Direct on Bly`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content',
      `Find accommodation in ${dest.name}. ${dest.cardTagline} Book direct on Bly — no middleman, better rates.`
    )
  }, [dest])
 
  const hasFull = dest.overview.length > 0
 
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: OFF_WHITE, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
 
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: DARK,
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Hero image */}
        {dest.heroImage && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${dest.heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.65,
          }} />
        )}
        {/* Gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)',
        }} />
 
        {/* Content */}
        <div style={{
          position: 'relative',
          padding: 'clamp(48px, 8vw, 80px) clamp(24px, 6vw, 80px) clamp(48px, 7vw, 72px)',
          maxWidth: 900,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Link to="/destinations" style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Destinations
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>›</span>
            <span style={{ color: PINK, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {dest.regionLabel}
            </span>
          </div>
 
          {/* City name */}
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(3rem, 9vw, 6.5rem)',
            lineHeight: 0.95,
            color: '#F8F7F5',
            letterSpacing: '-0.02em',
            marginBottom: 24,
          }}>
            {dest.name}
          </h1>
 
          {/* Tagline */}
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontStyle: 'italic',
            fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
            color: 'rgba(255,255,255,0.75)',
            borderLeft: `3px solid ${PINK}`,
            paddingLeft: 16,
            maxWidth: 560,
            lineHeight: 1.4,
            marginBottom: 40,
          }}>
            "{dest.heroTagline}"
          </p>
 
          {/* Stat pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { icon: '✈', label: dest.flyTime },
              { icon: '💰', label: dest.currency },
              { icon: '🗓', label: `Best: ${dest.bestTimeShort}` },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 100,
                padding: '8px 16px',
                fontSize: 13,
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
              }}>
                <span>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── SEARCH STRIP ─────────────────────────────────────────────────── */}
      <section style={{
        background: '#fff',
        borderBottom: `1px solid ${BORDER}`,
        padding: '24px clamp(24px, 6vw, 80px)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: MID, marginBottom: 4 }}>
            Searching in
          </p>
          <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: DARK }}>
            {dest.name}
          </p>
        </div>
        <Link
          to={`/search?city=${encodeURIComponent(dest.searchCity)}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: PINK,
            color: '#fff',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            padding: '14px 28px',
            borderRadius: 10,
            textDecoration: 'none',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          Search accommodation →
        </Link>
      </section>
 
      {hasFull ? (
        <>
          {/* ── OVERVIEW + QUICK FACTS ─────────────────────────────────── */}
          <section style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            borderBottom: `1px solid ${BORDER}`,
          }}>
            {/* Overview */}
            <div style={{
              padding: 'clamp(36px, 5vw, 56px) clamp(24px, 6vw, 80px)',
              borderRight: `1px solid ${BORDER}`,
            }}>
              <SectionLabel>About {dest.name}</SectionLabel>
              {dest.overview.map((p, i) => (
                <p key={i} style={{
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: '#2a2a2a',
                  marginBottom: i < dest.overview.length - 1 ? 16 : 0,
                }}>
                  {p}
                </p>
              ))}
            </div>
 
            {/* Quick Facts */}
            <div style={{ padding: 'clamp(36px, 5vw, 56px) clamp(24px, 6vw, 56px)' }}>
              <SectionLabel>Quick Facts</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dest.quickFacts.map(({ key, val }) => (
                  <div key={key} style={{ display: 'flex', gap: 14 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: MID,
                      minWidth: 110,
                      paddingTop: 2,
                      flexShrink: 0,
                    }}>
                      {key}
                    </span>
                    <span style={{ fontSize: 14, color: '#2a2a2a', lineHeight: 1.5 }}>{val}</span>
                  </div>
                ))}
              </div>
 
              {/* Best time */}
              <div style={{
                marginTop: 28,
                background: OFF_WHITE,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 20,
              }}>
                <div style={{
                  display: 'inline-block',
                  background: PINK,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 11px',
                  borderRadius: 100,
                  marginBottom: 10,
                  letterSpacing: '0.04em',
                }}>
                  Best time: {dest.bestTime.badge}
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: '#444' }}>{dest.bestTime.copy}</p>
              </div>
            </div>
          </section>
 
          {/* ── THINGS TO DO ──────────────────────────────────────────── */}
          <section style={{
            background: '#111',
            padding: 'clamp(48px, 7vw, 72px) clamp(24px, 6vw, 80px)',
            borderBottom: `1px solid #1e1e1e`,
          }}>
            <SectionLabel light>Things To Do</SectionLabel>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              color: '#F8F7F5',
              marginBottom: 36,
              textWrap: 'balance',
            }}>
              Make the most of {dest.name}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
              gap: 16,
            }}>
              {dest.thingsToDo.map((activity) => (
                <div key={activity.num} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '20px 22px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 900,
                      fontSize: 11,
                      color: PINK,
                      paddingTop: 2,
                      minWidth: 18,
                    }}>
                      {activity.num}
                    </span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#F8F7F5',
                      flex: 1,
                      lineHeight: 1.3,
                    }}>
                      {activity.name}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      background: 'rgba(239,64,86,0.18)',
                      color: '#f07080',
                      padding: '3px 9px',
                      borderRadius: 100,
                      whiteSpace: 'nowrap',
                    }}>
                      {activity.tag}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13.5,
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.6,
                    paddingLeft: 28,
                    marginBottom: 8,
                  }}>
                    {activity.desc}
                  </p>
                  <p style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: PINK,
                    paddingLeft: 28,
                  }}>
                    {activity.cost}
                  </p>
                </div>
              ))}
            </div>
          </section>
 
          {/* ── INSIDER TIPS ──────────────────────────────────────────── */}
          <section style={{
            padding: 'clamp(48px, 7vw, 72px) clamp(24px, 6vw, 80px)',
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <SectionLabel>Local Insider Tips</SectionLabel>
            <h2 style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              color: DARK,
              marginBottom: 36,
              textWrap: 'balance',
            }}>
              Stuff Google won't tell you.
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
              gap: 14,
              maxWidth: 1100,
            }}>
              {dest.insiderTips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: PINK,
                    marginTop: 8,
                    flexShrink: 0,
                  }} />
                  <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#2a2a2a' }}>{tip}</p>
                </div>
              ))}
            </div>
          </section>
 
          {/* ── TRAVEL TIPS ───────────────────────────────────────────── */}
          <section style={{
            background: '#fff',
            padding: 'clamp(48px, 7vw, 72px) clamp(24px, 6vw, 80px)',
            borderBottom: `1px solid ${BORDER}`,
          }}>
            <SectionLabel>Travel Tips</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: 16,
              maxWidth: 1100,
            }}>
              {dest.travelTips.map((tip, i) => (
                <div key={i} style={{
                  background: OFF_WHITE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: '22px 20px',
                  display: 'flex',
                  gap: 16,
                }}>
                  <span style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 900,
                    fontSize: '2rem',
                    color: PINK,
                    opacity: 0.2,
                    lineHeight: 1,
                    minWidth: 28,
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <strong style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 700,
                      color: DARK,
                      marginBottom: 4,
                    }}>
                      {tip.title}
                    </strong>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: MID }}>{tip.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
 
          {/* ── BOOK NOW ──────────────────────────────────────────────── */}
          <section style={{
            background: DARK,
            padding: 'clamp(48px, 7vw, 72px) clamp(24px, 6vw, 80px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}>
            <div style={{ maxWidth: 560 }}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: PINK,
                marginBottom: 12,
              }}>
                Book Direct on Bly
              </p>
              <h2 style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
                color: '#F8F7F5',
                marginBottom: 12,
                textWrap: 'balance',
                lineHeight: 1.15,
              }}>
                {dest.bookNow.heading}
              </h2>
              <p style={{ fontSize: 15, color: '#888', lineHeight: 1.65 }}>
                {dest.bookNow.copy}
              </p>
            </div>
            <Link
              to={`/search?city=${encodeURIComponent(dest.searchCity)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: PINK,
                color: '#fff',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                padding: '16px 32px',
                borderRadius: 10,
                textDecoration: 'none',
                letterSpacing: '0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Search {dest.name} accommodation →
            </Link>
          </section>
        </>
      ) : (
        /* ── STUB: destination coming soon ────────────────────────── */
        <section style={{
          padding: 'clamp(64px, 10vw, 96px) clamp(24px, 6vw, 80px)',
          textAlign: 'center',
          maxWidth: 560,
          margin: '0 auto',
        }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: PINK,
            marginBottom: 16,
          }}>Coming soon</p>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            color: DARK,
            marginBottom: 16,
          }}>
            {dest.name} destination guide is on its way.
          </h2>
          <p style={{ fontSize: 15, color: MID, lineHeight: 1.65, marginBottom: 32 }}>
            We're writing up everything you need to know. In the meantime, search for accommodation below.
          </p>
          <Link
            to={`/search?city=${encodeURIComponent(dest.searchCity)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: PINK,
              color: '#fff',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              padding: '14px 28px',
              borderRadius: 10,
              textDecoration: 'none',
            }}
          >
            Search {dest.name} accommodation →
          </Link>
        </section>
      )}
 
      {/* ── MORE DESTINATIONS ────────────────────────────────────────── */}
      <MoreDestinations currentSlug={dest.slug} currentRegion={dest.region} />
    </div>
  )
}
 
// ── More Destinations footer strip ────────────────────────────────────────────
 
function MoreDestinations({ currentSlug, currentRegion }) {
  const all = currentRegion === 'south-africa' ? getSADestinations() : getInternationalDestinations()
  const others = all.filter((d) => d.slug !== currentSlug).slice(0, 4)
 
  return (
    <section style={{
      background: '#fff',
      borderTop: `1px solid ${BORDER}`,
      padding: 'clamp(40px, 6vw, 60px) clamp(24px, 6vw, 80px)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <h3 style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 900,
          fontSize: '1.2rem',
          color: DARK,
        }}>
          More destinations
        </h3>
        <Link to="/destinations" style={{
          fontSize: 13,
          fontWeight: 600,
          color: PINK,
          textDecoration: 'none',
        }}>
          View all →
        </Link>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
        gap: 12,
      }}>
        {others.map((d) => (
          <Link
            key={d.slug}
            to={`/accommodation/${d.slug}`}
            style={{
              display: 'block',
              background: OFF_WHITE,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: '16px 18px',
              textDecoration: 'none',
            }}
          >
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              color: DARK,
              marginBottom: 4,
            }}>
              {d.name}
            </p>
            <p style={{ fontSize: 12, color: MID }}>
              ✈ {d.flyTime}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
 
// ── Shared small component ────────────────────────────────────────────────────
 
function SectionLabel({ children, light = false }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: light ? 'rgba(255,255,255,0.4)' : MID,
      marginBottom: 16,
      paddingBottom: 10,
      borderBottom: `1px solid ${light ? 'rgba(255,255,255,0.08)' : BORDER}`,
    }}>
      {children}
    </p>
  )
}
 
