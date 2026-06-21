import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ── Styles ────────────────────────────────────────────────────
const s = {
  page:    { minHeight: '100vh', background: '#F8F7F5', padding: '0 0 60px' },
  header:  { background: '#fff', borderBottom: '1px solid #E2DFDB', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title:   { fontWeight: 800, fontSize: 26, letterSpacing: '-0.05em' },
  badge:   { background: '#fff0f0', color: '#ef4056', borderRadius: 99, padding: '4px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' },
  body:    { maxWidth: 1280, margin: '0 auto', padding: '32px 40px' },
  tabs:    { display: 'flex', gap: 8, marginBottom: 32 },
  tab:     (a) => ({ padding: '9px 22px', borderRadius: 99, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: a ? '#111' : '#fff', color: a ? '#fff' : '#666', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }),
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  statCard:{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
  statNum: { fontWeight: 800, fontSize: 32, letterSpacing: '-0.05em', marginTop: 8 },
  statLbl: { fontSize: 13, color: '#888', marginTop: 2 },
  table:   { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
  th:      { padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', borderBottom: '1px solid #f0ede8' },
  td:      { padding: '14px 18px', fontSize: 14, color: '#333', borderBottom: '1px solid #f0ede8' },
  pill:    (c) => ({ display: 'inline-block', borderRadius: 99, padding: '3px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', background: c === 'green' ? '#dcfce7' : c === 'yellow' ? '#fef9c3' : c === 'red' ? '#fee2e2' : '#f1f5f9', color: c === 'green' ? '#16a34a' : c === 'yellow' ? '#ca8a04' : c === 'red' ? '#dc2626' : '#475569' }),
  btn:     (v) => ({ padding: '6px 14px', borderRadius: 99, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', background: v === 'green' ? '#dcfce7' : v === 'red' ? '#fee2e2' : v === 'accent' ? '#ef4056' : '#f1f5f9', color: v === 'green' ? '#16a34a' : v === 'red' ? '#dc2626' : v === 'accent' ? '#fff' : '#333' }),
  empty:   { textAlign: 'center', padding: '60px 20px', color: '#aaa', fontSize: 15 },
}

const STATUS_COLOR = { confirmed: 'green', pending: 'yellow', cancelled: 'red', completed: 'green' }

// ── Sub-components ────────────────────────────────────────────

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={s.statCard}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={s.statNum}>{value ?? '—'}</div>
      <div style={s.statLbl}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const HOTEL_STATUS = {
  draft:          { c: 'default', label: 'Draft' },
  pending_review: { c: 'yellow',  label: 'Pending' },
  approved:       { c: 'green',   label: 'Approved' },
  rejected:       { c: 'red',     label: 'Rejected' },
  suspended:      { c: 'red',     label: 'Suspended' },
}

function HotelsTab({ hotels, onApprove, onReject, onToggleActive, onToggleFeatured }) {
  if (!hotels.length) return <div style={s.empty}>No hotels listed yet.</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            {['Property', 'City', 'Submitted', 'Rate / night', 'Status', 'Live', 'Featured', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hotels.map(h => {
            const st = HOTEL_STATUS[h.status] || HOTEL_STATUS.draft
            const submitted = h.submitted_at || h.created_at
            const awaiting = h.status === 'pending_review' || h.status === 'draft' || h.status === 'rejected'
            return (
              <tr key={h.id}>
                <td style={s.td}>
                  <div style={{ fontWeight: 700 }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{h.slug}</div>
                </td>
                <td style={s.td}>{h.city}</td>
                <td style={{ ...s.td, fontSize: 12, color: '#888' }}>
                  {submitted ? new Date(submitted).toLocaleDateString('en-ZA') : '—'}
                </td>
                <td style={s.td}>
                  {h.price_per_night
                    ? `R ${Number(h.price_per_night).toLocaleString('en-ZA')}`
                    : '—'}
                </td>
                <td style={s.td}>
                  <span style={s.pill(st.c)}>{st.label}</span>
                </td>
                <td style={{ ...s.td, textAlign: 'center' }}>{h.is_active ? '🟢' : '—'}</td>
                <td style={{ ...s.td, textAlign: 'center' }}>{h.is_featured ? '⭐' : '—'}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {awaiting && (
                      <>
                        <button style={s.btn('green')} onClick={() => onApprove(h)}>Approve</button>
                        <button style={s.btn('red')} onClick={() => onReject(h)}>Reject</button>
                      </>
                    )}
                    {h.status === 'approved' && (
                      <button
                        style={s.btn(h.is_active ? 'red' : 'green')}
                        onClick={() => onToggleActive(h)}
                      >
                        {h.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                    <button
                      style={s.btn(h.is_featured ? 'red' : 'default')}
                      onClick={() => onToggleFeatured(h)}
                    >
                      {h.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BookingsTab({ bookings, onUpdateStatus }) {
  if (!bookings.length) return <div style={s.empty}>No bookings yet.</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            {['Guest', 'Hotel', 'Check-in', 'Check-out', 'Guests', 'Total', 'Status', 'Update'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td style={s.td}>
                <div style={{ fontWeight: 600 }}>{b.guest_name || '—'}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{b.guest_email || b.user_id?.slice(0, 8)}</div>
              </td>
              <td style={s.td}>{b.hotels?.name || '—'}</td>
              <td style={s.td}>{b.check_in}</td>
              <td style={s.td}>{b.check_out}</td>
              <td style={{ ...s.td, textAlign: 'center' }}>{b.guests}</td>
              <td style={s.td}>
                {b.total_price
                  ? `R ${Number(b.total_price).toLocaleString('en-ZA')}`
                  : '—'}
              </td>
              <td style={s.td}>
                <span style={s.pill(STATUS_COLOR[b.status] || 'default')}>
                  {b.status}
                </span>
              </td>
              <td style={s.td}>
                <select
                  style={{ fontSize: 13, padding: '4px 8px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}
                  value={b.status}
                  onChange={e => onUpdateStatus(b.id, e.target.value)}
                >
                  {['pending', 'confirmed', 'cancelled', 'completed'].map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WaitlistTab({ waitlist, onDelete }) {
  if (!waitlist.length) return <div style={s.empty}>Waitlist is empty.</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            {['Email', 'Name', 'City', 'Joined', 'Remove'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {waitlist.map(w => (
            <tr key={w.id}>
              <td style={s.td}>{w.email}</td>
              <td style={s.td}>{w.name || '—'}</td>
              <td style={s.td}>{w.city || '—'}</td>
              <td style={{ ...s.td, fontSize: 12, color: '#aaa' }}>
                {new Date(w.created_at).toLocaleDateString('en-ZA')}
              </td>
              <td style={s.td}>
                <button style={s.btn('red')} onClick={() => onDelete(w.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const MEMBER_STATUS = {
  pending: 'yellow', active: 'green', rejected: 'red', expired: 'default', cancelled: 'default',
}

function MembersTab({ memberships, names, onApprove, onReject, onRevoke }) {
  if (!memberships.length) return <div style={s.empty}>No industry applications yet.</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            {['Member', 'Applied', 'Status', 'Payment', 'Expires', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {memberships.map(m => (
            <tr key={m.id}>
              <td style={s.td}>
                <div style={{ fontWeight: 700 }}>{names[m.user_id] || 'Member'}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{m.user_id.slice(0, 8)}</div>
              </td>
              <td style={{ ...s.td, fontSize: 12, color: '#888' }}>
                {new Date(m.created_at).toLocaleDateString('en-ZA')}
              </td>
              <td style={s.td}><span style={s.pill(MEMBER_STATUS[m.status] || 'default')}>{m.status}</span></td>
              <td style={s.td}>
                <span style={s.pill(m.payment_status === 'paid' ? 'green' : 'default')}>
                  R{Number(m.amount).toLocaleString('en-ZA')} · {m.payment_status}
                </span>
              </td>
              <td style={{ ...s.td, fontSize: 13 }}>
                {m.expires_at ? new Date(m.expires_at).toLocaleDateString('en-ZA') : '—'}
              </td>
              <td style={s.td}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {m.status === 'pending' && (
                    <>
                      <button style={s.btn('green')} onClick={() => onApprove(m)}>Approve</button>
                      <button style={s.btn('red')} onClick={() => onReject(m)}>Reject</button>
                    </>
                  )}
                  {m.status === 'active' && (
                    <button style={s.btn('red')} onClick={() => onRevoke(m)}>Revoke</button>
                  )}
                  {(m.status === 'rejected' || m.status === 'cancelled' || m.status === 'expired') && (
                    <button style={s.btn('green')} onClick={() => onApprove(m)}>Re-activate</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────
export default function Admin() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()

  const isAdmin = role === 'admin'

  const [tab,      setTab]      = useState('overview')
  const [hotels,   setHotels]   = useState([])
  const [bookings, setBookings] = useState([])
  const [waitlist, setWaitlist] = useState([])
  const [memberships, setMemberships] = useState([])
  const [memberNames, setMemberNames] = useState({})
  const [loading,  setLoading]  = useState(true)

  // Redirect if not admin
  useEffect(() => {
    if (!user)    { navigate('/auth'); return }
    if (!isAdmin) { navigate('/');    return }
    fetchAll()
  }, [user])

  async function fetchAll() {
    setLoading(true)
    const [hotelsRes, bookingsRes, waitlistRes, membersRes] = await Promise.all([
      supabase.from('hotels').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, hotels(name)').order('created_at', { ascending: false }),
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      supabase.from('industry_memberships').select('*').order('created_at', { ascending: false }),
    ])
    if (hotelsRes.data)   setHotels(hotelsRes.data)
    if (bookingsRes.data) setBookings(bookingsRes.data)
    if (waitlistRes.data) setWaitlist(waitlistRes.data)
    if (membersRes.data) {
      setMemberships(membersRes.data)
      const ids = [...new Set(membersRes.data.map(m => m.user_id))]
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids)
        const map = {}
        ;(profs || []).forEach(p => { map[p.id] = p.full_name })
        setMemberNames(map)
      }
    }
    setLoading(false)
  }

  async function approveHotel(hotel) {
    const { error } = await supabase
      .from('hotels')
      .update({
        status: 'approved',
        is_active: true,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', hotel.id)
    if (!error) setHotels(prev => prev.map(h => h.id === hotel.id
      ? { ...h, status: 'approved', is_active: true } : h))
  }

  async function rejectHotel(hotel) {
    const reason = window.prompt('Reason for rejection (optional, shown to the partner):') ?? null
    const { error } = await supabase
      .from('hotels')
      .update({ status: 'rejected', is_active: false, rejection_reason: reason })
      .eq('id', hotel.id)
    if (!error) setHotels(prev => prev.map(h => h.id === hotel.id
      ? { ...h, status: 'rejected', is_active: false } : h))
  }

  async function toggleActive(hotel) {
    const { error } = await supabase
      .from('hotels')
      .update({ is_active: !hotel.is_active })
      .eq('id', hotel.id)
    if (!error) setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, is_active: !h.is_active } : h))
  }

  async function toggleFeatured(hotel) {
    const { error } = await supabase
      .from('hotels')
      .update({ is_featured: !hotel.is_featured })
      .eq('id', hotel.id)
    if (!error) setHotels(prev => prev.map(h => h.id === hotel.id ? { ...h, is_featured: !h.is_featured } : h))
  }

  async function updateBookingStatus(id, status) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (!error) setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  async function deleteWaitlist(id) {
    const { error } = await supabase.from('waitlist').delete().eq('id', id)
    if (!error) setWaitlist(prev => prev.filter(w => w.id !== id))
  }

  async function approveMember(m) {
    const now = new Date()
    const expires = new Date(now); expires.setFullYear(expires.getFullYear() + 1)
    const patch = {
      status: 'active', payment_status: 'paid',
      approved_by: user.id, approved_at: now.toISOString(),
      paid_at: now.toISOString(), expires_at: expires.toISOString(),
    }
    const { error } = await supabase.from('industry_memberships').update(patch).eq('id', m.id)
    if (!error) setMemberships(prev => prev.map(x => x.id === m.id ? { ...x, ...patch } : x))
  }

  async function rejectMember(m) {
    const { error } = await supabase.from('industry_memberships').update({ status: 'rejected' }).eq('id', m.id)
    if (!error) setMemberships(prev => prev.map(x => x.id === m.id ? { ...x, status: 'rejected' } : x))
  }

  async function revokeMember(m) {
    if (!window.confirm('Revoke this industry membership?')) return
    const { error } = await supabase.from('industry_memberships').update({ status: 'cancelled' }).eq('id', m.id)
    if (!error) setMemberships(prev => prev.map(x => x.id === m.id ? { ...x, status: 'cancelled' } : x))
  }

  // Stats
  const liveHotels      = hotels.filter(h => h.is_active).length
  const pendingHotels   = hotels.filter(h => h.status === 'pending_review').length
  const totalRevenue    = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0)
  const confirmedCount  = bookings.filter(b => b.status === 'confirmed').length
  const activeMembers   = memberships.filter(m => m.status === 'active').length
  const pendingMembers  = memberships.filter(m => m.status === 'pending').length

  const TABS = ['overview', 'hotels', 'bookings', 'waitlist', 'memberships']

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={s.title}>Bly<span style={{ color: '#ef4056' }}>.</span> Admin</div>
          <span style={s.badge}>⚙️ Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#aaa' }}>{user?.email}</span>
          <button
            style={{ ...s.btn('default'), padding: '8px 18px', fontSize: 13 }}
            onClick={() => { signOut(); navigate('/') }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={s.body}>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map(t => (
            <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {t === 'overview' && '📊 '}
              {t === 'hotels'   && '🏨 '}
              {t === 'bookings' && '📅 '}
              {t === 'waitlist' && '📋 '}
              {t === 'memberships' && '🎟️ '}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'hotels'   && pendingHotels > 0 && (
                <span style={{ marginLeft: 6, background: '#ef4056', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>
                  {pendingHotels}
                </span>
              )}
              {t === 'memberships' && pendingMembers > 0 && (
                <span style={{ marginLeft: 6, background: '#ef4056', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>
                  {pendingMembers}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: '#fff', opacity: 0.6 }} />)}
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div style={s.grid}>
                <StatCard icon="🏨" label="Live properties"   value={liveHotels}    sub={`${pendingHotels} pending approval`} />
                <StatCard icon="📅" label="Active bookings"   value={confirmedCount} sub={`${bookings.length} total bookings`} />
                <StatCard icon="💰" label="Total revenue"     value={`R ${totalRevenue.toLocaleString('en-ZA')}`} sub="confirmed + completed" />
                <StatCard icon="📋" label="Waitlist"          value={waitlist.length} sub="people waiting" />
                <StatCard icon="⭐" label="Featured stays"    value={hotels.filter(h => h.is_featured).length} />
                <StatCard icon="🌍" label="Cities covered"    value={new Set(hotels.map(h => h.city)).size} />
                <StatCard icon="🎟️" label="Industry members"  value={activeMembers} sub={`${pendingMembers} pending approval`} />
              </div>
            )}

            {/* Hotels */}
            {tab === 'hotels' && (
              <HotelsTab
                hotels={hotels}
                onApprove={approveHotel}
                onReject={rejectHotel}
                onToggleActive={toggleActive}
                onToggleFeatured={toggleFeatured}
              />
            )}

            {/* Bookings */}
            {tab === 'bookings' && (
              <BookingsTab
                bookings={bookings}
                onUpdateStatus={updateBookingStatus}
              />
            )}

            {/* Waitlist */}
            {tab === 'waitlist' && (
              <WaitlistTab
                waitlist={waitlist}
                onDelete={deleteWaitlist}
              />
            )}

            {/* Industry memberships */}
            {tab === 'memberships' && (
              <MembersTab
                memberships={memberships}
                names={memberNames}
                onApprove={approveMember}
                onReject={rejectMember}
                onRevoke={revokeMember}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
