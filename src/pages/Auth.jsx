import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const s = {
  page: {
    minHeight: 'calc(100vh - var(--nav-height))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '40px 36px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 4px 40px rgba(0,0,0,0.08)',
  },
  extranetBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#fff7ed', color: '#c2410c',
    borderRadius: 99, padding: '6px 14px',
    fontSize: 12, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    marginBottom: 24,
  },
  toggle: {
    display: 'flex', background: 'var(--bg)', borderRadius: 99,
    padding: 4, marginBottom: 32,
  },
  tab: (active) => ({
    flex: 1, padding: '10px 0', borderRadius: 99, border: 'none',
    background: active ? '#fff' : 'none',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
    color: active ? 'var(--text)' : 'var(--text-muted)',
    cursor: 'pointer',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.2s',
  }),
  title: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28,
    letterSpacing: '-1px', marginBottom: 6,
  },
  sub: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: '1.5px solid var(--border)', fontSize: 15,
    fontFamily: 'var(--font-body)', marginBottom: 16,
    outline: 'none', color: 'var(--text)', background: 'var(--bg)',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '14px 0', borderRadius: 99,
    background: 'var(--text)', color: '#fff',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
    border: 'none', cursor: 'pointer', marginTop: 8,
  },
  error: {
    background: '#fff0f0', color: '#cc0000', borderRadius: 10,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  success: {
    background: '#f0fff4', color: '#006620', borderRadius: 10,
    padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  divider: {
    borderTop: '1px solid var(--border)',
    margin: '24px 0 20px',
  },
  backLink: {
    display: 'block', textAlign: 'center',
    fontSize: 13, color: 'var(--text-muted)',
    cursor: 'pointer', marginTop: 20,
  },
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const isExtranet = searchParams.get('mode') === 'extranet'

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit() {
    setError(''); setMessage(''); setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        // Extranet users go to their hotel dashboard; guests go home
        navigate(isExtranet ? '/extranet' : '/')
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    }

    setLoading(false)
  }

  // Allow Enter key to submit
  function handleKey(e) {
    if (e.key === 'Enter') handleSubmit()
  }

  // ── Extranet layout ────────────────────────────────────────────────────────
  if (isExtranet) {
    return (
      <div style={s.page}>
        <div style={s.card}>

          {/* Extranet badge */}
          <div style={s.extranetBadge}>
            🔑 Hotel Extranet
          </div>

          <div style={s.title}>Partner sign in.</div>
          <div style={s.sub}>
            Access your hotel dashboard to manage listings, rates, and bookings.
          </div>

          {error   && <div style={s.error}>{error}</div>}
          {message && <div style={s.success}>{message}</div>}

          <label style={s.label}>Email</label>
          <input
            style={s.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKey}
            placeholder="hotel@example.com"
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            placeholder="••••••••"
          />

          <button style={s.btn} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Signing in…' : 'Access Extranet →'}
          </button>

          <hr style={s.divider} />

          <p style={{ ...s.sub, marginBottom: 0, textAlign: 'center' }}>
            Not listed yet?{' '}
            <span
              onClick={() => navigate('/list-hotel')}
              style={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
            >
              List your property
            </span>
          </p>

          <span
            style={s.backLink}
            onClick={() => navigate('/')}
          >
            ← Back to Bly.
          </span>

        </div>
      </div>
    )
  }

  // ── Guest / standard layout ────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Sign in / Create account toggle */}
        <div style={s.toggle}>
          <button style={s.tab(mode === 'login')} onClick={() => setMode('login')}>
            Sign in
          </button>
          <button style={s.tab(mode === 'signup')} onClick={() => setMode('signup')}>
            Create account
          </button>
        </div>

        <div style={s.title}>
          {mode === 'login' ? 'Welcome back.' : 'Join Bly.'}
        </div>
        <div style={s.sub}>
          {mode === 'login'
            ? 'Sign in to manage your bookings.'
            : 'Create an account to start booking.'}
        </div>

        {error   && <div style={s.error}>{error}</div>}
        {message && <div style={s.success}>{message}</div>}

        <label style={s.label}>Email</label>
        <input
          style={s.input}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKey}
          placeholder="you@example.com"
        />

        <label style={s.label}>Password</label>
        <input
          style={s.input}
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKey}
          placeholder="••••••••"
        />

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading
            ? 'Please wait…'
            : mode === 'login' ? 'Sign in →' : 'Create account →'}
        </button>

      </div>
    </div>
  )
}
