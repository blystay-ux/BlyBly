import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FEE = 100

const BENEFITS = [
  ['🏷️', 'Industry-only rates', 'Unlock special pricing the public never sees, across participating BLY. properties.'],
  ['🇿🇦', 'For the trade', 'For travel agents, property staff and tourism professionals working in South Africa.'],
  ['🔓', 'Instant access', 'Once approved, industry rates appear automatically when you browse and book.'],
]

const wrap = { minHeight: '100vh', background: '#F8F7F5', fontFamily: "'Inter', sans-serif", color: '#111', padding: '0 0 80px' }
const inner = { maxWidth: 720, margin: '0 auto', padding: '56px 24px' }
const card = { background: '#fff', borderRadius: 24, padding: '36px 36px', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }
const h1 = { fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 'clamp(34px, 6vw, 52px)', letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: 12 }
const btn = { background: '#ef4056', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 99, padding: '15px 30px', cursor: 'pointer' }
const btnDark = { ...btn, background: '#0a0a0a' }
const pill = (bg, c) => ({ display: 'inline-block', background: bg, color: c, borderRadius: 99, padding: '6px 16px', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' })

function StatusView({ membership, onReapply, applying }) {
  const navigate = useNavigate()
  const st = membership.status

  if (st === 'pending') {
    return (
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={pill('#FBF1DC', '#C98A00')}>Application under review</div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, margin: '20px 0 8px' }}>You're in the queue</h2>
        <p style={{ color: '#6B6B6B', fontSize: 15, lineHeight: 1.6 }}>
          Your industry access request is being reviewed by the BLY. team. You'll be notified once it's approved.
        </p>
      </div>
    )
  }

  if (st === 'active') {
    const expires = membership.expires_at ? new Date(membership.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : null
    return (
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={pill('#E7F5ED', '#2E9E5B')}>● Industry access active</div>
        <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, margin: '20px 0 8px' }}>You're all set</h2>
        <p style={{ color: '#6B6B6B', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
          Industry rates now appear automatically when you browse and book.
        </p>
        {expires && <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>Valid until {expires}</p>}
        <button style={btnDark} onClick={() => navigate('/search')}>Browse stays →</button>
      </div>
    )
  }

  // rejected / cancelled / expired
  const label = st === 'rejected' ? 'Application not approved' : st === 'expired' ? 'Membership expired' : 'Membership cancelled'
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={pill('#FDE7EB', '#EF4056')}>{label}</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, margin: '20px 0 8px' }}>Reapply for access</h2>
      <p style={{ color: '#6B6B6B', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
        You can submit a new industry access request below.
      </p>
      <button style={btn} onClick={onReapply} disabled={applying}>
        {applying ? 'Submitting…' : `Apply again`}
      </button>
    </div>
  )
}

export default function Industry() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  async function loadMembership() {
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('industry_memberships')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setMembership(data ?? null)
    setLoading(false)
  }

  useEffect(() => { loadMembership() }, [user])

  async function apply() {
    setApplying(true); setError('')
    const { error: err } = await supabase.from('industry_memberships').insert({
      user_id: user.id,
      status: 'pending',
      amount: FEE,
      payment_status: 'unpaid',
    })
    if (err) { setError(err.message); setApplying(false); return }
    await loadMembership()
    setApplying(false)
  }

  const showApplyForm = !membership || ['rejected', 'cancelled', 'expired'].includes(membership.status)
  const isReapply = membership && ['rejected', 'cancelled', 'expired'].includes(membership.status)

  return (
    <main style={wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');`}</style>
      <div style={inner}>

        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 12, color: '#ef4056', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>
            Industry &amp; Staff Travel
          </p>
          <h1 style={h1}>Travel rates<br />for the trade<span style={{ color: '#ef4056' }}>.</span></h1>
          <p style={{ color: '#6B6B6B', fontSize: 17, lineHeight: 1.6, maxWidth: 520, marginTop: 14 }}>
            Verified tourism professionals get access to industry-only rates on BLY. — for <strong>R{FEE} a year</strong>.
          </p>
        </div>

        {!user ? (
          <div style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔐</div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Sign in to apply</h2>
            <p style={{ color: '#6B6B6B', fontSize: 15, marginBottom: 24 }}>You'll need a BLY. account to request industry access.</p>
            <button style={btn} onClick={() => navigate('/auth')}>Sign in →</button>
          </div>
        ) : loading ? (
          <div style={{ ...card, textAlign: 'center', color: '#999' }}>Loading…</div>
        ) : showApplyForm ? (
          isReapply ? (
            <StatusView membership={membership} onReapply={apply} applying={applying} />
          ) : (
            <>
              <div style={{ display: 'grid', gap: 14, marginBottom: 28 }}>
                {BENEFITS.map(([icon, title, sub]) => (
                  <div key={title} style={{ ...card, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
                    <div>
                      <strong style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 3 }}>{title}</strong>
                      <span style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.5 }}>{sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 40, letterSpacing: '-0.04em' }}>
                  R{FEE}<span style={{ fontSize: 16, fontWeight: 500, color: '#999' }}> / year</span>
                </div>
                <p style={{ color: '#6B6B6B', fontSize: 14, margin: '8px 0 22px' }}>
                  Submit your application — the BLY. team verifies and approves access.
                  Payment is collected on approval.
                </p>
                {error && <div style={{ color: '#ef4056', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{error}</div>}
                <button style={btn} onClick={apply} disabled={applying}>
                  {applying ? 'Submitting…' : 'Apply for industry access'}
                </button>
              </div>
            </>
          )
        ) : (
          <StatusView membership={membership} onReapply={apply} applying={applying} />
        )}

      </div>
    </main>
  )
}
