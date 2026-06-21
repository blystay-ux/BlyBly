import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const FEE = 100

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof']
const COUNTRIES = [
  'South Africa', 'Namibia', 'Botswana', 'Zimbabwe', 'Mozambique', 'Eswatini', 'Lesotho',
  'United Kingdom', 'United States', 'Germany', 'Netherlands', 'France', 'Australia', 'Other',
]
const SEGMENTS = [
  'Travel Agency', 'Tour Operator', 'Hotel / Lodge / Accommodation', 'Airline',
  'DMC / Inbound Operator', 'Tourism Board / Association', 'Car Rental', 'Cruise', 'Other',
]

const BENEFITS = [
  ['🏷️', 'Industry-only rates', 'Unlock special pricing the public never sees, across participating BLY. properties.'],
  ['🇿🇦', 'For the trade', 'For travel agents, property staff and tourism professionals working in South Africa.'],
  ['🔓', 'Instant access', 'Once approved, industry rates appear automatically when you browse and book.'],
]

const wrap = { minHeight: '100vh', background: '#F8F7F5', fontFamily: "'Inter', sans-serif", color: '#111', padding: '0 0 80px' }
const inner = { maxWidth: 720, margin: '0 auto', padding: '56px 24px' }
const card = { background: '#fff', borderRadius: 24, padding: '32px 32px', boxShadow: '0 4px 40px rgba(0,0,0,0.06)' }
const h1 = { fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 'clamp(34px, 6vw, 52px)', letterSpacing: '-0.05em', lineHeight: 0.95, marginBottom: 12 }
const btn = { background: '#ef4056', color: '#fff', fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 99, padding: '15px 30px', cursor: 'pointer' }
const btnDark = { ...btn, background: '#0a0a0a' }
const pill = (bg, c) => ({ display: 'inline-block', background: bg, color: c, borderRadius: 99, padding: '6px 16px', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' })
const label = { display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 6 }
const field = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E7E4E0', fontSize: 15, fontFamily: "'Inter', sans-serif", color: '#111', background: '#F8F7F5', boxSizing: 'border-box', outline: 'none' }
const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

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

  const lbl = st === 'rejected' ? 'Application not approved' : st === 'expired' ? 'Membership expired' : 'Membership cancelled'
  return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={pill('#FDE7EB', '#EF4056')}>{lbl}</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 24, margin: '20px 0 8px' }}>Reapply for access</h2>
      <p style={{ color: '#6B6B6B', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>You can submit a new industry access request below.</p>
      <button style={btn} onClick={onReapply} disabled={applying}>{applying ? 'Loading…' : 'Start a new application'}</button>
    </div>
  )
}

export default function Industry() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: 'Mr', first_name: '', surname: '', country: '',
    employer_segment: '', employer_name: '', proof_ack: false,
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

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

  async function submit() {
    setError('')
    if (!form.first_name.trim() || !form.surname.trim()) { setError('Please enter your first name and surname.'); return }
    if (!form.country) { setError('Please select your country of residence.'); return }
    if (!form.employer_segment) { setError('Please select who you work for.'); return }
    if (!form.employer_name.trim()) { setError('Please enter your employer / company name.'); return }
    if (!form.proof_ack) { setError('You must agree to provide proof of employment.'); return }

    setApplying(true)
    const { error: err } = await supabase.from('industry_memberships').insert({
      user_id: user.id,
      status: 'pending',
      amount: FEE,
      payment_status: 'unpaid',
      title: form.title,
      first_name: form.first_name.trim(),
      surname: form.surname.trim(),
      country: form.country,
      employer_segment: form.employer_segment,
      employer_name: form.employer_name.trim(),
      proof_ack: true,
    })
    if (err) { setError(err.message); setApplying(false); return }
    await supabase.from('profiles').update({ full_name: `${form.first_name.trim()} ${form.surname.trim()}` }).eq('id', user.id)
    if (refreshProfile) await refreshProfile()
    setShowForm(false)
    await loadMembership()
    setApplying(false)
  }

  const noActiveApp = !membership || ['rejected', 'cancelled', 'expired'].includes(membership.status)

  return (
    <main style={wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');`}</style>
      <div style={inner}>

        <div style={{ marginBottom: 32 }}>
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
        ) : noActiveApp && !showForm ? (
          <>
            <div style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
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
                Submit your application — the BLY. team verifies and approves access. Payment is collected on approval.
              </p>
              <button style={btn} onClick={() => setShowForm(true)}>Start application</button>
            </div>
          </>
        ) : noActiveApp && showForm ? (
          <div style={card}>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Industry access application</h2>
            <p style={{ color: '#6B6B6B', fontSize: 14, marginBottom: 24 }}>All fields are required. Your sign-in email is used for your account.</p>

            <div style={{ display: 'grid', gap: 18 }}>
              <div style={row2}>
                <div>
                  <label style={label}>Title</label>
                  <select style={field} value={form.title} onChange={set('title')}>
                    {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div />
              </div>
              <div style={row2}>
                <div>
                  <label style={label}>First name</label>
                  <input style={field} value={form.first_name} onChange={set('first_name')} placeholder="Enter first name" />
                </div>
                <div>
                  <label style={label}>Surname</label>
                  <input style={field} value={form.surname} onChange={set('surname')} placeholder="Enter surname" />
                </div>
              </div>
              <div>
                <label style={label}>Country of residence</label>
                <select style={field} value={form.country} onChange={set('country')}>
                  <option value="">Please select</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={row2}>
                <div>
                  <label style={label}>Who do you work for?</label>
                  <select style={field} value={form.employer_segment} onChange={set('employer_segment')}>
                    <option value="">Please select</option>
                    {SEGMENTS.map((sg) => <option key={sg} value={sg}>{sg}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Employer / company</label>
                  <input style={field} value={form.employer_name} onChange={set('employer_name')} placeholder="e.g. BlackBrick Hotels" />
                </div>
              </div>

              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, color: '#333', lineHeight: 1.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.proof_ack} onChange={set('proof_ack')} style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }} />
                <span>I understand I will be required to provide proof of employment to the hotel or supplier when I make a booking and when I check in to the hotel or receive the tourism supplier service.</span>
              </label>

              {error && <div style={{ color: '#ef4056', fontSize: 13, fontWeight: 600 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button style={btn} onClick={submit} disabled={applying}>
                  {applying ? 'Submitting…' : 'Submit application'}
                </button>
                <button style={{ ...btn, background: 'none', color: '#6B6B6B', border: '1.5px solid #E7E4E0' }} onClick={() => { setShowForm(false); setError('') }} disabled={applying}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <StatusView membership={membership} onReapply={() => setShowForm(true)} applying={applying} />
        )}

      </div>
    </main>
  )
}
