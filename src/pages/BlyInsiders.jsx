import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FEE = 150
const IK_PAY_URL = 'https://pay.ikhokha.com/bly-travel/buy/blytravel'

const BENEFITS = [
  ['🏷️', 'Insider-only rates', 'Unlock special pricing the public never sees, across participating BLY. properties.'],
  ['🇿🇦', 'For the trade', 'Available to travel agents, property staff and tourism professionals in South Africa.'],
  ['🔓', 'Instant access', 'Once verified, Insider rates appear automatically every time you browse and book.'],
]

// ── Styles ─────────────────────────────────────────────────────────────────
const wrap = {
  minHeight: '100vh', background: '#F8F7F5',
  fontFamily: "'Inter', sans-serif", color: '#111', padding: '0 0 100px',
}
const inner = { maxWidth: 680, margin: '0 auto', padding: '56px 24px' }
const card = {
  background: '#fff', borderRadius: 24, padding: '36px 32px',
  boxShadow: '0 4px 40px rgba(0,0,0,0.07)',
}
const h1style = {
  fontFamily: 'Poppins, sans-serif', fontWeight: 900,
  fontSize: 'clamp(38px, 7vw, 58px)', letterSpacing: '-0.05em',
  lineHeight: 0.93, marginBottom: 16,
}
const btn = {
  background: '#ef4056', color: '#fff', fontFamily: 'Poppins, sans-serif',
  fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 99,
  padding: '15px 30px', cursor: 'pointer',
}
const btnOutline = {
  ...btn, background: 'none', color: '#111',
  border: '1.5px solid #E0DDD9', fontSize: 14, padding: '13px 26px',
}
const inputStyle = {
  width: '100%', padding: '13px 15px', borderRadius: 12,
  border: '1.5px solid #E7E4E0', fontSize: 15,
  fontFamily: "'Inter', sans-serif", color: '#111', background: '#F8F7F5',
  boxSizing: 'border-box', outline: 'none', marginBottom: 14,
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: '#888', marginBottom: 6,
}
const pill = (bg, c) => ({
  display: 'inline-block', background: bg, color: c,
  borderRadius: 99, padding: '5px 14px', fontSize: 12, fontWeight: 700,
  letterSpacing: '0.04em', marginBottom: 20,
})
const stepTag = {
  display: 'inline-block', fontFamily: 'Poppins, sans-serif',
  fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: '#999', marginBottom: 10,
}
const infoBox = {
  background: '#F8F7F5', borderRadius: 14, padding: '16px 20px',
  fontSize: 14, color: '#555', lineHeight: 1.6, marginTop: 20,
}
const toggle = {
  display: 'flex', background: '#F8F7F5', borderRadius: 99,
  padding: 4, marginBottom: 28,
}
const tabStyle = (active) => ({
  flex: 1, padding: '10px 0', borderRadius: 99, border: 'none',
  background: active ? '#fff' : 'none',
  fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14,
  color: active ? '#111' : '#888', cursor: 'pointer',
  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
  transition: 'all 0.18s',
})

// ── iKhokha Pay Button ──────────────────────────────────────────────────────
function IKPayButton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <a
        href={IK_PAY_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', width: '100%', maxWidth: 300 }}
      >
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          width: '100%', height: 54, background: '#1D1D1B', color: '#fff',
          borderRadius: 16, fontFamily: "'Poppins', sans-serif",
          fontWeight: 700, fontSize: 17, letterSpacing: '0.01em',
        }}>
          Pay R{FEE} →
        </div>
      </a>
      <span style={{ fontSize: 11, color: '#aaa' }}>Secured by iKhokha</span>
    </div>
  )
}

