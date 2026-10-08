import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

const TYPES = ['Family or friends', 'Wedding', 'Corporate or conference', 'Sports team', 'Club or church group', 'Other']
const NEEDS = ['Meeting room', 'Breakfast included', 'Airport transfers', 'Accessible rooms', 'Connecting rooms', 'Group dining']
const BUDGETS = ['Not sure yet', 'Under R1,500', 'R1,500 to R3,000', 'R3,000 to R5,000', 'R5,000 and up']

const today = () => new Date().toISOString().slice(0, 10)
const nightsBetween = (a, b) => {
  if (!a || !b) return 0
  const d = Math.round((new Date(b) - new Date(a)) / 86400000)
  return d > 0 ? d : 0
}
const fmt = d => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '')

const card = { background: '#fff', border: '1px solid #E8E5E0', borderRadius: 20, padding: 28 }
const input = {
  fontFamily: 'inherit', fontSize: 15, color: '#0a0a0a', background: '#fff',
  border: '1px solid #D9D5CF', borderRadius: 12, padding: '0 14px', height: 48,
  boxSizing: 'border-box', width: '100%',
}
const label = { fontSize: 13, fontWeight: 600, color: '#3a3835' }
const field = { display: 'flex', flexDirection: 'column', gap: 6 }
const pill = on => ({
  background: on ? '#0a0a0a' : '#fff', color: on ? '#fff' : '#0a0a0a',
  border: `1px solid ${on ? '#0a0a0a' : '#D9D5CF'}`, borderRadius: 99,
  padding: '0 18px', height: 44, fontSize: 14, fontWeight: on ? 600 : 500,
  cursor: 'pointer', fontFamily: 'inherit',
})

