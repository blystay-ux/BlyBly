import { useState } from 'react'
import { supabase } from '../lib/supabase'

const DRAW_DATE = new Date('2026-09-30T21:59:59Z')

function useCountdown() {
  const [, setTick] = useState(0)
  setTimeout(() => setTick(t => t + 1), 1000)
  const diff = Math.max(0, DRAW_DATE - new Date())
  return {
    days:  String(Math.floor(diff / 86400000)).padStart(2, '0'),
    hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
    mins:  String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
    secs:  String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
  }
}

export default function Win() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', travel_professional: false, marketing_consent: false,
  })
  const [status, setStatus] = useState('idle')
  const cd = useCountdown()

  const set = key => e =>
    setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    const { error } = await supabase.from('competition_entries').insert({
      first_name:          form.first_name.trim(),
      last_name:           form.last_name.trim(),
      email:               form.email.trim().toLowerCase(),
      phone:               form.phone.trim() || null,
      travel_professional: form.travel_professional,
      marketing_consent:   form.marketing_consent,
    })
    if (!error) { setStatus('success'); return }
    if (error.code === '23505') { setStatus('duplicate'); return }
    setStatus('error')
  }

  const pink = '#EF4056'
  const gold = '#c8a96e'
  const white = '#F8F7F5'
  const muted = 'rgba(248,247,245,0.55)'
  const border = '1px solid rgba(248,247,245,0.08)'

  const inputStyle = {
    width: '100%', background: '#1c1c1c',
    border: '1px solid rgba(248,247,245,0.12)',
    borderRadius: 10, padding: '12px 14px',
    fontSize: 14, color: white, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: white, fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: border, position: 'sticky', top: 0, background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: white, textDecoration: 'none' }}>BLY<span style={{ color: pink }}>.</span></a>
        <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,247,245,0.5)', border, padding: '5px 12px', borderRadius: 20 }}>September Giveaway</span>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '96px 24px 72px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: pink, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: pink, display: 'inline-block' }} /> Now Open · Closes 30 Sep 2026
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(40px,6vw,72px)', fontWeight: 700, lineHeight: 1.08, marginBottom: 20 }}>
          Your next weekend away<br /><em>is on us.</em>
        </h1>
        <p style={{ color: muted, fontSize: 17, maxWidth: 520, margin: '0 auto 36px' }}>
          We built Bly to make great South African stays easier to find. To celebrate our launch, we're giving one away.
        </p>
        <a href="#enter" style={{ display: 'inline-block', background: pink, color: '#fff', padding: '16px 36px', borderRadius: 50, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Enter the draw →</a>
      </section>

      {/* COUNTDOWN */}
      <div style={{ background: '#141414', borderTop: border, borderBottom: border, padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: muted, marginBottom: 16 }}>Draw closes in</div>
        <div style={{ display: 'inline-flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['Days', cd.days], ['Hours', cd.hours], ['Minutes', cd.mins], ['Seconds', cd.secs]].map(([unit, val]) => (
            <div key={unit} style={{ background: '#1c1c1c', border, borderRadius: 10, padding: '14px 20px', minWidth: 72, textAlign: 'center' }}>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, display: 'block', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
              <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, display: 'block', marginTop: 6 }}>{unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PRIZE */}
      <section style={{ padding: '80px 24px 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', background: '#141414', border: '1px solid rgba(200,169,110,0.25)', borderRadius: 20, padding: '40px' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: gold, marginBottom: 12 }}>The Prize</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 36, fontWeight: 700, lineHeight: 1.15, marginBottom: 24 }}>Two nights,<br />two people,<br />South Africa.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {[['🌙','2 Nights'],['👥','2 People'],['📍',"SA Destination of Winner's Choice"],['🏨','Booked via BLY.'],['💳','Breakfast Included']].map(([icon, label]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.22)', borderRadius: 20, padding: '7px 14px', fontSize: 13, color: gold }}><span>{icon}</span>{label}</span>
            ))}
          </div>
          <div style={{ color: 'rgba(248,247,245,0.6)', fontSize: 14, lineHeight: 1.75 }}>
            One winner gets an accommodation credit to book any qualifying property on blytravel.co.za within South Africa — Cape Town, Durban, Hermanus, the Winelands, or wherever calls you. Valid for travel through March 2027.
          </div>
        </div>
      </section>

      {/* HOW TO ENTER */}
      <section style={{ padding: '72px 24px 0' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, marginBottom: 24 }}>How to enter</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[['Step 01','Fill in the form','Just your name and email. Takes 30 seconds.'],['Step 02',"You're in",'One entry per person. Draw on 30 September. Winner contacted by email.']].map(([num, title, body]) => (
              <div key={num} style={{ background: '#141414', border, borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: pink, marginBottom: 12 }}>{num}</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ color: muted, fontSize: 14, lineHeight: 1.65 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section style={{ padding: '72px 24px 80px' }} id="enter">
        <div style={{ maxWidth: 540, margin: '0 auto', background: '#141414', border, borderRadius: 20, padding: 40 }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '48px 0 32px' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,64,86,0.12)', border: '1px solid rgba(239,64,86,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 24 }}>✓</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, marginBottom: 12 }}>You're in the draw.</h3>
              <p style={{ color: muted, fontSize: 15, maxWidth: 380, margin: '0 auto', lineHeight: 1.65 }}>We'll contact the winner by email on 1 October 2026. Keep an eye on your inbox — and on blytravel.co.za for more South African stays worth winning.</p>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, marginBottom: 8 }}>Enter the draw.</h2>
              <p style={{ color: muted, fontSize: 14, marginBottom: 28 }}>One form. No follow loops. No tag requirements. Just your details.</p>

              {status === 'duplicate' && <div style={{ background: 'rgba(239,64,86,0.1)', border: '1px solid rgba(239,64,86,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: pink }}>This email has already been entered. Only one entry per person.</div>}
              {status === 'error' && <div style={{ background: 'rgba(239,64,86,0.1)', border: '1px solid rgba(239,64,86,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: pink }}>Something went wrong — please try again.</div>}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: muted, marginBottom: 7 }}>First name *</label>
                    <input style={inputStyle} value={form.first_name} onChange={set('first_name')} placeholder="Jana" required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: muted, marginBottom: 7 }}>Last name *</label>
                    <input style={inputStyle} value={form.last_name} onChange={set('last_name')} placeholder="van der Berg" required />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, color: muted, marginBottom: 7 }}>Email address *</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="jana@example.com" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, color: muted, marginBottom: 7 }}>Phone number (optional)</label>
                  <input style={inputStyle} type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 000 0000" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <input type="checkbox" id="pro" checked={form.travel_professional} onChange={set('travel_professional')} style={{ accentColor: pink, width: 16, height: 16, cursor: 'pointer' }} />
                  <label htmlFor="pro" style={{ fontSize: 13, color: 'rgba(248,247,245,0.7)', cursor: 'pointer' }}>I'm a travel professional (agent / tour operator / industry)</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 28, background: 'rgba(248,247,245,0.04)', border: '1px solid rgba(248,247,245,0.08)', borderRadius: 10, padding: '14px' }}>
                  <input type="checkbox" id="marketing" checked={form.marketing_consent} onChange={set('marketing_consent')} style={{ accentColor: pink, width: 16, height: 16, cursor: 'pointer', flexShrink: 0, marginTop: 1 }} />
                  <label htmlFor="marketing" style={{ fontSize: 13, color: 'rgba(248,247,245,0.7)', cursor: 'pointer', lineHeight: 1.6 }}>
                    I'd like to receive travel deals, inspiration, and updates from BLY Travel by email. You can unsubscribe at any time. <span style={{ color: 'rgba(248,247,245,0.35)' }}>(Optional — does not affect your entry)</span>
                  </label>
                </div>
                <button type="submit" disabled={status === 'loading'} style={{ width: '100%', background: pink, color: '#fff', border: 'none', borderRadius: 50, padding: '15px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1 }}>
                  {status === 'loading' ? 'Entering…' : 'Enter the draw →'}
                </button>
              </form>
              <p style={{ fontSize: 11, color: 'rgba(248,247,245,0.35)', marginTop: 16, textAlign: 'center', lineHeight: 1.75 }}>
                We never share your details. One entry per person. SA residents 18+ only.<br />Your personal information is processed in accordance with POPIA.
              </p>
            </>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '48px 40px', borderTop: border, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>BLY<span style={{ color: pink }}>.</span></div>
        <div style={{ fontSize: 12, color: muted, marginBottom: 28 }}>South Africa's stays, made simple.</div>
        <div style={{ fontSize: 11, color: 'rgba(248,247,245,0.28)', maxWidth: 600, margin: '0 auto', lineHeight: 1.75 }}>
          Competition terms: Open to South African residents aged 18 and over. One entry per person. The draw will take place on 30 September 2026 and the winner will be notified by email within 48 hours. The prize is an accommodation credit valid for bookings made through blytravel.co.za for South African properties only, for travel completed before 31 March 2027. The prize is non-transferable and cannot be exchanged for cash. BLY Travel (Pty) Ltd reserves the right to substitute a prize of equal or greater value. The promoter's decision is final. No purchase necessary to enter.
        </div>
      </footer>
    </div>
  )
}