// ── Step 1: Embedded auth form ─────────────────────────────────────────────
function AuthStep({ onDone }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else onDone()
    } else {
      const { data, error } = await signUp(email, password)
      if (error) setError(error.message)
      else if (data?.session) onDone()
      else setError('Please check your email to confirm your account, then return here.')
    }
    setLoading(false)
  }

  return (
    <div style={card}>
      <div style={stepTag}>Step 1 of 2</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
        Create your account
      </h2>
      <p style={{ color: '#777', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
        Already have a BLY. account? Switch to sign in below.
      </p>

      <div style={toggle}>
        <button style={tabStyle(mode === 'signup')} onClick={() => { setMode('signup'); setError('') }}>
          Create account
        </button>
        <button style={tabStyle(mode === 'login')} onClick={() => { setMode('login'); setError('') }}>
          Sign in
        </button>
      </div>

      {error && (
        <div style={{ background: '#fff0f0', color: '#cc0000', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <label style={labelStyle}>Email</label>
      <input
        style={inputStyle}
        type="email"
        value={email}
        placeholder="you@example.com"
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <label style={labelStyle}>Password</label>
      <input
        style={{ ...inputStyle, marginBottom: 22 }}
        type="password"
        value={password}
        placeholder="••••••••"
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <button style={{ ...btn, width: '100%', padding: '15px 0', fontSize: 16 }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Please wait…' : mode === 'signup' ? 'Continue to payment →' : 'Sign in →'}
      </button>
    </div>
  )
}

// ── Step 2: Payment ────────────────────────────────────────────────────────
function PaymentStep({ userId, onMembershipCreated }) {
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function ensureMembership() {
      setCreating(true)
      // Check if record already exists
      const { data: existing } = await supabase
        .from('industry_memberships')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!existing) {
        const { data } = await supabase
          .from('industry_memberships')
          .insert({ user_id: userId, status: 'pending', payment_status: 'unpaid' })
          .select()
          .single()
        if (data) onMembershipCreated(data)
      }
      setCreating(false)
    }
    if (userId) ensureMembership()
  }, [userId])

  return (
    <div style={card}>
      <div style={stepTag}>Step 2 of 2</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
        Complete your payment
      </h2>
      <p style={{ color: '#777', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
        A once-off annual fee of R{FEE} secures your Insider membership.
      </p>

      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 44, letterSpacing: '-0.04em', marginBottom: 4 }}>
          R{FEE}
          <span style={{ fontSize: 16, fontWeight: 500, color: '#999' }}> / year</span>
        </div>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Bly Insiders annual membership</p>
        {creating ? (
          <div style={{ color: '#bbb', fontSize: 14 }}>Setting up your application…</div>
        ) : (
          <IKPayButton />
        )}
      </div>

      <div style={infoBox}>
        <strong style={{ display: 'block', marginBottom: 4, color: '#333' }}>What happens next?</strong>
        After payment, the BLY. team will verify your details and activate your Insider access.
        You will not be able to access Insider rates until your application is approved.
        We'll be in touch once you're confirmed.
      </div>
    </div>
  )
}

// ── Pending view ────────────────────────────────────────────────────────────
function PendingView({ onGoHome }) {
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={pill('#FFF8E1', '#B45309')}>⏳ Awaiting approval</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, margin: '4px 0 12px' }}>
        Application received
      </h2>
      <p style={{ color: '#666', fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 28px' }}>
        Your application and payment are being reviewed by the BLY. team.
        You'll have access to Insider rates as soon as your membership is activated.
      </p>
      <button style={btn} onClick={onGoHome}>
        Return to home →
      </button>
      <p style={{ color: '#aaa', fontSize: 12, marginTop: 14 }}>
        Clicking this will sign you out until your account is activated.
      </p>
    </div>
  )
}

// ── Active view ─────────────────────────────────────────────────────────────
function ActiveView({ onSignOut }) {
  const navigate = useNavigate()
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={pill('#E7F5ED', '#2E9E5B')}>✓ Active Insider</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, margin: '4px 0 12px' }}>
        You're in.
      </h2>
      <p style={{ color: '#666', fontSize: 15, lineHeight: 1.7, maxWidth: 400, margin: '0 auto 28px' }}>
        Your Insider access is active. Exclusive rates will appear automatically when you browse stays.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button style={btn} onClick={() => navigate('/search')}>Browse stays →</button>
        <button style={btnOutline} onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function BlyInsiders() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [membership, setMembership] = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchMembership()
  }, [user])

  async function fetchMembership() {
    setLoading(true)
    const { data } = await supabase
      .from('industry_memberships')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setMembership(data || null)
    setLoading(false)
  }

  async function handleGoHome() {
    await signOut()
    navigate('/')
  }

  // ── Determine which panel to show ──
  const status = membership?.status
  const showAuth     = !user
  const showLoading  = user && loading
  const showPayment  = user && !loading && (!membership || status === 'rejected' || status === 'cancelled')
  const showPending  = user && !loading && status === 'pending'
  const showActive   = user && !loading && status === 'active'

  return (
    <main style={wrap}>
      <div style={inner}>

        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ ...pill('#111', '#fff'), marginBottom: 20, fontFamily: 'Poppins, sans-serif' }}>
            ✦ Bly Insiders
          </div>
          <h1 style={h1style}>
            Industry<br />rates. For<br />the trade.
          </h1>
          <p style={{ color: '#666', fontSize: 16, lineHeight: 1.7, maxWidth: 460 }}>
            A members-only programme for travel professionals — unlock special rates
            across every BLY. property, every stay.
          </p>
        </div>

        {/* Benefits */}
        <div style={{ display: 'grid', gap: 14, marginBottom: 44 }}>
          {BENEFITS.map(([icon, title, sub]) => (
            <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
              <div>
                <strong style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 3 }}>{title}</strong>
                <span style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.5 }}>{sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action panel */}
        {showAuth    && <AuthStep onDone={fetchMembership} />}
        {showLoading && <div style={{ ...card, textAlign: 'center', color: '#bbb', padding: '48px' }}>Loading…</div>}
        {showPayment && <PaymentStep userId={user?.id} onMembershipCreated={setMembership} />}
        {showPending && <PendingView onGoHome={handleGoHome} />}
        {showActive  && <ActiveView onSignOut={handleGoHome} />}

      </div>
    </main>
  )
}
