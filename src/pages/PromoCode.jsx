import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s = {
  page: {
    minHeight: '100vh', background: '#F8F7F5',
    padding: '60px 20px 80px', display: 'flex',
    alignItems: 'center', justifyContent: 'flex-start',
    flexDirection: 'column', gap: 32,
  },
  card: {
    width: '100%', maxWidth: 480, background: '#fff',
    borderRadius: 24, padding: '44px 40px',
    boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
  },
  eyebrow: {
    fontSize: 11, fontWeight: 800, letterSpacing: '0.18em',
    color: '#ef4056', textTransform: 'uppercase', marginBottom: 8,
  },
  heading: {
    fontWeight: 800, fontSize: 32, letterSpacing: '-0.05em',
    color: '#1a1a2e', lineHeight: 1.1, marginBottom: 6,
    fontFamily: 'var(--font-display)',
  },
  sub: { fontSize: 14, color: '#888', marginBottom: 32, lineHeight: 1.6 },
  input: {
    width: '100%', padding: '14px 18px', borderRadius: 14,
    border: '2px solid #e2e0db', fontSize: 20, fontWeight: 800,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    boxSizing: 'border-box', outline: 'none',
    fontFamily: 'var(--font-body)', color: '#1a1a2e', textAlign: 'center',
    transition: 'border-color 0.15s',
  },
  btn: {
    marginTop: 16, width: '100%', padding: '15px', borderRadius: 99,
    background: '#ef4056', color: '#fff', fontWeight: 700, fontSize: 15,
    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)',
    transition: 'opacity 0.15s',
  },
  successBox: {
    marginTop: 24, background: '#dcfce7', borderRadius: 16,
    padding: '24px', textAlign: 'center',
  },
  errorBox: {
    marginTop: 14, background: '#fee2e2', color: '#dc2626',
    borderRadius: 10, padding: '12px 16px', fontSize: 14, fontWeight: 600,
  },
  secondaryBtn: {
    marginTop: 10, width: '100%', padding: '12px', borderRadius: 99,
    background: 'transparent', color: '#888', fontWeight: 600, fontSize: 14,
    border: '1.5px solid #e2e0db', cursor: 'pointer',
  },
}

// Featured events with a partner-hotel offer. Add new entries here.
const EVENT_OFFERS = [
  {
    id: 'praise-the-loud',
    title: 'Praise the Loud Fest',
    image: '/images/events/praise-the-loud.jpg',
    imageAlt: 'Praise the Loud Fest poster: Ac/Es, Black Heidi, BOO!, Fuzigish, Cutting Jade and #SOZLOL, 24 October at Sognage, doors open 4PM',
    date: 'Saturday 24 October 2026',
    venue: 'Sognage',
    doors: 'Doors open 4PM',
    lineup: ['Ac/Es', 'Black Heidi', 'BOO!', 'Fuzigish', 'Cutting Jade', '#SOZLOL'],
    hotel: 'Hotel Sky Sandton',
    code: 'PROMF0',
    url: 'https://direct-book.com/properties/HotelSkySandtonDIRECT?locale=en&items[0][adults]=2&items[0][children]=0&items[0][infants]=0&currency=ZAR&checkInDate=2026-10-23&checkOutDate=2026-10-24&trackPage=yes&promocode=PROMF0',
  },
]