function Step({ n, title, children }) {
  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, width: 32, height: 32,
          borderRadius: 99, background: '#0a0a0a', color: '#fff', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
        }}>{n}</span>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function GroupRequest() {
  const [f, setF] = useState({
    groupType: TYPES[0], destination: '', checkIn: '', checkOut: '', flexible: false,
    adults: 10, children: 0, rooms: '', budget: '', needs: [], notes: '',
    name: '', email: '', phone: '', company: '', website: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ref, setRef] = useState('')

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))
  const toggleNeed = n => setF(p => ({ ...p, needs: p.needs.includes(n) ? p.needs.filter(x => x !== n) : [...p.needs, n] }))

  const s = useMemo(() => {
    const adults = Math.max(0, parseInt(f.adults, 10) || 0)
    const kids = Math.max(0, parseInt(f.children, 10) || 0)
    const suggested = Math.max(1, Math.ceil(adults / 2))
    const own = parseInt(f.rooms, 10) > 0
    const rooms = own ? parseInt(f.rooms, 10) : suggested
    const nights = nightsBetween(f.checkIn, f.checkOut)
    return {
      adults, kids, suggested, rooms, nights, own,
      dates: f.checkIn && f.checkOut
        ? `${fmt(f.checkIn)} to ${fmt(f.checkOut)}${nights ? ` (${nights} night${nights === 1 ? '' : 's'})` : ''}${f.flexible ? ', flexible' : ''}`
        : f.flexible ? 'Flexible' : 'Not set',
      guests: adults + kids ? `${adults + kids} (${adults} adult${adults === 1 ? '' : 's'}${kids ? `, ${kids} child${kids === 1 ? '' : 'ren'}` : ''})` : 'Not set',
      roomsLabel: own ? String(rooms) : adults ? `${rooms} (suggested)` : 'Not set',
      roomNights: nights && adults ? String(rooms * nights) : 'Add dates',
    }
  }, [f])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!f.destination.trim() || !f.name.trim() || !f.email.trim()) {
      setError('Please add a destination, your name and your email so we can get back to you.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) {
      setError('That email address does not look right.')
      return
    }
    setBusy(true)
    try {
      const r = await fetch('/api/group-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, rooms: f.rooms || String(s.suggested) }),
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

  const sumRow = (k, v, last) => (
    <div key={k} style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      borderBottom: last ? 'none' : '1px solid #2b2b2b', paddingBottom: last ? 0 : 12,
    }}>
      <span style={{ color: '#bdb8b1' }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{v}</span>
    </div>
  )

  return (
    <div style={{ background: '#F8F7F5', minHeight: '100vh' }}>
      <section style={{ background: '#0a0a0a', color: '#F8F7F5' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 64px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#bdb8b1' }}>Group requests</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(34px,5vw,56px)', lineHeight: 1.08, margin: '14px 0 16px', letterSpacing: '-0.03em', maxWidth: 760 }}>
            Travelling with a crowd?<br />Tell us once<span style={{ color: '#EF4056' }}>.</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: '#cfcac3', maxWidth: 620, margin: 0 }}>
            Weddings, family reunions, teams, conferences and clubs. Share the plan and a BLY consultant will come back with hotel options for your whole group.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 72px' }}>
        {ref ? (
          <div style={{ ...card, maxWidth: 720, margin: '0 auto', padding: '48px 36px', textAlign: 'center', borderRadius: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 34, margin: '0 0 12px', letterSpacing: '-0.03em' }}>
              Request received<span style={{ color: '#EF4056' }}>.</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: '#3a3835', margin: '0 auto 28px', maxWidth: 520 }}>
              Thanks {f.name.trim().split(' ')[0]}. A BLY consultant will review your group request and come back to you at {f.email.trim()} with options.
            </p>
            <div style={{ display: 'inline-block', background: '#F8F7F5', borderRadius: 16, padding: '16px 28px', marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6b6761' }}>Reference</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginTop: 4 }}>{ref}</div>
            </div>
            <div>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', border: '1px solid #0a0a0a', borderRadius: 99, padding: '0 28px', height: 48, fontSize: 15, fontWeight: 600, color: '#0a0a0a' }}>
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
            <form onSubmit={submit} style={{ flex: '999 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Step n="1" title="What kind of group?">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {TYPES.map(t => (
                    <button key={t} type="button" aria-pressed={f.groupType === t} style={pill(f.groupType === t)}
                      onClick={() => setF(p => ({ ...p, groupType: t }))}>{t}</button>
                  ))}
                </div>
              </Step>

              <Step n="2" title="Where and when?">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                  <div style={{ ...field, gridColumn: '1 / -1' }}>
                    <label htmlFor="gr-dest" style={label}>Destination or city <span style={{ color: '#EF4056' }}>*</span></label>
                    <input id="gr-dest" style={input} value={f.destination} onChange={set('destination')} placeholder="e.g. Cape Town, Zanzibar, anywhere in Bali" />
                  </div>
                  <div style={field}>
                    <label htmlFor="gr-in" style={label}>Check-in</label>
                    <input id="gr-in" type="date" style={input} min={today()} value={f.checkIn}
                      onChange={e => setF(p => ({ ...p, checkIn: e.target.value, checkOut: p.checkOut && p.checkOut <= e.target.value ? '' : p.checkOut }))} />
                  </div>
                  <div style={field}>
                    <label htmlFor="gr-out" style={label}>Check-out</label>
                    <input id="gr-out" type="date" style={input} min={f.checkIn || today()} value={f.checkOut} onChange={set('checkOut')} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontWeight: 500, cursor: 'pointer', fontSize: 15 }}>
                  <input type="checkbox" checked={f.flexible} onChange={() => setF(p => ({ ...p, flexible: !p.flexible }))} style={{ width: 20, height: 20, accentColor: '#0a0a0a' }} />
                  My dates are flexible by a few days
                </label>
              </Step>

              <Step n="3" title="Who is coming?">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
                  <div style={field}><label htmlFor="gr-ad" style={label}>Adults</label>
                    <input id="gr-ad" type="number" min="1" style={input} value={f.adults} onChange={set('adults')} /></div>
                  <div style={field}><label htmlFor="gr-ch" style={label}>Children</label>
                    <input id="gr-ch" type="number" min="0" style={input} value={f.children} onChange={set('children')} /></div>
                  <div style={field}><label htmlFor="gr-rm" style={label}>Rooms needed</label>
                    <input id="gr-rm" type="number" min="1" style={input} placeholder={String(s.suggested)} value={f.rooms} onChange={set('rooms')} /></div>
                  <div style={field}><label htmlFor="gr-bd" style={label}>Budget per room, per night</label>
                    <select id="gr-bd" style={input} value={f.budget} onChange={set('budget')}>
                      {BUDGETS.map(b => <option key={b} value={b === 'Not sure yet' ? '' : b}>{b}</option>)}
                    </select></div>
                </div>
                <p style={{ margin: '14px 0 0', fontSize: 13, color: '#6b6761', lineHeight: 1.5 }}>Leave rooms blank and we will suggest a split based on your group size.</p>
              </Step>

              <Step n="4" title="What else does the group need?">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {NEEDS.map(n => (
                    <button key={n} type="button" aria-pressed={f.needs.includes(n)} style={pill(f.needs.includes(n))} onClick={() => toggleNeed(n)}>{n}</button>
                  ))}
                </div>
                <div style={{ ...field, marginTop: 20 }}>
                  <label htmlFor="gr-nt" style={label}>Anything we should know?</label>
                  <textarea id="gr-nt" style={{ ...input, height: 110, padding: '12px 14px', resize: 'vertical' }} value={f.notes} onChange={set('notes')}
                    placeholder="Event details, accessibility needs, preferred hotel style, rooming splits" />
                </div>
              </Step>

              <Step n="5" title="How do we reach you?">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
                  <div style={field}><label htmlFor="gr-nm" style={label}>Full name <span style={{ color: '#EF4056' }}>*</span></label>
                    <input id="gr-nm" style={input} autoComplete="name" value={f.name} onChange={set('name')} /></div>
                  <div style={field}><label htmlFor="gr-em" style={label}>Email <span style={{ color: '#EF4056' }}>*</span></label>
                    <input id="gr-em" type="email" style={input} autoComplete="email" value={f.email} onChange={set('email')} /></div>
                  <div style={field}><label htmlFor="gr-ph" style={label}>Phone or WhatsApp</label>
                    <input id="gr-ph" type="tel" style={input} autoComplete="tel" placeholder="+27" value={f.phone} onChange={set('phone')} /></div>
                  <div style={field}><label htmlFor="gr-co" style={label}>Company or organisation (optional)</label>
                    <input id="gr-co" style={input} autoComplete="organization" value={f.company} onChange={set('company')} /></div>
                </div>
                {/* honeypot — hidden from people, bots fill it */}
                <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')}
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />
                {error && (
                  <p role="alert" style={{ margin: '18px 0 0', padding: '12px 14px', background: '#FDECEE', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#8a1626' }}>{error}</p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 24 }}>
                  <button type="submit" disabled={busy} style={{
                    background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 99, padding: '0 32px',
                    height: 52, fontSize: 16, fontWeight: 600, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: 'inherit',
                  }}>{busy ? 'Sending...' : 'Send group request'}</button>
                  <span style={{ fontSize: 13, color: '#6b6761', maxWidth: 340, lineHeight: 1.5 }}>Sending a request is free and does not commit you to a booking.</span>
                </div>
              </Step>
            </form>

            <aside style={{ flex: '1 1 320px', maxWidth: 400, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#0a0a0a', color: '#F8F7F5', borderRadius: 20, padding: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#bdb8b1' }}>Your request</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, lineHeight: 1.2, margin: '10px 0 20px', wordBreak: 'break-word' }}>
                  {f.destination.trim() || 'Where to?'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15 }}>
                  {sumRow('Group type', f.groupType)}
                  {sumRow('Dates', s.dates)}
                  {sumRow('Guests', s.guests)}
                  {sumRow('Rooms', s.roomsLabel)}
                  {sumRow('Room-nights', s.roomNights, true)}
                </div>
              </div>
              <div style={{ ...card, padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, margin: '0 0 14px' }}>What happens next</h3>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, lineHeight: 1.5, color: '#3a3835' }}>
                  <li>A BLY consultant reviews your request.</li>
                  <li>We send hotel options that fit your dates and group size.</li>
                  <li>You choose, and we handle the booking for the whole group.</li>
                </ol>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
