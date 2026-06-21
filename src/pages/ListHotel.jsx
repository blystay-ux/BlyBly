import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const PROVINCES = ['Western Cape','Gauteng','KwaZulu-Natal','Eastern Cape',
  'Limpopo','Mpumalanga','North West','Free State','Northern Cape']
const CATEGORIES = ['hotel','lodge','guesthouse','boutique','resort']
const LANGUAGES = ['English','Afrikaans','Zulu','Xhosa','Sotho','Tswana','Venda','Tsonga','Ndebele']
const STEPS = ['Your details','Property info','Facilities','Pricing & rates','Review & submit']

const SA_SEASONS = [
  { label: 'Peak — Summer holidays', start: '2025-12-01', end: '2026-01-15' },
  { label: 'Peak — Easter',          start: '2026-04-02', end: '2026-04-19' },
  { label: 'Winter special',         start: '2026-06-01', end: '2026-08-31' },
  { label: 'Spring season',          start: '2026-09-01', end: '2026-10-31' },
  { label: 'Year-end peak',          start: '2026-11-15', end: '2026-12-31' },
]

const FACILITY_SECTIONS = [
  { label: 'Top Facilities', key: 'top', items: [
    'Swimming pool','Restaurant','Room service','Bar','24-hour front desk',
    'Sauna','Fitness centre','Garden','Terrace','Non-smoking rooms',
    'Airport shuttle','Family rooms','Spa and wellness centre',
    'Hot tub / Jacuzzi','Air conditioning','Kids\' club','Water park',
  ]},
  { label: 'Meals Offered', key: 'meals', items: [
    'Breakfast','Lunch','Dinner','Breakfast in the room','Packed lunches','Kids\' meals',
  ]},
  { label: 'Activities', key: 'activities', items: [
    'Game drives','Beach','Horse riding','Cycling','Hiking','Fishing',
    'Canoeing','Snorkelling','Diving','Windsurfing','Skiing',
    'Tennis court','Badminton','Squash','Billiards','Table tennis',
    'Darts','Bowling','Mini golf','Golf course (within 3 km)',
    'Archery','Yoga classes','Fitness classes','Walking tours','Bike tours',
    'Live music / performance','Movie nights','Cooking class',
    'Tour or class about local culture','Themed dinner nights','Happy hour',
  ]},
  { label: 'Food & Drink', key: 'food', items: [
    'Wine / champagne','Fruits in room','Coffee house on site','Snack bar',
    'BBQ facilities','Vending machine (drinks)','Vending machine (snacks)',
    'Special diet menus (on request)','Grocery deliveries','Kid-friendly buffet',
  ]},
  { label: 'Pool & Wellness', key: 'wellness', items: [
    'Water slide','Sun loungers','Sun umbrellas','Steam room',
    'Spa lounge / relaxation area','Spa / wellness packages','Massage',
    'Massage chair','Hammam','Solarium','Hot spring bath','Foot bath',
    'Kids\' pool','Open-air bath','Infinity pool','Rooftop pool',
    'Heated pool','Plunge pool','Salt water pool','Pool with a view',
  ]},
  { label: 'Transport', key: 'transport', items: [
    'Parking','Shuttle service','Airport shuttle','Car hire',
    'Bicycle rental','Bicycle parking','Public transport tickets',
  ]},
  { label: 'Reception Services', key: 'reception', items: [
    'Concierge service','Tour desk','Currency exchange','ATM / cash machine on site',
    'Luggage storage','Lockers','Express check-in / check-out',
    'Private check-in / check-out','Invoice provided',
  ]},
  { label: 'Common Areas', key: 'common', items: [
    'Outdoor furniture','Picnic area','Indoor fireplace','Outdoor fireplace',
    'Sun terrace','Shared kitchen','Shared lounge / TV area','Games room','Chapel / shrine',
  ]},
  { label: 'Entertainment & Family', key: 'entertainment', items: [
    'Children\'s playground','Indoor play area','Kids\' outdoor play equipment',
    'Board games / puzzles','Babysitting / child services','Evening entertainment',
    'Nightclub / DJ','Casino','Karaoke','Entertainment staff',
  ]},
  { label: 'Cleaning Services', key: 'cleaning', items: [
    'Daily housekeeping','Laundry','Dry cleaning','Ironing service','Trouser press',
  ]},
  { label: 'Business Facilities', key: 'business', items: [
    'Meeting / banquet facilities','Business centre','Fax / photocopying',
  ]},
  { label: 'Safety & Security', key: 'safety', items: [
    '24-hour security','Security alarm','Smoke alarms','CCTV in common areas',
    'CCTV outside property','Fire extinguishers','Carbon monoxide detector',
    'Safety deposit box','First aid kit','Staff follow safety protocols',
  ]},
  { label: 'Self Check-in Options', key: 'selfcheckin', items: [
    'Contactless check-in / check-out','Check-in kiosk in lobby',
    'Lockbox key collection','Mobile app room access','QR code check-in',
    'Pre-shared PIN / code','Guest IDs collected online pre-stay',
  ]},
  { label: 'Miscellaneous', key: 'misc', items: [
    'Pet friendly','Adults only','Allergy-free room','Non-smoking throughout',
    'Designated smoking area','Facilities for disabled guests','Lift',
    'Soundproof rooms','Heating','Minimarket on site','Barber / beauty shop','Shops on site',
  ]},
]

