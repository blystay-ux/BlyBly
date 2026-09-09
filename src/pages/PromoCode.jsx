import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s = {
  page: {
    minHeight: '100vh', background: '#F8F7F5',
    padding: '60px 20px 80px', display: 'flex',
    alignItems: 'flex-start', justifyContent: 'center',
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
    </main>
  )
}
