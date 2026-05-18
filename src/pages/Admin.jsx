import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '40px 32px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-1px' },
  sub: { fontSize: 14, color: 'var(--text-muted)', marginTop: 4 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 },
  stat: { background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  statNum: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--text)' },
  statLabel: { fontSize: 13, color: 'var(--text-muted)', marginTop: 2 },
  tabs: { display: 'flex', gap: 4, background: 'var(--border)', borderRadius: 99, padding: 4, marginBottom: 28, width: 'fit-content' },
  tab: (active) => ({
    padding: '9px 22px', borderRadius: 99, border: 'none',
    background: active ? '#fff' : 'none',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
    color: active ? 'var(--text)' : 'var(--text-muted)',
    cursor: 'pointer',
    boxShadow: active ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.15s',
  }),
  hotelCard: {
    background: '#fff', borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: 16,
    display: 'grid', gridTemplateColumns: '160px 1fr auto',
  },
  hotelImg: { width: 160, height: 130, objectFit: 'cover', display: 'block' },
  hotelImgPh: {
    width: 160, height: 130, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 32,
    background: 'linear-gradient(135deg, #e2dfdb, #c8c4be)',
  },
  hotelBody: { padding: '16px 20px' },
  hotelName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 4 },
  hotelMeta: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 },
  badge: (color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 99,
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
    background: color === 'green' ? '#e6f9ee' : color === 'red' ? '#fff0f0' : '#fff8e6',
    color: color === 'green' ? '#1a7a40' : color === 'red' ? '#cc0000' : '#a06000',
    marginRight: 6,
  }),
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    padding: '4px 10px', background: 'var(--bg)', borderRadius: 99,
    fontSize: 11, color: 'var(--text-muted)', border: '1px solid var(--border)',
  },
  actions: {
    padding: '16px 20px', display: 'flex', flexDirection: 'column',
    gap: 8, justifyContent: 'center', borderLeft: '1px solid var(--border)',
    minWidth: 150,
  },
  approveBtn: {
    padding: '10px 16px', borderRadius: 99, border: 'none',
    background: '#1a7a40', color: '#fff',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
    cursor: 'pointer',
  },
  rejectBtn: {
    padding: '10px 16px', borderRadius: 99,
    border: '1.5px solid var(--border)', background: 'none',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
    color: '#cc0000', cursor: 'pointer',
  },
  revokeBtn: {
    padding: '10px 16px', borderRadius: 99,
    border: '1.5px solid var(--border)', background: 'none',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
    color: 'var(--text-muted)', cursor: 'pointer',
  },
  price: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' },
  ratesRow: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4 },
  empty: { textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 15 },
  denied: { textAlign: 'center', padding: '80px 0' },
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('pending')
  const [hotels, setHotels] = useState([])
  const [bookings, setBookings] = useState([])
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) return
    loadData()
  }, [isAdmin])

  async function loadData() {
    setLoading(true)
    const { data: h } = await supabase
      .from('hotels').select('*').order('created_at', { ascending: false })
    const { data: b } = await supabase
      .from('bookings').select('*, hotels(name, city)').order('created_at', { ascending: false })
    const { data: w } = await supabase
      .from('waitlist').select('*').order('created_at', { ascending: false })
    if (h) setHotels(h)
    if (b) setBookings(b || [])
    if (w) setWaitlist(w || [])
    setLoading(false)
  }

  async function approveHotel(id) {
    await supabase.from('hotels').update({ approved: true }).eq('id', id)
    setHotels(prev => prev.map(h => h.id === id ? { ...h, approved: true } : h))
  }

  async function revokeHotel(id) {
    await supabase.from('hotels').update({ approved: false }).eq('id', id)
    setHotels(prev => prev.map(h => h.id === id ? { ...h, approved: false } : h))
  }

  async function toggleFeatured(id, current) {
    await supabase.from('hotels').update({ featured: !current }).eq('id', id)
    setHotels(prev => prev.map(h => h.id === id ? { ...h, featured: !current } : h))
  }

  async function deleteHotel(id) {
    if (!window.confirm('Delete this hotel permanently?')) return
    await supabase.from('hotels').delete().eq('id', id)
    setHotels(prev => prev.filter(h => h.id !== id))
  }

  if (!user) return (
    <div style={{ ...s.page, ...s.denied }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
      <div style={s.title}>Sign in required</div>
      <button style={{ marginTop: 20, padding: '12px 28px', borderRadius: 99, background: 'var(--text)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}
        onClick={() => navigate('/auth')}>Sign in →</button>
    </div>
  )

  if (!isAdmin) return (
    <div style={{ ...s.page, ...s.denied }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
      <div style={s.title}>Access denied</div>
      <div style={{ color: 'var(--text-muted)', marginTop: 8 }}>This page is for Bly admins only.</div>
    </div>
  )

  const pending = hotels.filter(h => !h.approved)
  const approved = hotels.filter(h => h.approved)
  const featured = hotels.filter(h => h.featured)

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>Admin dashboard</div>
          <div style={s.sub}>Manage hotels, approvals and bookings for Bly.</div>
        </div>
        <button onClick={loadData} style={{ padding: '10px 20px', borderRadius: 99, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14 }}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={s.stats}>
        {[
          { num: hotels.length, label: 'Total hotels' },
          { num: pending.length, label: 'Pending approval', accent: pending.length > 0 },
          { num: featured.length, label: 'Featured in hero', accent2: true },
          { num: bookings.length, label: 'Total bookings' },
        ].map((stat, i) => (
          <div key={i} style={s.stat}>
            <div style={{ ...s.statNum, color: stat.accent ? 'var(--accent)' : stat.accent2 ? '#a06000' : 'var(--text)' }}>
              {stat.num}
            </div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[
          { key: 'pending',  label: `Pending (${pending.length})` },
          { key: 'approved', label: `Live hotels (${approved.length})` },
          { key: 'bookings', label: `Bookings (${bookings.length})` },
          { key: 'waitlist', label: `Waitlist (${waitlist.length})` },
        ].map(t => (
          <button key={t.key} style={s.tab(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Pending tab */}
      {tab === 'pending' && (
        loading
          ? <div style={s.empty}>Loading…</div>
          : pending.length === 0
            ? <div style={s.empty}>✅ Nothing pending — all hotels reviewed.</div>
            : pending.map(hotel => (
              <HotelRow
                key={hotel.id}
                hotel={hotel}
                mode="pending"
                onApprove={() => approveHotel(hotel.id)}
                onFeature={() => toggleFeatured(hotel.id, hotel.featured)}
                onDelete={() => deleteHotel(hotel.id)}
              />
            ))
      )}

      {/* Approved tab */}
      {tab === 'approved' && (
        loading
          ? <div style={s.empty}>Loading…</div>
          : approved.length === 0
            ? <div style={s.empty}>No approved hotels yet.</div>
            : approved.map(hotel => (
              <HotelRow
                key={hotel.id}
                hotel={hotel}
                mode="approved"
                onRevoke={() => revokeHotel(hotel.id)}
                onFeature={() => toggleFeatured(hotel.id, hotel.featured)}
                onDelete={() => deleteHotel(hotel.id)}
              />
            ))
      )}

      {/* Bookings tab */}
      {tab === 'bookings' && (
        loading
          ? <div style={s.empty}>Loading…</div>
          : bookings.length === 0
            ? <div style={s.empty}>No bookings yet.</div>
            : <BookingsTable bookings={bookings} />
      )}

      {/* Waitlist tab */}
      {tab === 'waitlist' && (
        loading
          ? <div style={s.empty}>Loading…</div>
          : waitlist.length === 0
            ? <div style={s.empty}>No waitlist signups yet.</div>
            : (
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Email', 'Signed up'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((w, i) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 500 }}>{w.email}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                          {new Date(w.created_at).toLocaleDateString('en-ZA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
      )}
    </div>
  )
}

function HotelRow({ hotel, onApprove, onRevoke, onFeature, onDelete, mode }) {
  const img = hotel.images?.[0]
  const rateCount = hotel.seasonal_rates?.length || 0

  return (
    <div style={s.hotelCard}>
      {img
        ? <img src={img} alt={hotel.name} style={s.hotelImg} />
        : <div style={s.hotelImgPh}>🏨</div>
      }
      <div style={s.hotelBody}>
        <div style={s.hotelName}>{hotel.name}</div>
        <div style={s.hotelMeta}>
          📍 {hotel.city}, {hotel.province} &nbsp;·&nbsp;
          {hotel.category} &nbsp;·&nbsp;
          Submitted {new Date(hotel.created_at).toLocaleDateString('en-ZA')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={s.price}>
            R{Number(hotel.price_night).toLocaleString()}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/night</span>
          </span>
          {rateCount > 0 && (
            <span style={s.ratesRow}>+ {rateCount} seasonal rate{rateCount > 1 ? 's' : ''}</span>
          )}
        </div>
        <div style={s.tagRow}>
          {hotel.amenities?.slice(0, 5).map(a => <span key={a} style={s.tag}>{a}</span>)}
          {(hotel.amenities?.length || 0) > 5 && (
            <span style={s.tag}>+{hotel.amenities.length - 5} more</span>
          )}
        </div>
      </div>

      <div style={s.actions}>
        <span style={s.badge(mode === 'approved' ? 'green' : 'amber')}>
          {mode === 'approved' ? '● Live' : '● Pending'}
        </span>

        {/* Featured toggle */}
        <button
          onClick={onFeature}
          style={{
            padding: '9px 14px',
            borderRadius: 99,
            border: '1.5px solid',
            borderColor: hotel.featured ? '#f5a623' : 'var(--border)',
            background: hotel.featured ? '#fff8e6' : 'none',
            color: hotel.featured ? '#a06000' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s',
          }}
        >
          {hotel.featured ? '★ Featured' : '☆ Feature'}
        </button>

        {mode === 'pending' && (
          <button style={s.approveBtn} onClick={onApprove}>✓ Approve</button>
        )}
        {mode === 'approved' && (
          <button style={s.revokeBtn} onClick={onRevoke}>Unpublish</button>
        )}
        <button style={s.rejectBtn} onClick={onDelete}>Delete</button>
      </div>
    </div>
  )
}

function BookingsTable({ bookings }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Hotel', 'Check-in', 'Check-out', 'Guests', 'Total', 'Status'].map(h => (
              <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => (
            <tr key={b.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
              <td style={{ padding: '14px 20px', fontWeight: 600 }}>{b.hotels?.name || '—'}</td>
              <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{b.check_in}</td>
              <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{b.check_out}</td>
              <td style={{ padding: '14px 20px' }}>{b.guests}</td>
              <td style={{ padding: '14px 20px', fontWeight: 700 }}>R{Number(b.total_price).toLocaleString()}</td>
              <td style={{ padding: '14px 20px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: b.status === 'confirmed' ? '#e6f9ee' : b.status === 'cancelled' ? '#fff0f0' : '#fff8e6',
                  color: b.status === 'confirmed' ? '#1a7a40' : b.status === 'cancelled' ? '#cc0000' : '#a06000',
                }}>{b.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
