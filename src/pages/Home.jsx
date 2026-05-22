import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ComingSoon() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', propertyName: '',
    propertyType: '', email: '', phone: '', city: '', notes: ''
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const scrollToForm = (e) => {
    e.preventDefault()
    document.getElementById('list').scrollIntoView({ behavior: 'smooth' })
  }

  const submit = async () => {
    setError('')
    const required = [
      ['firstName', 'First Name'], ['lastName', 'Surname'],
      ['propertyName', 'Property Name'], ['propertyType', 'Property Type'],
      ['email', 'Email Address'], ['phone', 'Phone Number'], ['city', 'City / Town']
    ]
    for (const [field, label] of required) {
      if (!form[field].trim()) { setError(`Please fill in your ${label}.`); return }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.'); return
    }

    setLoading(true)
    const { error: sbError } = await supabase.from('property_leads').insert({
      first_name:    form.firstName.trim(),
      last_name:     form.lastName.trim(),
      property_name: form.propertyName.trim(),
      property_type: form.propertyType.trim(),
      email:         form.email.trim(),
      phone:         form.phone.trim(),
      city:          form.city.trim(),
      notes:         form.notes.trim(),
    })
    setLoading(false)

    if (sbError) { setError('Something went wrong. Please try again.'); return }
    setSuccess(true)
  }

  return (
    <main style={{ fontFamily: "'Inter', sans-serif", background: '#F8F7F5', color: '#000', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; pointer-events: none; animation: drift 12s ease-in-out infinite alternate; }
        .blob-1 { width: 600px; height: 600px; background: #F5D6DE; top: -100px; right: -150px; }
        .blob-2 { width: 400px; height: 400px; background: #ffd6d6; bottom: 0; left: -100px; animation-delay: -4s; }
        .blob-3 { width: 300px; height: 300px; background: #F5D6DE; top: 40%; right: 20%; animation-delay: -8s; }
        @keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(30px,-40px) scale(1.08); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fadeUp-1 { animation: fadeUp 0.6s 0.0s ease both; }
        .fadeUp-2 { animation: fadeUp 0.6s 0.1s ease both; }
        .fadeUp-3 { animation: fadeUp 0.6s 0.2s ease both; }
        .fadeUp-4 { animation: fadeUp 0.6s 0.3s ease both; }
        .fadeUp-5 { animation: fadeUp 0.6s 0.4s ease both; }
        .pulse-dot { animation: pulse 1.5s ease-in-out infinite; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #ef4056 !important; box-shadow: 0 0 0 3px rgba(239,64,86,0.1); }
        @media (max-width: 768px) {
          .hero-inner { padding: 100px 20px 60px !important; }
          .form-grid { grid-template-columns: 1fr !important; gap: 48px !important; padding: 70px 20px !important; }
          .form-row { grid-template-columns: 1fr !important; }
          .form-card { padding: 28px 20px !important; }
          .trust-strip { padding: 20px !important; gap: 16px !important; }
          nav { padding: 16px 20px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F7F5', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>
          Bly<span style={{ color: '#ef4056' }}>.</span>
        </span>
        <a href="#list" onClick={scrollToForm} style={{ background: '#000', color: '#fff', fontFamily: 'Poppins', fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 99, textDecoration: 'none' }}>
          List your property
        </a>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="hero-inner" style={{ position: 'relative', zIndex: 2, maxWidth: 900, padding: '120px 40px 80px' }}>

          {/* Pill */}
          <div className="fadeUp-1" style={{ display: 'inline-flex', alignItems: 'center', background: '#000', color: '#fff', fontFamily: 'Poppins', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 18px', borderRadius: 99, marginBottom: 32 }}>
            <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4056', display: 'inline-block', marginRight: 10 }} />
            Coming Soon
          </div>

          {/* Headline */}
          <h1 className="fadeUp-2" style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 'clamp(52px, 9vw, 110px)', lineHeight: 0.9, letterSpacing: '-0.06em', marginBottom: 28 }}>
            Bly waar<br />dit saak<br />maak<span style={{ color: '#ef4056' }}>.</span>
          </h1>

          <p className="fadeUp-3" style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#6B6B6B', maxWidth: 520, lineHeight: 1.6, marginBottom: 44 }}>
            South Africa's new way to discover and book local stays — direct, simple, and better value. We're launching soon.
          </p>

          <div className="fadeUp-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
            <a href="#list" onClick={scrollToForm} style={{ background: '#ef4056', color: '#fff', fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, padding: '16px 36px', borderRadius: 99, textDecoration: 'none', boxShadow: '0 8px 32px rgba(239,64,86,0.35)' }}>
              Want to list your property? →
            </a>
          </div>

          {/* Tagline */}
          <div className="fadeUp-5" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 60 }}>
            <div style={{ height: 2, width: 48, background: '#000', borderRadius: 2 }} />
            <p style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              Bly<span style={{ color: '#ef4056' }}>.</span> where it matters
            </p>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="trust-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', padding: '24px 40px', borderTop: '1px solid rgba(0,0,0,0.07)', background: '#F8F7F5' }}>
        {[['🏷️','Better direct rates'],['❤️','Support local stays'],['🛡️','Secure & simple booking'],['🇿🇦','100% South African']].map(([icon, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#6B6B6B' }}>
            <span style={{ fontSize: 18 }}>{icon}</span> {label}
          </div>
        ))}
      </div>

      {/* ── FORM SECTION ── */}
      <section id="list" style={{ background: '#000', color: '#fff', position: 'relative', scrollMarginTop: 72 }}>
        <div style={{ height: 3, background: '#ef4056' }} />
        <div className="form-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, padding: '100px 40px', alignItems: 'start' }}>

          {/* Left pitch */}
          <div>
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 0.95, letterSpacing: '-0.05em', marginBottom: 20 }}>
              Verdien meer<span style={{ color: '#ef4056' }}>.</span><br />Betaal minder<span style={{ color: '#ef4056' }}>.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
              Jou eiendom, jou reëls. Be among the first properties on BLY. and reach a new generation of South African travellers — without the heavy OTA commissions.
            </p>
            {[
              ['💰', 'Keep more revenue',         'Lower commission than any major OTA'],
              ['🎯', 'Direct guest relationships', 'Own your bookings and your data'],
              ['🚀', 'Early access advantage',     'First-listed properties get priority placement at launch'],
              ['🤝', 'Local support',              'A South African team that actually picks up the phone'],
            ].map(([icon, title, sub]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,214,222,0.12)', border: '1px solid rgba(245,214,222,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
                <div>
                  <strong style={{ display: 'block', fontFamily: 'Poppins', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{title}</strong>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right form */}
          <div className="form-card" style={{ background: '#F8F7F5', color: '#000', borderRadius: 24, padding: 40, boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
            {!success ? (
              <>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 22, marginBottom: 6, letterSpacing: '-0.03em' }}>Register your property</h3>
                <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 28 }}>Fill in your details and we'll be in touch before we go live.</p>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="First Name"  value={form.firstName}    onChange={set('firstName')}    placeholder="e.g. Johan" />
                  <Field label="Surname"     value={form.lastName}     onChange={set('lastName')}     placeholder="e.g. van der Merwe" />
                </div>
                <Field label="Property Name" value={form.propertyName} onChange={set('propertyName')} placeholder="e.g. Sea Breeze Guest House" />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 6 }}>Property Type</label>
                  <select value={form.propertyType} onChange={set('propertyType')} style={inputStyle}>
                    <option value="">Select a type...</option>
                    {['Guest House','Boutique Hotel','Self-catering Unit','B&B','Lodge / Safari','Villa / Private Home','Backpackers','Other'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Email Address" value={form.email} onChange={set('email')} placeholder="you@example.com" type="email" />
                  <Field label="Phone Number"  value={form.phone} onChange={set('phone')} placeholder="082 000 0000" type="tel" />
                </div>
                <Field label="City / Town" value={form.city} onChange={set('city')} placeholder="e.g. Hermanus, Cape Town..." />
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 6 }}>Anything else? (optional)</label>
                  <textarea value={form.notes} onChange={set('notes')} placeholder="Tell us about your property, number of rooms, special features..." style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
                </div>

                {error && <div style={{ color: '#ef4056', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{error}</div>}

                <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '16px 0', background: '#ef4056', color: '#fff', fontFamily: 'Poppins', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 99, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(239,64,86,0.35)', marginTop: 8 }}>
                  {loading ? 'Submitting...' : 'Register my property 🏨'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5D6DE', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>✓</div>
                <h4 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>You're on the list!</h4>
                <p style={{ fontSize: 14, color: '#6B6B6B' }}>We'll be in touch before BLY. goes live. Welcome to the family.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#000', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 18, letterSpacing: '-0.05em', color: '#fff' }}>
          Bly<span style={{ color: '#ef4056' }}>.</span>
        </span>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 BLY. — Bly waar dit saak maak.</p>
      </footer>

    </main>
  )
}

const inputStyle = {
  width: '100%', padding: '13px 16px',
  border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 12,
  fontFamily: 'Inter, sans-serif', fontSize: 14,
  background: '#F8F7F5', color: '#000',
  appearance: 'none',
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6B6B', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}
