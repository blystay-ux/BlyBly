import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const s = {
  page: {
    minHeight: 'calc(100vh - var(--nav-height))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 20px',
    background: 'linear-gradient(160deg, #f8f8f6 0%, #f0ede8 100%)',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '44px 40px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
  },
  logoText: {
    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 26,
    letterSpacing: '-1.5px', color: 'var(--text)',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: '#1a1a2e', color: '#fff',
    borderRadius: 99, padding: '5px 12px',
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  dividerLine: {
    borderTop: '1.5px solid var(--border)',
    margin: '0 0 28px',
  },
  title: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26,
    letterSpacing: '-0.8px', marginBottom: 6, color: 'var(--text)',
  },
  sub: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.5 },
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
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%', padding: '14px 0', borderRadius: 99,
    background: '#1a1a2e', color: '#fff',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
    border: 'none', cursor: 'pointer', marginTop: 8,
    transition: 'opacity 0.2s',
    letterSpacing: '-0.3px',
  },
  btnDisabled: {
    opacity: 0.5, cursor: 'not-allowed',
  },
  error: {
    background: '#fff0f0', color: '#cc0000', borderRadius: 10,
    padding: '11px 14px', fontSize: 13, marginBottom: 16,
    border: '1px solid #ffd0d0',
  },
  footer: {
    borderTop: '1px solid var(--border)',
    marginTop: 28, paddingTop: 20,
    display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
  },
  footerLink: {
    fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none',
  },
  helpText: {
    fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
    lineHeight: 1.6,
  },
}

export default function CorporateLogin() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await signIn(email.trim(), password)

      if (signInError) {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }

      // Check role — profile is loaded by AuthContext after signIn
      // Give AuthContext a moment to load the profile
      let attempts = 0
      const checkRole = async () => {
        // Import supabase directly to read the profile
        const { supabase } = await import('../lib/supabase')
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (!profile) {
          if (attempts < 5) {
            attempts++
            setTimeout(checkRole, 400)
          } else {
            setError('Could not verify your account. Please try again.')
            setLoading(false)
          }
          return
        }

        if (profile.role !== 'corporate') {
          // Sign them back out — wrong portal
          const { supabase: sb } = await import('../lib/supabase')
          await sb.auth.signOut()
          setError('This portal is for corporate accounts only. To sign in as a traveller, use the main login.')
          setLoading(false)
          return
        }

        // Correct role — send to search
        navigate('/')
      }

      await checkRole()
    } catch (err) {
      console.error('Corporate login error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo + badge */}
        <div style={s.logoRow}>
          <span style={s.logoText}>bly.</span>
          <span style={s.badge}>🏢 Corporate Portal</span>
        </div>
        <div style={s.dividerLine} />

        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>
          Sign in to access your corporate travel rates and book accommodation on behalf of your company.
        </p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Corporate Email</label>
          <input
            style={s.input}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In to Corporate Portal'}
          </button>
        </form>

        <div style={s.footer}>
          <p style={s.helpText}>
            Don't have a corporate account?{' '}
            <a href="mailto:corporate@bly.travel" style={{ color: '#1a1a2e', fontWeight: 600 }}>
              Contact us
            </a>{' '}
            to set one up.
          </p>
          <Link to="/auth" style={s.footerLink}>
            Sign in as a traveller instead →
          </Link>
        </div>
      </div>
    </div>
  )
}
