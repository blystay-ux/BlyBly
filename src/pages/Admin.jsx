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
  tabs:    { display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' },
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
  note:    { fontSize: 12, color: '#aaa', marginBottom: 16 },
}

const STATUS_COLOR = { Confirmed: 'green', Pending: 'yellow', Cancelled: 'red', Rejected: 'red', Failed: 'red' }

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

// Real HyperGuest properties that have actually been booked through BLY,
// grouped with booking counts and revenue -- replaces the old "Hotels" tab,
// which managed individually-listed properties from before the pivot to
// HyperGuest as the supply source (BLY no longer approves/lists properties
// one at a time; HyperGuest supplies all of them).
function ContactsTab({ contacts }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>
          {['Date','Name','Email','Message'].map(h => (
            <th key={h} style={s.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {contacts.length === 0 && (
          <tr><td colSpan={4} style={{ ...s.td, color: '#aaa', textAlign: 'center', padding: 32 }}>No messages yet</td></tr>
        )}
        {contacts.map(c => (
          <tr key={c.id}>
            <td style={s.td}>{new Date(c.created_at).toLocaleDateString('en-ZA')}</td>
            <td style={s.td}>{c.name}</td>
            <td style={s.td}><a href={`mailto:${c.email}`} style={{ color: 'var(--accent)' }}>{c.email}</a></td>
            <td style={s.td} style={{ whiteSpace: 'pre-wrap', maxWidth: 400 }}>{c.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function PropertiesTab({ properties }) {
  if (!properties.length) return <div style={s.empty}>No properties booked yet.</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            {['Property', 'HyperGuest ID', 'Bookings', 'Revenue'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {properties.map(p => (
            <tr key={p.propertyId}>
              <td style={s.td}><div style={{ fontWeight: 700 }}>{p.name}</div></td>
              <td style={{ ...s.td, fontSize: 12, color: '#aaa' }}>{p.propertyId}</td>
              <td style={{ ...s.td, textAlign: 'center' }}>{p.bookingCount}</td>
              <td style={s.td}>
                {Object.entries(p.revenueByCurrency).map(([cur, amt]) => (
                  <div key={cur}>{cur} {amt.toLocaleString('en-ZA')}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Real bookings from hg_bookings (HyperGuest) -- replaces the old
// "Bookings" tab, which read from the unused legacy `bookings` table.
// Read-only except for Cancel, which calls the real hyperguest-cancel
// Edge Function -- an actual cancellation with HyperGuest, not just a
// local status flag.
function BookingsTab({ bookings, onCancel, cancellingId }) {
  if (!bookings.length) return <div style={s.empty}>No bookings yet.</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            {['Guest', 'Property', 'Check-in', 'Check-out', 'Total', 'Status', 'Reference', 'Action'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => {
            const guest = b.lead_guest || {}
            const sell = b.prices?.sell
            const canCancel = b.status === 'Confirmed' || b.status === 'Pending'
            return (
              <tr key={b.id}>
                <td style={s.td}>
                  <div style={{ fontWeight: 600 }}>{[guest.firstName, guest.lastName].filter(Boolean).join(' ') || '—'}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{guest.email || '—'}</div>
                </td>
                <td style={{ ...s.td, fontSize: 12 }}>{b.property_name || `Property ${b.hyperguest_property_id}`}</td>
                <td style={s.td}>{b.check_in}</td>
                <td style={s.td}>{b.check_out}</td>
                <td style={s.td}>{sell ? `${sell.currency} ${Number(sell.price).toLocaleString('en-ZA')}` : '—'}</td>
                <td style={s.td}><span style={s.pill(STATUS_COLOR[b.status] || 'default')}>{b.status}</span></td>
                <td style={{ ...s.td, fontSize: 12, color: '#aaa' }}>{b.agency_reference || '—'}</td>
                <td style={s.td}>
                  {canCancel && (
                    <button
                      style={s.btn('red')}
                      onClick={() => onCancel(b)}
                      disabled={cancellingId === b.id}
                    >
                      {cancellingId === b.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CompetitionTab({ entries }) {
  if (!entries.length) return <div style={s.empty}>No competition entries yet.</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>{['Name', 'Email', 'Phone', 'Trade Pro', 'Entered'].map(h => (
            <th key={h} style={s.th}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id} style={s.tr}>
              <td style={s.td}>{e.first_name} {e.last_name}</td>
              <td style={s.td}><a href={`mailto:${e.email}`} style={{ color: 'var(--accent)', fontSize: 13 }}>{e.email}</a></td>
              <td style={s.td}>{e.phone || <span style={{ color: '#ccc' }}>—</span>}</td>
              <td style={s.td}>{e.travel_professional ? <span style={{ color: '#4ade80', fontSize: 12 }}>Yes</span> : <span style={{ color: '#ccc', fontSize: 12 }}>No</span>}</td>
              <td style={s.td}>{new Date(e.created_at).toLocaleDateString('en-ZA')}</td>
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
            {['Member', 'Email', 'Employer', 'Applied', 'Status', 'Payment', 'Expires', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {memberships.map(m => (
            <tr key={m.id}>
              <td style={s.td}>
                <div style={{ fontWeight: 700 }}>
                  {[m.title, m.first_name, m.surname].filter(Boolean).join(' ') || names[m.user_id] || 'Member'}
                </div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{m.user_id.slice(0, 8)}</div>
              </td>
              <td style={s.td}>
                {m.applicant_email
                  ? <a href={`mailto:${m.applicant_email}`} style={{ color: 'var(--accent)', fontSize: 13 }}>{m.applicant_email}</a>
                  : <span style={{ color: '#ccc', fontSize: 13 }}>—</span>}
              </td>
              <td style={s.td}>
                <div>{m.employer_name || '—'}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {[m.employer_segment, m.country].filter(Boolean).join(' · ')}
                </div>
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
  const [bookings, setBookings] = useState([])       // real hg_bookings, enriched with property_name
  const [propertyCount, setPropertyCount] = useState(0) // cached properties (hg_property_static) -- rough proxy for "Featured stays" pool
  const [waitlist, setWaitlist] = useState([])
  const [memberships, setMemberships] = useState([])
  const [memberNames, setMemberNames] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [contacts, setContacts] = useState([])
  const [competition, setCompetition] = useState([])

  // Redirect if not admin
  useEffect(() => {
    if (!user)    { navigate('/auth'); return }
    if (!isAdmin) { navigate('/');    return }
    fetchAll()
  }, [user])

  async function fetchAll() {
    setLoading(true)

    const [bookingsRes, staticCountRes, waitlistRes, contactsRes, membersRes, compRes] = await Promise.all([
      supabase.from('hg_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('hg_property_static').select('hotel_id', { count: 'exact', head: true }),
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('industry_memberships').select('*').order('created_at', { ascending: false }),
      supabase.from('competition_entries').select('*').order('created_at', { ascending: false }),
    ])

    let enrichedBookings = bookingsRes.data || []
    if (enrichedBookings.length) {
      const propertyIds = [...new Set(enrichedBookings.map(b => b.hyperguest_property_id).filter(Boolean))]
      if (propertyIds.length) {
        const { data: props } = await supabase
          .from('hg_property_index')
          .select('hotel_id, name')
          .in('hotel_id', propertyIds)
        const nameById = {}
        ;(props || []).forEach(p => { nameById[p.hotel_id] = p.name })
        enrichedBookings = enrichedBookings.map(b => ({ ...b, property_name: nameById[b.hyperguest_property_id] || null }))
      }
    }
    setBookings(enrichedBookings)
    setPropertyCount(staticCountRes.count || 0)

    if (waitlistRes.data) setWaitlist(waitlistRes.data)
    if (contactsRes.data) setContacts(contactsRes.data)
    if (compRes.data) setCompetition(compRes.data)

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

  async function cancelBooking(booking) {
    if (!window.confirm(`Cancel booking ${booking.agency_reference || booking.id}? This calls HyperGuest directly.`)) return
    setCancellingId(booking.id)
    try {
      const { data, error } = await supabase.functions.invoke('hyperguest-cancel', {
        body: { bookingId: booking.id, reason: 'Cancelled by BLY admin', simulation: false },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: data.content?.status || 'Cancelled' } : b))
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`)
    }
    setCancellingId(null)
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

  // ── Real stats, derived from hg_bookings ──
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed')
  const cancelledBookings = bookings.filter(b => b.status === 'Cancelled')
  const revenueByCurrency = {}
  confirmedBookings.forEach(b => {
    const sell = b.prices?.sell
    if (!sell) return
    revenueByCurrency[sell.currency] = (revenueByCurrency[sell.currency] || 0) + Number(sell.price || 0)
  })
  const distinctPropertyIds = new Set(bookings.map(b => b.hyperguest_property_id).filter(Boolean))
  const activeMembers   = memberships.filter(m => m.status === 'active').length
  const pendingMembers  = memberships.filter(m => m.status === 'pending').length

  // Properties grouped for the Properties tab
  const propertiesMap = {}
  bookings.forEach(b => {
    if (!b.hyperguest_property_id) return
    const id = b.hyperguest_property_id
    if (!propertiesMap[id]) {
      propertiesMap[id] = { propertyId: id, name: b.property_name || `Property ${id}`, bookingCount: 0, revenueByCurrency: {} }
    }
    propertiesMap[id].bookingCount += 1
    if (b.status === 'Confirmed' && b.prices?.sell) {
      const { currency, price } = b.prices.sell
      propertiesMap[id].revenueByCurrency[currency] = (propertiesMap[id].revenueByCurrency[currency] || 0) + Number(price || 0)
    }
  })
  const propertiesList = Object.values(propertiesMap).sort((a, b) => b.bookingCount - a.bookingCount)

  const TABS = ['overview', 'properties', 'bookings', 'waitlist', 'memberships', 'contacts', 'competition']

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
              {t === 'overview'    && '📊 '}
              {t === 'properties'  && '🏨 '}
              {t === 'bookings'    && '📅 '}
              {t === 'waitlist'    && '📋 '}
              {t === 'memberships' && '🎟️ '}
              {t === 'contacts' && '✉️ '}
              {t.charAt(0).toUpperCase() + t.slice(1)}
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
            {/* Overview -- now sourced from real HyperGuest bookings */}
            {tab === 'overview' && (
              <div style={s.grid}>
                <StatCard icon="📅" label="Total bookings" value={bookings.length} sub={`${confirmedBookings.length} confirmed`} />
                <StatCard
                  icon="💰" label="Revenue (confirmed)"
                  value={Object.keys(revenueByCurrency).length
                    ? Object.entries(revenueByCurrency).map(([c, v]) => `${c} ${v.toLocaleString('en-ZA')}`).join(' · ')
                    : 'R0'}
                  sub="sell price, per currency"
                />
                <StatCard icon="🏨" label="Properties booked" value={distinctPropertyIds.size} sub={`${propertyCount} cached with photos`} />
                <StatCard icon="✕" label="Cancelled bookings" value={cancelledBookings.length} />
                <StatCard icon="📋" label="Waitlist" value={waitlist.length} sub="people waiting" />
                <StatCard icon="🎁" label="Competition" value={competition.length} sub="entries received" />
                <StatCard icon="🎟️" label="Industry members" value={activeMembers} sub={`${pendingMembers} pending approval`} />
              </div>
            )}

            {/* Properties */}
            {tab === 'properties' && (
              <>
                <p style={s.note}>Properties booked through BLY via HyperGuest, with booking counts and revenue. This replaces the old hotel-listing approval workflow, since HyperGuest supplies all properties directly.</p>
                <PropertiesTab properties={propertiesList} />
              </>
            )}

            {/* Bookings */}
            {tab === 'bookings' && (
              <>
                <p style={s.note}>Real bookings made through HyperGuest. Cancel calls HyperGuest directly and reflects the actual outcome, including any cancellation penalty already applied.</p>
                <BookingsTab bookings={bookings} onCancel={cancelBooking} cancellingId={cancellingId} />
              </>
            )}

            {/* Waitlist */}
            {tab === 'waitlist' && (
              <>
                <p style={s.note}>Note: this reads from the `waitlist` table. If your "Coming Soon" signup form writes to a different table (e.g. `property_leads`), this list may not reflect real signups -- worth double-checking.</p>
                <WaitlistTab
                  waitlist={waitlist}
                  onDelete={deleteWaitlist}
                />
              </>
            )}

            {/* Competition entries */}
            {tab === 'competition' && (
              <>
                <p style={s.note}>September Giveaway entries — draw on 30 Sep 2026.</p>
                <CompetitionTab entries={competition} />
              </>
            )}

            {/* Contact messages */}
            {tab === 'contacts' && (
              <>
                <p style={s.note}>Messages submitted via the Contact page.</p>
                <ContactsTab contacts={contacts} />
              </>
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