const s = {
  page: { maxWidth: 800, margin: '0 auto', padding: '48px 24px' },
  progress: { display: 'flex', marginBottom: 40 },
  stepDot: (active, done) => ({
    width: 32, height: 32, borderRadius: '50%', margin: '0 auto 8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: done ? '#ef4056' : active ? '#000000' : 'var(--border)',
    color: done || active ? '#fff' : 'var(--text-muted)',
    fontWeight: 700, fontSize: 13, position: 'relative', zIndex: 1,
  }),
  stepLine: (done) => ({
    position: 'absolute', top: 16, left: '50%', right: '-50%',
    height: 2, background: done ? '#ef4056' : 'var(--border)', zIndex: 0,
  }),
  stepLabel: (active) => ({
    fontSize: 11, fontWeight: active ? 700 : 400,
    color: active ? 'var(--text)' : 'var(--text-muted)',
  }),
  card: {
    background: '#fff', borderRadius: 24, padding: '36px 40px',
    boxShadow: '0 4px 40px rgba(0,0,0,0.07)',
  },
  sectionTitle: {
    fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 800, fontSize: 26,
    letterSpacing: '-0.5px', marginBottom: 6,
  },
  sectionSub: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 },
  facilityGroup: { marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--border)' },
  facilityGroupLabel: {
    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10,
  },
  chipGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 },
  chip: (on) => ({
    padding: '9px 14px', borderRadius: 99, border: '1.5px solid',
    borderColor: on ? '#000000' : 'var(--border)',
    background: on ? '#000000' : 'none', color: on ? '#fff' : 'var(--text)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'Inter, var(--font-body)', textAlign: 'center', transition: 'all 0.15s',
  }),
  label: {
    display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, marginTop: 16,
  },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: '1.5px solid var(--border)', fontSize: 15,
    fontFamily: 'var(--font-body)', color: 'var(--text)',
    background: 'var(--bg)', boxSizing: 'border-box', outline: 'none',
  },
  select: {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: '1.5px solid var(--border)', fontSize: 15,
    fontFamily: 'var(--font-body)', color: 'var(--text)',
    background: 'var(--bg)', boxSizing: 'border-box', outline: 'none', appearance: 'none',
  },
  textarea: {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: '1.5px solid var(--border)', fontSize: 15,
    fontFamily: 'var(--font-body)', color: 'var(--text)',
    background: 'var(--bg)', boxSizing: 'border-box', outline: 'none', minHeight: 100, resize: 'vertical',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  rateRow: {
    display: 'grid', gridTemplateColumns: '1.8fr 130px 130px 100px 36px',
    gap: 8, alignItems: 'center', marginBottom: 10,
  },
  rateInput: {
    padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
    fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--text)',
    background: 'var(--bg)', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  removeBtn: {
    width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)',
    background: 'none', color: 'var(--text-muted)', fontSize: 18,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  addRateBtn: {
    marginTop: 12, padding: '10px 20px', borderRadius: 99,
    border: '1.5px dashed var(--border)', background: 'none',
    fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
    color: 'var(--text-muted)', cursor: 'pointer', width: '100%',
  },
  quickBtn: {
    padding: '7px 14px', borderRadius: 99, border: '1.5px solid var(--border)',
    background: 'none', fontSize: 12, fontWeight: 500,
    color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  },
  rateHeader: {
    display: 'grid', gridTemplateColumns: '1.8fr 130px 130px 100px 36px', gap: 8, marginBottom: 6,
  },
  rateHeaderLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)',
  },
  btnRow: { display: 'flex', gap: 12, marginTop: 32 },
  btnBack: {
    flex: 1, padding: '14px 0', borderRadius: 99, border: '1.5px solid var(--border)',
    background: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15,
    color: 'var(--text)', cursor: 'pointer',
  },
  btnNext: {
    flex: 2, padding: '14px 0', borderRadius: 99, background: 'var(--text)',
    color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
  },
  btnSubmit: {
    flex: 2, padding: '14px 0', borderRadius: 99, background: '#ef4056',
    color: '#fff', fontFamily: 'Poppins, Inter, var(--font-display)', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
  },
  reviewSection: { marginBottom: 24 },
  reviewSectionTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)',
  },
  reviewRow: {
    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
    borderBottom: '1px solid var(--border)', fontSize: 14,
  },
  reviewKey: { color: 'var(--text-muted)', fontWeight: 500 },
  reviewVal: { color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: '65%' },
  chipsMini: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chipMini: {
    padding: '4px 10px', borderRadius: 99, background: '#F5D6DE',
    color: '#000000', fontSize: 12, fontWeight: 600,
  },
  rateReviewRow: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16,
    padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center',
  },
  error: { background: '#F5D6DE', color: '#000000', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16, border: '1px solid #ef4056' },
  successPage: { textAlign: 'center', padding: '48px 0' },
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 10 },
  successSub: { fontSize: 15, color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto 28px' },
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ListHotel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    contactName: '', contactEmail: user?.email || '',
    name: '', city: '', province: 'Western Cape', category: 'hotel',
    short_desc: '', description: '',
    total_floors: '', total_rooms: '',
    languages: [], facilities: [],
    price_night: '', images: '', seasonal_rates: [],
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleItem = (key, item) => {
    set(key, form[key].includes(item)
      ? form[key].filter(x => x !== item)
      : [...form[key], item])
  }

  const addRate = () => set('seasonal_rates', [...form.seasonal_rates, { label: '', start: '', end: '', price: '' }])
  const addPresetSeason = (season) => set('seasonal_rates', [...form.seasonal_rates, { ...season, price: '' }])
  const updateRate = (i, key, val) => {
    const updated = [...form.seasonal_rates]
    updated[i] = { ...updated[i], [key]: val }
    set('seasonal_rates', updated)
  }
  const removeRate = (i) => set('seasonal_rates', form.seasonal_rates.filter((_, idx) => idx !== i))

  async function handleSubmit() {
    setSubmitting(true); setError('')
    const imageArr = form.images.split('\n').map(s => s.trim()).filter(Boolean)
    const slug = slugify(form.name) + '-' + Date.now().toString(36)
    const { error } = await supabase.from('hotels').insert({
      owner_id: user?.id,
      name: form.name, slug,
      city: form.city, province: form.province,
      category: form.category, short_desc: form.short_desc,
      description: form.description,
      price_per_night: parseFloat(form.price_night),
      rooms: form.total_rooms ? parseInt(form.total_rooms) : 1,
      total_floors: form.total_floors ? parseInt(form.total_floors) : null,
      languages: form.languages,
      images: imageArr,
      amenities: form.facilities,
      seasonal_rates: form.seasonal_rates,
      is_featured: false,
      rating: 0,
      status: 'pending_review',
    })
    if (error) { setError(error.message); setSubmitting(false); return }
    setSubmitted(true); setSubmitting(false)
  }

  if (!user) return (
    <div style={{ ...s.page, textAlign: 'center', paddingTop: 80 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
      <div style={s.sectionTitle}>Sign in first</div>
      <div style={s.sectionSub}>You need an account to list your property on Bly.</div>
      <button style={s.btnNext} onClick={() => navigate('/auth')}>Sign in →</button>
    </div>
  )

  if (submitted) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.successPage}>
          <div style={s.successIcon}>🎉</div>
          <div style={s.successTitle}>Submitted to Bly.</div>
          <div style={s.successSub}>Your property is in BLY.'s review queue. You'll be notified once it's approved and live.</div>
          <button style={s.btnNext} onClick={() => navigate('/extranet')}>Go to your extranet →</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      {/* Progress */}
      <div style={s.progress}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            {i < STEPS.length - 1 && <div style={s.stepLine(i < step)} />}
            <div style={s.stepDot(i === step, i < step)}>{i < step ? '✓' : i + 1}</div>
            <div style={s.stepLabel(i === step)}>{label}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        {error && <div style={s.error}>{error}</div>}

        {/* STEP 0 */}
        {step === 0 && <>
          <div style={s.sectionTitle}>Verdien meer. Betaal minder kommissie.</div>
          <div style={s.sectionSub}>Jou eiendom, jou reëls. Vul jou besonderhede in om te begin.</div>
          <label style={s.label}>Your name</label>
          <input style={s.input} value={form.contactName}
            onChange={e => set('contactName', e.target.value)} placeholder="Jane Smith" />
          <label style={s.label}>Your email</label>
          <input style={s.input} type="email" value={form.contactEmail}
            onChange={e => set('contactEmail', e.target.value)} placeholder="jane@yourhotel.co.za" />
        </>}

        {/* STEP 1 */}
        {step === 1 && <>
          <div style={s.sectionTitle}>Property info</div>
          <div style={s.sectionSub}>Basic details about your property.</div>
          <label style={s.label}>Property name</label>
          <input style={s.input} value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="The Grand Franschhoek" />
          <div style={s.grid2}>
            <div>
              <label style={s.label}>City / Town</label>
              <input style={s.input} value={form.city}
                onChange={e => set('city', e.target.value)} placeholder="Franschhoek" />
            </div>
            <div>
              <label style={s.label}>Province</label>
              <select style={s.select} value={form.province} onChange={e => set('province', e.target.value)}>
                {PROVINCES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <label style={s.label}>Category</label>
          <select style={s.select} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <label style={s.label}>One-line description</label>
          <input style={s.input} value={form.short_desc}
            onChange={e => set('short_desc', e.target.value)}
            placeholder="A historic manor nestled in the Franschhoek Valley" />
          <label style={s.label}>Full description</label>
          <textarea style={s.textarea} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Tell guests what makes your property special…" />
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Total floors (excl. underground)</label>
              <input style={s.input} type="number" min="1" max="200"
                value={form.total_floors} onChange={e => set('total_floors', e.target.value)} placeholder="e.g. 3" />
            </div>
            <div>
              <label style={s.label}>Total number of rooms</label>
              <input style={s.input} type="number" min="1"
                value={form.total_rooms} onChange={e => set('total_rooms', e.target.value)} placeholder="e.g. 66" />
            </div>
          </div>
          <label style={s.label}>Languages spoken</label>
          <div style={{ ...s.chipGrid, marginTop: 8 }}>
            {LANGUAGES.map(lang => (
              <button key={lang} style={s.chip(form.languages.includes(lang))}
                onClick={() => toggleItem('languages', lang)}>{lang}</button>
            ))}
          </div>
        </>}

        {/* STEP 2 — Facilities */}
        {step === 2 && <>
          <div style={s.sectionTitle}>Facilities & amenities</div>
          <div style={s.sectionSub}>
            Select everything available at your property.
            {form.facilities.length > 0 && (
              <span style={{ marginLeft: 8, color: '#ef4056', fontWeight: 700 }}>
                {form.facilities.length} selected
              </span>
            )}
          </div>
          {FACILITY_SECTIONS.map(section => (
            <div key={section.key} style={s.facilityGroup}>
              <div style={s.facilityGroupLabel}>{section.label}</div>
              <div style={s.chipGrid}>
                {section.items.map(item => (
                  <button key={item} style={s.chip(form.facilities.includes(item))}
                    onClick={() => toggleItem('facilities', item)}>{item}</button>
                ))}
              </div>
            </div>
          ))}
        </>}

        {/* STEP 3 — Pricing */}
        {step === 3 && <>
          <div style={s.sectionTitle}>Pricing & rates</div>
          <div style={s.sectionSub}>Set your standard rate then add seasonal pricing.</div>
          <label style={s.label}>Standard rate per night (ZAR)</label>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--text-muted)', fontWeight: 600 }}>R</span>
            <input style={{ ...s.input, paddingLeft: 32 }} type="number"
              value={form.price_night} onChange={e => set('price_night', e.target.value)} placeholder="2500" />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
            Default rate — applies to any dates not covered by a seasonal rate below.
          </div>
          <label style={s.label}>Seasonal rates (optional)</label>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Quick-add SA seasons:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {SA_SEASONS.map((season, i) => (
              <button key={i} style={s.quickBtn} onClick={() => addPresetSeason(season)}>
                + {season.label.split('—')[0].trim()}
              </button>
            ))}
          </div>
          {form.seasonal_rates.length > 0 && <>
            <div style={s.rateHeader}>
              <div style={s.rateHeaderLabel}>Period name</div>
              <div style={s.rateHeaderLabel}>From</div>
              <div style={s.rateHeaderLabel}>To</div>
              <div style={s.rateHeaderLabel}>Rate (R)</div>
              <div />
            </div>
            {form.seasonal_rates.map((rate, i) => (
              <div key={i} style={s.rateRow}>
                <input style={s.rateInput} placeholder="e.g. Peak season"
                  value={rate.label} onChange={e => updateRate(i, 'label', e.target.value)} />
                <input style={s.rateInput} type="date"
                  value={rate.start} onChange={e => updateRate(i, 'start', e.target.value)} />
                <input style={s.rateInput} type="date"
                  value={rate.end} onChange={e => updateRate(i, 'end', e.target.value)} />
                <input style={s.rateInput} type="number" placeholder="3500"
                  value={rate.price} onChange={e => updateRate(i, 'price', e.target.value)} />
                <button style={s.removeBtn} onClick={() => removeRate(i)}>×</button>
              </div>
            ))}
          </>}
          <button style={s.addRateBtn} onClick={addRate}>+ Add custom rate period</button>
          <label style={s.label}>Image URLs (one per line)</label>
          <textarea style={{ ...s.textarea, minHeight: 100 }}
            value={form.images} onChange={e => set('images', e.target.value)}
            placeholder={'https://images.unsplash.com/photo-xxx?w=800\nhttps://images.unsplash.com/photo-yyy?w=800'} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Tip: upload photos to Cloudinary.com (free) and paste the links here.
          </div>
        </>}

        {/* STEP 4 — Review */}
        {step === 4 && <>
          <div style={s.sectionTitle}>Review & submit</div>
          <div style={s.sectionSub}>Check everything looks right before going live.</div>

          <div style={s.reviewSection}>
            <div style={s.reviewSectionTitle}>Contact</div>
            {[['Name', form.contactName], ['Email', form.contactEmail]].map(([k, v]) => (
              <div key={k} style={s.reviewRow}>
                <span style={s.reviewKey}>{k}</span><span style={s.reviewVal}>{v || '—'}</span>
              </div>
            ))}
          </div>

          <div style={s.reviewSection}>
            <div style={s.reviewSectionTitle}>Property</div>
            {[
              ['Name', form.name],
              ['Location', `${form.city}, ${form.province}`],
              ['Category', form.category],
              ['Tagline', form.short_desc],
              ['Floors', form.total_floors || '—'],
              ['Rooms', form.total_rooms || '—'],
              ['Standard rate', `R${Number(form.price_night || 0).toLocaleString()} / night`],
              ['Images', `${form.images.split('\n').filter(Boolean).length} photo(s)`],
            ].map(([k, v]) => (
              <div key={k} style={s.reviewRow}>
                <span style={s.reviewKey}>{k}</span><span style={s.reviewVal}>{v}</span>
              </div>
            ))}
          </div>

          {form.languages.length > 0 && (
            <div style={s.reviewSection}>
              <div style={s.reviewSectionTitle}>Languages spoken</div>
              <div style={s.chipsMini}>
                {form.languages.map(l => <span key={l} style={s.chipMini}>{l}</span>)}
              </div>
            </div>
          )}

          {form.facilities.length > 0 && (
            <div style={s.reviewSection}>
              <div style={s.reviewSectionTitle}>Facilities & amenities ({form.facilities.length})</div>
              <div style={s.chipsMini}>
                {form.facilities.map(f => <span key={f} style={s.chipMini}>{f}</span>)}
              </div>
            </div>
          )}

          {form.seasonal_rates.length > 0 && (
            <div style={s.reviewSection}>
              <div style={s.reviewSectionTitle}>Seasonal rates</div>
              {form.seasonal_rates.map((r, i) => (
                <div key={i} style={s.rateReviewRow}>
                  <span style={{ fontWeight: 500 }}>{r.label || `Period ${i + 1}`}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(r.start)} → {formatDate(r.end)}</span>
                  <span style={{ fontWeight: 700, color: '#ef4056' }}>R{Number(r.price || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </>}

        <div style={s.btnRow}>
          {step > 0 && <button style={s.btnBack} onClick={() => setStep(s => s - 1)}>← Back</button>}
          {step < 4
            ? <button style={s.btnNext} onClick={() => setStep(s => s + 1)}>Continue →</button>
            : <button style={s.btnSubmit} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit my property →'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
