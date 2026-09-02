import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FEE = 150
const IK_PAY_URL = 'https://pay.ikhokha.com/bly-travel/buy/blytravel'

const TITLES    = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof']
const COUNTRIES = [
  'South Africa', 'Namibia', 'Botswana', 'Zimbabwe', 'Mozambique',
  'Eswatini', 'Lesotho', 'United Kingdom', 'United States',
  'Germany', 'Netherlands', 'France', 'Australia', 'Other',
]
const SEGMENTS = [
  'Travel Agency', 'Tour Operator', 'Hotel / Lodge / Accommodation',
  'Airline', 'DMC / Inbound Operator', 'Tourism Board / Association',
  'Car Rental', 'Cruise', 'Other',
]

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

// ── Step 2: Details + Payment ──────────────────────────────────────────────
function PaymentStep({ userId, onMembershipCreated }) {
  const [membershipId, setMembershipId] = useState(null)
  const [saving, setSaving]             = useState(false)
  const [formError, setFormError]       = useState('')
  const [form, setForm] = useState({
    title: 'Mr', first_name: '', surname: '',
    country: '', employer_segment: '', employer_name: '', proof_ack: false,
  })

  const set = (key) => (e) =>
    setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    async function ensureMembership() {
      const { data: existing } = await supabase
        .from('industry_memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_status', 'unpaid')
        .maybeSingle()

      if (existing) {
        setMembershipId(existing.id)
        // Pre-fill form if details were already saved
        setForm(f => ({
          ...f,
          title:            existing.title            || 'Mr',
          first_name:       existing.first_name       || '',
          surname:          existing.surname           || '',
          country:          existing.country           || '',
          employer_segment: existing.employer_segment || '',
          employer_name:    existing.employer_name    || '',
          proof_ack:        existing.proof_ack        || false,
        }))
      } else {
        const { data } = await supabase
          .from('industry_memberships')
          .insert({ user_id: userId, status: 'pending', payment_status: 'unpaid' })
          .select()
          .single()
        if (data) { setMembershipId(data.id); onMembershipCreated(data) }
      }
    }
    if (userId) ensureMembership()
  }, [userId])

  async function handlePayClick() {
    // Validate required fields
    if (!form.first_name.trim() || !form.surname.trim()) {
      setFormError('Please enter your first name and surname.'); return
    }
    if (!form.country) {
      setFormError('Please select your country of residence.'); return
    }
    if (!form.employer_segment || !form.employer_name.trim()) {
      setFormError('Please enter your employer details.'); return
    }
    if (!form.proof_ack) {
      setFormError('Please acknowledge the proof of employment requirement.'); return
    }
    if (!membershipId) return

    setFormError(''); setSaving(true)

    // Save details + mark payment submitted
    await supabase
      .from('industry_memberships')
      .update({
        title:            form.title,
        first_name:       form.first_name.trim(),
        surname:          form.surname.trim(),
        country:          form.country,
        employer_segment: form.employer_segment,
        employer_name:    form.employer_name.trim(),
        proof_ack:        form.proof_ack,
        payment_status:   'submitted',
      })
      .eq('id', membershipId)

    setSaving(false)

    // Sign them out — no access until admin approves
    await supabase.auth.signOut()
    window.location.href = '/?applied=1'
  }

  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

  return (
    <div style={card}>
      <div style={stepTag}>Step 2 of 2</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>
        Your details
      </h2>
      <p style={{ color: '#777', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
        Tell us a little about yourself. These details are used to verify your trade status.
      </p>

      <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
        {/* Title */}
        <div>
          <label style={labelStyle}>Title</label>
          <select style={inputStyle} value={form.title} onChange={set('title')}>
            {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Name */}
        <div style={row2}>
          <div>
            <label style={labelStyle}>First name</label>
            <input style={inputStyle} value={form.first_name} onChange={set('first_name')} placeholder="First name" />
          </div>
          <div>
            <label style={labelStyle}>Surname</label>
            <input style={inputStyle} value={form.surname} onChange={set('surname')} placeholder="Surname" />
          </div>
        </div>

        {/* Country */}
        <div>
          <label style={labelStyle}>Country of residence</label>
          <select style={inputStyle} value={form.country} onChange={set('country')}>
            <option value="">Please select</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Employer */}
        <div style={row2}>
          <div>
            <label style={labelStyle}>I work in</label>
            <select style={inputStyle} value={form.employer_segment} onChange={set('employer_segment')}>
              <option value="">Please select</option>
              {SEGMENTS.map(sg => <option key={sg} value={sg}>{sg}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Employer / company</label>
            <input style={inputStyle} value={form.employer_name} onChange={set('employer_name')} placeholder="Company name" />
          </div>
        </div>

        {/* Proof ack */}
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13, color: '#444', lineHeight: 1.5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.proof_ack}
            onChange={set('proof_ack')}
            style={{ marginTop: 2, width: 17, height: 17, flexShrink: 0 }}
          />
          <span>
            I understand I may be required to provide proof of employment when I make a booking
            or check in to a property.
          </span>
        </label>
      </div>

      {formError && (
        <div style={{ background: '#fff0f0', color: '#cc0000', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>
          {formError}
        </div>
      )}

      {/* Price + pay button */}
      <div style={{ borderTop: '1px solid #F0EDE9', paddingTop: 24, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 38, letterSpacing: '-0.04em', marginBottom: 4 }}>
          R{FEE}
          <span style={{ fontSize: 14, fontWeight: 500, color: '#999' }}> / year</span>
        </div>
        <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Bly Insiders annual membership</p>
        <div onClick={saving ? undefined : handlePayClick} style={{ opacity: saving ? 0.5 : 1 }}>
          <IKPayButton />
        </div>
        {saving && <p style={{ color: '#aaa', fontSize: 12, marginTop: 8 }}>Saving your details…</p>}
      </div>

      <div style={infoBox}>
        <strong style={{ display: 'block', marginBottom: 4, color: '#333' }}>What happens next?</strong>
        After payment, the BLY. team will verify your details and activate your Insider access.
        You will not be able to access Insider rates until your application is approved.
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
  const status      = membership?.status
  const payStatus   = membership?.payment_status
  const showAuth    = !user
  const showLoading = user && loading
  // Show payment step when: no membership yet, or rejected/cancelled, or pending but not yet submitted/paid
  const showPayment = user && !loading && (!membership || status === 'rejected' || status === 'cancelled' || (status === 'pending' && payStatus === 'unpaid'))
  // Show pending once they've clicked Pay (payment_status = 'submitted') but admin hasn't activated yet
  const showPending = user && !loading && status === 'pending' && payStatus !== 'unpaid'
  const showActive  = user && !loading && status === 'active'

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
