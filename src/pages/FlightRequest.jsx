import { useState } from 'react'
import { Link } from 'react-router-dom'

const TRIPS = [['return', 'Return'], ['oneway', 'One-way'], ['multi', 'Multi-city']]
const CABINS = ['Economy', 'Premium economy', 'Business', 'First']
const WHATSAPP = 'https://wa.me/27793825684'

const today = () => new Date().toISOString().slice(0, 10)
const fmt = d => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

const RED = '#D9293F' // accessible on white; brand #EF4056 for accents on dark
const card = { background: '#fff', border: '1px solid #E8E5E0', borderRadius: 20, padding: 28 }
const input = {
  fontFamily: 'inherit', fontSize: 15, color: '#0a0a0a', background: '#fff',
  border: '1px solid #D9D5CF', borderRadius: 12, padding: '0 14px', height: 48,
  boxSizing: 'border-box', width: '100%',
}
const label = { fontSize: 13, fontWeight: 600, color: '#3a3835' }
const field = { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }
const grid = min => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))`, gap: 14 })
const check = { display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#222', minHeight: 44, cursor: 'pointer' }

const Tick = () => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4056" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5" /></svg>
)

const FAQS = [
  ['Does it cost anything to request a quote?', 'No. Sending a request is free and doesn\'t commit you to anything, and there\'s no booking fee when you go ahead.'],
  ['How quickly will I hear back?', 'We send your quote within 24 hours. Need to fly urgently? WhatsApp us on 079 382 5684.'],
  ['Is my fare guaranteed once I get a quote?', 'Airfares change quickly. Your fare is only secured once you accept the quote and payment is received. If it has moved, we\'ll tell you before you pay.'],
  ['Can you book domestic and international flights?', 'Yes, both. Just tell us your route, dates and who\'s travelling.'],
  ['How do I pay, and when do I get my ticket?', 'Once you accept your quote we send you a secure payment link. As soon as payment is through, we issue your e-ticket by email.'],
  ['Can I add accommodation to my flight?', 'Yes. Tick "Also quote me accommodation" and we\'ll include a stay that matches your flight times.'],
]

export default function FlightRequest() {
  const [f, setF] = useState({
    trip: 'return', from: '', to: '', depart: '', returnDate: '', flexible: false,
    adults: '1', children: '0', infants: '0', cabin: 'Economy', includeStay: true,
    name: '', email: '', phone: '', airline: '', notes: '', website: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ref, setRef] = useState('')
  const [open, setOpen] = useState(0)

  const set = k => e => setF(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!f.from.trim() || !f.to.trim() || !f.name.trim() || !f.email.trim()) {
      setError('Please add where you\'re flying from and to, your name and your email so we can send your quote.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) {
      setError('That email address does not look right.')
      return
    }
    setBusy(true)
    try {
      const r = await fetch('/api/flight-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setRef(data.reference)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const sumRow = (k, v) => (
    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 15, flexWrap: 'wrap' }}>
      <span style={{ color: '#595959' }}>{k}</span><span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
    </div>
  )

  if (ref) {
    const pax = [`${f.adults} adult${f.adults === '1' ? '' : 's'}`, f.children !== '0' && `${f.children} child${f.children === '1' ? '' : 'ren'}`, f.infants !== '0' && `${f.infants} infant${f.infants === '1' ? '' : 's'}`].filter(Boolean).join(', ')
    const dates = f.depart ? fmt(f.depart) + (f.trip === 'return' && f.returnDate ? ` – ${fmt(f.returnDate)}` : '') : 'Not set'
    return (
      <div style={{ background: '#F8F7F5', minHeight: '100vh', padding: '72px 24px' }}>
        <div style={{ ...card, maxWidth: 680, margin: '0 auto', padding: '48px 32px', textAlign: 'center', borderRadius: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F5D6DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <svg role="img" aria-label="Request sent" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(30px,4vw,42px)', letterSpacing: '-0.03em', margin: '24px 0 0' }}>
            Request received<span style={{ color: '#EF4056' }}>.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: '#3a3835', margin: '14px auto 0', maxWidth: 520 }}>
            Thanks {f.name.trim().split(' ')[0]}. Your reference is <strong style={{ color: '#0a0a0a' }}>{ref}</strong>. We've emailed a copy to {f.email.trim()} and will send your quote within 24 hours.
          </p>
          <div style={{ border: '1px solid #E8E5E0', borderRadius: 16, padding: '20px 24px', marginTop: 28, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sumRow('Route', `${f.from.trim()} → ${f.to.trim()}`)}
            {sumRow('Dates', `${TRIPS.find(t => t[0] === f.trip)[1]} · ${dates}${f.flexible ? ' (flexible)' : ''}`)}
            {sumRow('Travellers', `${pax} · ${f.cabin}`)}
            {sumRow('Accommodation', f.includeStay ? 'Yes, include a stay quote' : 'Flights only')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 28 }}>
            <Link to="/destinations" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 50, padding: '0 24px', borderRadius: 99, background: RED, color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Browse stays</Link>
            <button type="button" onClick={() => { setRef(''); setF(p => ({ ...p, from: '', to: '', depart: '', returnDate: '', notes: '' })) }}
              style={{ minHeight: 50, padding: '0 24px', borderRadius: 99, border: '1px solid #0a0a0a', background: '#fff', color: '#0a0a0a', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Request another flight</button>
          </div>
          <p style={{ fontSize: 14, color: '#595959', margin: '24px 0 0' }}>Need it sooner? WhatsApp us on <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ color: RED }}>079 382 5684</a>.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F8F7F5', minHeight: '100vh' }}>
      <section style={{ background: '#0a0a0a', padding: '56px 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 360px', minWidth: 0, paddingTop: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#2a1116', color: '#F5D6DE', borderRadius: 99, padding: '6px 14px', fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4056' }} />NEW ON BLY.
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(40px,6vw,60px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: '#fff', margin: '22px 0 0' }}>
              Flights,<br /><span style={{ color: '#EF4056' }}>on request.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#c9c9c9', margin: '22px 0 0', maxWidth: 460 }}>
              Tell us where you're flying and when. Our team finds the fares, sends you a quote by email, and books it once you're happy. Domestic and international.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 30 }}>
              {['Quote within 24 hours, no booking fee', 'Add your stay and keep the whole trip with one team', 'Real people on email and WhatsApp'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#e6e6e6', fontSize: 15 }}><Tick />{t}</div>
              ))}
            </div>
          </div>

          <form onSubmit={submit} noValidate aria-label="Flight quote request" style={{ flex: '1 1 520px', minWidth: 0, background: '#fff', borderRadius: 20, padding: 'clamp(20px,4vw,32px)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, margin: 0 }}>Request a flight quote</h2>
              <div role="radiogroup" aria-label="Trip type" style={{ display: 'flex', gap: 4, background: '#f3f3f3', borderRadius: 99, padding: 4 }}>
                {TRIPS.map(([id, lbl]) => (
                  <button key={id} type="button" role="radio" aria-checked={f.trip === id} onClick={() => setF(p => ({ ...p, trip: id }))}
                    style={{ minHeight: 40, padding: '0 16px', borderRadius: 99, border: 0, background: f.trip === id ? '#0a0a0a' : 'transparent', color: f.trip === id ? '#fff' : '#444', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{lbl}</button>
                ))}
              </div>
            </div>

            <div style={grid(200)}>
              <div style={field}><label htmlFor="fl-from" style={label}>From <span style={{ color: RED }}>*</span></label>
                <input id="fl-from" style={input} value={f.from} onChange={set('from')} placeholder="City or airport" /></div>
              <div style={field}><label htmlFor="fl-to" style={label}>To <span style={{ color: RED }}>*</span></label>
                <input id="fl-to" style={input} value={f.to} onChange={set('to')} placeholder="City or airport" /></div>
            </div>

            <div style={grid(200)}>
              <div style={field}><label htmlFor="fl-dep" style={label}>Depart</label>
                <input id="fl-dep" type="date" style={input} min={today()} value={f.depart}
                  onChange={e => setF(p => ({ ...p, depart: e.target.value, returnDate: p.returnDate && p.returnDate < e.target.value ? '' : p.returnDate }))} /></div>
              {f.trip === 'return' && (
                <div style={field}><label htmlFor="fl-ret" style={label}>Return</label>
                  <input id="fl-ret" type="date" style={input} min={f.depart || today()} value={f.returnDate} onChange={set('returnDate')} /></div>
              )}
            </div>

            {f.trip === 'multi' && (
              <p style={{ margin: '-6px 0 0', fontSize: 13, color: '#555', background: '#FCEDF0', borderRadius: 10, padding: '10px 14px' }}>
                Multi-city? Add your first leg here and list the extra legs and dates in the notes below.
              </p>
            )}

            <div style={grid(130)}>
              <div style={field}><label htmlFor="fl-ad" style={label}>Adults</label>
                <select id="fl-ad" style={input} value={f.adults} onChange={set('adults')}>{['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => <option key={n}>{n}</option>)}</select></div>
              <div style={field}><label htmlFor="fl-ch" style={label}>Children (2–11)</label>
                <select id="fl-ch" style={input} value={f.children} onChange={set('children')}>{['0', '1', '2', '3', '4', '5', '6'].map(n => <option key={n}>{n}</option>)}</select></div>
              <div style={field}><label htmlFor="fl-in" style={label}>Infants</label>
                <select id="fl-in" style={input} value={f.infants} onChange={set('infants')}>{['0', '1', '2', '3'].map(n => <option key={n}>{n}</option>)}</select></div>
              <div style={field}><label htmlFor="fl-cb" style={label}>Cabin</label>
                <select id="fl-cb" style={input} value={f.cabin} onChange={set('cabin')}>{CABINS.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px' }}>
              <label style={check}><input type="checkbox" checked={f.flexible} onChange={set('flexible')} style={{ width: 20, height: 20, accentColor: RED }} />My dates are flexible (± 3 days)</label>
              <label style={check}><input type="checkbox" checked={f.includeStay} onChange={set('includeStay')} style={{ width: 20, height: 20, accentColor: RED }} />Also quote me accommodation</label>
            </div>

            <div style={{ height: 1, background: '#ececec' }} />

            <div style={grid(200)}>
              <div style={field}><label htmlFor="fl-nm" style={label}>Full name <span style={{ color: RED }}>*</span></label>
                <input id="fl-nm" style={input} autoComplete="name" value={f.name} onChange={set('name')} /></div>
              <div style={field}><label htmlFor="fl-em" style={label}>Email <span style={{ color: RED }}>*</span></label>
                <input id="fl-em" type="email" style={input} autoComplete="email" value={f.email} onChange={set('email')} /></div>
              <div style={field}><label htmlFor="fl-ph" style={label}>Mobile / WhatsApp</label>
                <input id="fl-ph" type="tel" style={input} autoComplete="tel" placeholder="+27" value={f.phone} onChange={set('phone')} /></div>
              <div style={field}><label htmlFor="fl-al" style={label}>Preferred airline (optional)</label>
                <input id="fl-al" style={input} placeholder="Any" value={f.airline} onChange={set('airline')} /></div>
            </div>

            <div style={field}><label htmlFor="fl-nt" style={label}>Anything else we should know? (optional)</label>
              <textarea id="fl-nt" rows={3} style={{ ...input, height: 'auto', padding: '12px 14px', resize: 'vertical' }} value={f.notes} onChange={set('notes')}
                placeholder="Baggage, preferred times, extra legs, special assistance" /></div>

            {/* honeypot — hidden from people, bots fill it */}
            <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

            {error && (
              <p role="alert" style={{ margin: 0, padding: '12px 14px', background: '#FDECEE', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#8a1626' }}>{error}</p>
            )}

            <button type="submit" disabled={busy} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 12, border: 0,
              background: RED, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
            }}>{busy ? 'Sending...' : 'Request my quote'}</button>
            <p style={{ margin: '-6px 0 0', fontSize: 12.5, lineHeight: 1.5, color: '#595959', textAlign: 'center' }}>
              Requesting is free and doesn't book anything. Fares are only held once you accept your quote and pay.
            </p>
          </form>
        </div>
      </section>

      <section style={{ padding: '72px 24px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.02em', margin: '0 0 28px' }}>How it works</h2>
          <div style={grid(260)}>
            {[
              ['Send your request', 'Fill in your route, dates and who\'s travelling. It takes about a minute.'],
              ['Get your quote', 'Our team checks the options and emails you a quote within 24 hours.'],
              ['Accept and fly', 'Happy with it? Pay through a secure link and we\'ll send your e-ticket.'],
            ].map(([t, d], i) => (
              <div key={t} style={{ ...card, borderRadius: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: i === 2 ? '#EF4056' : '#0a0a0a', color: i === 2 ? '#0a0a0a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{i + 1}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, margin: '18px 0 8px' }}>{t}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#555', margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', background: '#F5D6DE', borderRadius: 24, padding: 'clamp(24px,4vw,40px)', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', margin: 0 }}>Flight and stay, sorted together.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: '#3a2a2e', margin: '10px 0 0', maxWidth: 560 }}>
              Tick "Also quote me accommodation" and we'll match a stay from 45,000+ hotels worldwide to your flight times. One team, one trip.
            </p>
          </div>
          <Link to="/destinations" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 26px', borderRadius: 12, background: '#0a0a0a', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>Browse stays</Link>
        </div>
      </section>

      <section style={{ padding: '0 24px 56px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.02em', margin: '0 0 24px' }}>Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map(([q, a], i) => (
              <div key={q} style={{ border: '1px solid #E8E5E0', borderRadius: 14, background: '#fff', overflow: 'hidden' }}>
                <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}
                  style={{ width: '100%', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '0 22px', background: '#fff', border: 0, fontFamily: 'inherit', fontSize: 16, fontWeight: 600, color: '#0a0a0a', textAlign: 'left', cursor: 'pointer' }}>
                  {q}<span aria-hidden="true" style={{ fontSize: 22, color: RED, fontWeight: 400 }}>{open === i ? '−' : '+'}</span>
                </button>
                {open === i && <p style={{ margin: 0, padding: '0 22px 20px', fontSize: 15, lineHeight: 1.6, color: '#555' }}>{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', background: '#0a0a0a', borderRadius: 24, padding: 'clamp(24px,4vw,40px)', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 360px', minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#fff', margin: 0 }}>Rather just chat?</h2>
            <p style={{ fontSize: 16, color: '#c9c9c9', margin: '8px 0 0' }}>Send us your route and dates and we'll take it from there.</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 22px', borderRadius: 12, background: '#EF4056', color: '#0a0a0a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>WhatsApp 079 382 5684</a>
            <a href="mailto:info@blytravel.co.za?subject=Flight%20request" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 52, padding: '0 22px', borderRadius: 12, border: '1px solid #555', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>info@blytravel.co.za</a>
          </div>
        </div>
      </section>
    </div>
  )
}