function EventOffer({ ev }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(ev.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) { /* clipboard unavailable: the code is shown on screen anyway */ }
  }
  return (
    <section style={{ width: '100%', maxWidth: 720, background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
      <img src={ev.image} alt={ev.imageAlt} style={{ display: 'block', width: '100%', height: 'auto' }} />
      <div style={{ padding: '28px 32px 32px' }}>
        <div style={s.eyebrow}>Event offer</div>
        <h2 style={{ ...s.heading, fontSize: 28, margin: '0 0 6px' }}>
          {ev.title}<span style={{ color: '#ef4056' }}>.</span>
        </h2>
        <div style={{ fontSize: 15, color: '#1a1a2e', fontWeight: 600 }}>{ev.date} · {ev.venue}</div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 2 }}>{ev.doors}</div>
        <div style={{ fontSize: 14, color: '#555', marginTop: 14, lineHeight: 1.6 }}>
          Live: {ev.lineup.join(', ')}.
        </div>
        <div style={{ marginTop: 22, padding: '16px 18px', borderRadius: 16, background: '#F8F7F5', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Promo code for {ev.hotel}</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.1em', color: '#1a1a2e' }}>{ev.code}</div>
          </div>
          <button type="button" onClick={copy} style={{ padding: '10px 20px', borderRadius: 99, border: '1.5px solid #1a1a2e', background: 'transparent', color: '#1a1a2e', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
        <a href={ev.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', marginTop: 16, textAlign: 'center', padding: '15px', borderRadius: 99, background: '#ef4056', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
          Check availability at {ev.hotel} →
        </a>
        <div style={{ marginTop: 10, fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
          Opens the hotel&apos;s own booking page in a new tab. Example search: 23 to 24 October, 2 adults. Change the dates there if needed.
        </div>
      </div>
    </section>
  )
}

export default function PromoCode() {
  const navigate = useNavigate()
  const [code,   setCode]   = useState('')
  const [status, setStatus] = useState(null) // null | 'checking' | 'valid' | 'invalid'
  const [promo,  setPromo]  = useState(null)
  const [error,  setError]  = useState(null)

  async function validate() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setStatus('checking')
    setError(null)

    const { data, error: dbErr } = await supabase
      .from('promo_codes')
      .select('id, code, discount_pct, expires_at, max_uses, uses_count, active')
      .eq('code', trimmed)
      .maybeSingle()

    if (dbErr || !data) {
      setStatus('invalid')
      setError('Code not found. Check your spelling and try again.')
      return
    }
    if (!data.active) {
      setStatus('invalid')
      setError('This promo code is no longer active.')
      return
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setStatus('invalid')
      setError('This promo code has expired.')
      return
    }
    if (data.max_uses && data.uses_count >= data.max_uses) {
      setStatus('invalid')
      setError('This promo code has reached its usage limit.')
      return
    }

    // Valid — persist in sessionStorage for Checkout to read
    sessionStorage.setItem('bly_promo', JSON.stringify({
      code: data.code,
      discount_pct: data.discount_pct,
      id: data.id,
    }))
    setPromo(data)
    setStatus('valid')
  }

  function reset() {
    setStatus(null)
    setCode('')
    setPromo(null)
    setError(null)
    sessionStorage.removeItem('bly_promo')
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.eyebrow}>Special offer</div>
        <div style={s.heading}>
          Enter promo code<span style={{ color: '#ef4056' }}>.</span>
        </div>
        <div style={s.sub}>
          Have a discount code? Enter it below and your saving will be applied automatically at checkout.
        </div>

        {status !== 'valid' ? (
          <>
            <input
              style={{ ...s.input, borderColor: status === 'invalid' ? '#ef4056' : '#e2e0db' }}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && validate()}
              placeholder="ENTER CODE"
              maxLength={32}
              autoFocus
            />
            {error && <div style={s.errorBox}>{error}</div>}
            <button
              style={{
                ...s.btn,
                opacity: (!code.trim() || status === 'checking') ? 0.5 : 1,
                cursor: (!code.trim() || status === 'checking') ? 'not-allowed' : 'pointer',
              }}
              onClick={validate}
              disabled={!code.trim() || status === 'checking'}
            >
              {status === 'checking' ? 'Checking…' : 'Apply code'}
            </button>
          </>
        ) : (
          <>
            <div style={s.successBox}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 28, color: '#16a34a', letterSpacing: '-0.04em' }}>
                {promo.discount_pct}% off
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginTop: 6, letterSpacing: '0.08em' }}>
                {promo.code}
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 10, lineHeight: 1.5 }}>
                Your discount will be applied automatically at checkout.
              </div>
            </div>
            <button
              style={{ ...s.btn, marginTop: 20, background: '#1a1a2e' }}
              onClick={() => navigate('/search')}
            >
              Start booking →
            </button>
            <button style={s.secondaryBtn} onClick={reset}>
              Use a different code
            </button>
          </>
        )}
      </div>

      {EVENT_OFFERS.map(ev => <EventOffer key={ev.id} ev={ev} />)}
    </main>
  )
}
