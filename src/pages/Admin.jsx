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
            <td style={{ ...s.td, whiteSpace: 'pre-wrap', maxWidth: 400 }}>{c.message}</td>
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
          <tr>{['Name', 'Email', 'Phone', 'Trade Pro', 'Marketing OK', 'Entered'].map(h => (
            <th key={h} style={s.th}>{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id}>
              <td style={s.td}>{e.first_name} {e.last_name}</td>
              <td style={s.td}><a href={`mailto:${e.email}`} style={{ color: 'var(--accent)', fontSize: 13 }}>{e.email}</a></td>
              <td style={s.td}>{e.phone || <span style={{ color: '#ccc' }}>—</span>}</td>
              <td style={s.td}>{e.travel_professional ? <span style={{ color: '#4ade80', fontSize: 12 }}>Yes</span> : <span style={{ color: '#ccc', fontSize: 12 }}>No</span>}</td>
              <td style={s.td}>{e.marketing_consent ? <span style={{ color: '#4ade80', fontSize: 12 }}>Yes</span> : <span style={{ color: '#ccc', fontSize: 12 }}>No</span>}</td>
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

// ── Reviews moderation tab ─────────────────────────────────────
function ReviewsTab({ reviews, onApprove, onReject }) {
  if (!reviews.length) return <div style={s.empty}>No reviews yet.</div>

  const STAR = (n, v) => (
    <span style={{ fontSize: 13 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= v ? '#f59e0b' : '#e2e0db' }}>★</span>
      ))}
    </span>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={s.table}>
        <thead>
          <tr>
            {['Date', 'Reviewer', 'Property', 'Ratings', 'Comment', 'Status', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {reviews.map(r => (
            <tr key={r.id} style={{ opacity: r.status === 'rejected' ? 0.5 : 1 }}>
              <td style={{ ...s.td, fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                {new Date(r.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td style={s.td}>
                <div style={{ fontWeight: 600 }}>{r.reviewer_name || 'Guest'}</div>
              </td>
              <td style={{ ...s.td, fontSize: 12, color: '#666' }}>
                {r.hyperguest_property_id ? `HG #${r.hyperguest_property_id}` : '—'}
              </td>
              <td style={s.td}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {STAR(1, r.rating)}
                    <span style={{ fontSize: 11, color: '#888' }}>Overall</span>
                  </div>
                  {r.cleanliness_rating != null && (
                    <div style={{ fontSize: 11, color: '#aaa' }}>
                      Clean {r.cleanliness_rating} · Location {r.location_rating} · Value {r.value_rating} · Service {r.service_rating}
                    </div>
                  )}
                </div>
              </td>
              <td style={{ ...s.td, maxWidth: 260, fontSize: 13, color: '#555' }}>
                {r.comment || <span style={{ color: '#ccc' }}>No comment</span>}
              </td>
              <td style={s.td}>
                <span style={s.pill(r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'yellow')}>
                  {r.status}
                </span>
              </td>
              <td style={s.td}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {r.status !== 'approved' && (
                    <button style={s.btn('green')} onClick={() => onApprove(r)}>Approve</button>
                  )}
                  {r.status !== 'rejected' && (
                    <button style={s.btn('red')} onClick={() => onReject(r)}>Reject</button>
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

// ── Corporate accounts tab ──────────────────────────────────
function CorporatesTab({ corporates, onSave, onToggleActive, creating, setCreating, form, setForm, saving, corporateRequests = [], onApproveRequest, onRejectRequest }) {
  const pending = corporateRequests.filter(r => r.status === 'pending')
  const allReqs = corporateRequests
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={s.note}>Corporate portal accounts. Each account gets a private login and a negotiated rate discount.</p>
        <button style={{ ...s.btn('accent'), padding: '9px 20px', fontSize: 13 }} onClick={() => setCreating(true)}>
          + New account
        </button>
      </div>

      {creating && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>New corporate account</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Company name *', key: 'company_name', type: 'text', placeholder: 'Acme Corp' },
              { label: 'Contact name', key: 'contact_name', type: 'text', placeholder: 'Jane Smith' },
              { label: 'Email *', key: 'email', type: 'email', placeholder: 'jane@acmecorp.com' },
              { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min 8 characters' },
              { label: 'Commission / Discount %', key: 'commission_pct', type: 'number', placeholder: '10' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e0db', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 6 }}>Notes</label>
              <input
                type="text"
                value={form.notes ?? ''}
                placeholder="Agreement details, etc."
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e0db', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={{ ...s.btn('accent'), padding: '9px 24px' }} onClick={onSave} disabled={saving}>
              {saving ? 'Creating…' : 'Create account'}
            </button>
            <button style={{ ...s.btn('default'), padding: '9px 20px' }} onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Requests panel ── */}
      {allReqs.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            Account Requests
            {pending.length > 0 && (
              <span style={{ background: '#ef4056', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>{pending.length} pending</span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Company', 'Contact', 'Email', 'Phone', 'Message', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allReqs.map(req => (
                  <tr key={req.id} style={{ opacity: req.status !== 'pending' ? 0.55 : 1 }}>
                    <td style={{ ...s.td, fontWeight: 700 }}>{req.company_name}</td>
                    <td style={s.td}>{req.contact_name}</td>
                    <td style={s.td}><a href={`mailto:${req.email}`} style={{ color: 'var(--accent)', fontSize: 13 }}>{req.email}</a></td>
                    <td style={s.td}>{req.phone || '—'}</td>
                    <td style={{ ...s.td, maxWidth: 200, fontSize: 12, color: '#666' }}>{req.message || '—'}</td>
                    <td style={{ ...s.td, fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(req.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td style={s.td}>
                      <span style={s.pill(req.status === 'pending' ? 'yellow' : req.status === 'approved' ? 'green' : 'default')}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...s.btn('green'), padding: '5px 12px', fontSize: 12 }} onClick={() => onApproveRequest(req)}>
                            Approve
                          </button>
                          <button style={{ ...s.btn('red'), padding: '5px 10px', fontSize: 12 }} onClick={() => onRejectRequest(req)}>
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status !== 'pending' && <span style={{ fontSize: 12, color: '#aaa' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ borderTop: '1.5px solid var(--border)', margin: '24px 0 0' }} />
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', margin: '20px 0 14px' }}>Active Accounts</div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Company', 'Contact', 'Email', 'Discount %', 'Portal URL', 'Status', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {corporates.length === 0 && (
              <tr><td colSpan={7} style={{ ...s.td, color: '#aaa', textAlign: 'center', padding: 40 }}>No corporate accounts yet</td></tr>
            )}
            {corporates.map(c => (
              <tr key={c.id}>
                <td style={{ ...s.td, fontWeight: 700 }}>{c.company_name}</td>
                <td style={s.td}>{c.contact_name || '—'}</td>
                <td style={s.td}>{c.email ? <a href={`mailto:${c.email}`} style={{ color: 'var(--accent)', fontSize: 13 }}>{c.email}</a> : '—'}</td>
                <td style={s.td}>
                  <CommissionEdit corporate={c} onSaved={updated => onToggleActive(updated, null)} />
                </td>
                <td style={{ ...s.td, fontSize: 12 }}>
                  <a href="/corporate/login" target="_blank" style={{ color: 'var(--accent)' }}>bly.travel/corporate/login</a>
                </td>
                <td style={s.td}>
                  <span style={s.pill(c.is_active ? 'green' : 'default')}>{c.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={s.td}>
                  <button
                    style={s.btn(c.is_active ? 'red' : 'green')}
                    onClick={() => onToggleActive(c, !c.is_active)}
                  >
                    {c.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CommissionEdit({ corporate, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [pct, setPct] = useState(String(corporate.commission_pct ?? 0))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const { data, error } = await supabase
      .from('corporate_accounts')
      .update({ commission_pct: Number(pct), updated_at: new Date().toISOString() })
      .eq('id', corporate.id)
      .select()
      .single()
    setSaving(false)
    if (!error && data) { onSaved(data); setEditing(false) }
  }

  if (!editing) return (
    <span
      onClick={() => setEditing(true)}
      style={{ cursor: 'pointer', fontWeight: 700, color: Number(corporate.commission_pct) > 0 ? '#ef4056' : '#333',
        borderBottom: '1px dashed #ccc', padding: '2px 4px' }}
      title="Click to edit"
    >
      {corporate.commission_pct ?? 0}%
    </span>
  )
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <input type="number" min={0} max={100} step={0.5} value={pct}
        onChange={e => setPct(e.target.value)}
        style={{ width: 64, padding: '4px 8px', borderRadius: 8, border: '1px solid #e2e0db', fontSize: 13 }}
      />
      <button style={s.btn('green')} onClick={save} disabled={saving}>{saving ? '…' : '✓'}</button>
      <button style={s.btn('default')} onClick={() => setEditing(false)}>✕</button>
    </span>
  )
}

// ── Promo codes tab ──────────────────────────────────────────
function PromosTab({ promos, onCreate, onToggle, creating, setCreating, form, setForm, saving }) {
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={s.note}>Percentage-off promo codes. Active codes can be redeemed at <strong>/promo</strong> and the discount applies at checkout.</p>
        <button style={{ ...s.btn('accent'), padding: '9px 20px', fontSize: 13 }} onClick={() => setCreating(true)}>
          + New code
        </button>
      </div>

      {creating && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>New promo code</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
            {[
              { label: 'Code *', key: 'code', type: 'text', placeholder: 'SUMMER10' },
              { label: 'Discount % *', key: 'discount_pct', type: 'number', placeholder: '10' },
              { label: 'Max uses (blank = unlimited)', key: 'max_uses', type: 'number', placeholder: '' },
              { label: 'Expires (blank = never)', key: 'expires_at', type: 'date', placeholder: '' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key] ?? ''}
                  placeholder={f.placeholder}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid #e2e0db', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box', textTransform: f.key === 'code' ? 'uppercase' : 'none' }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={{ ...s.btn('accent'), padding: '9px 24px' }} onClick={onCreate} disabled={saving}>
              {saving ? 'Creating…' : 'Create code'}
            </button>
            <button style={{ ...s.btn('default'), padding: '9px 20px' }} onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Code', 'Discount', 'Used', 'Max uses', 'Expires', 'Status', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && (
              <tr><td colSpan={7} style={{ ...s.td, color: '#aaa', textAlign: 'center', padding: 32 }}>No promo codes yet.</td></tr>
            )}
            {promos.map(p => (
              <tr key={p.id}>
                <td style={{ ...s.td, fontWeight: 800, letterSpacing: '0.06em', fontSize: 15 }}>{p.code}</td>
                <td style={{ ...s.td, color: '#ef4056', fontWeight: 700 }}>{p.discount_pct}%</td>
                <td style={s.td}>{p.uses_count}</td>
                <td style={s.td}>{p.max_uses ?? '∞'}</td>
                <td style={s.td}>{fmtDate(p.expires_at)}</td>
                <td style={s.td}>
                  <span style={s.pill(p.active ? 'green' : 'default')}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={s.td}>
                  <button
                    style={{ ...s.btn(p.active ? 'red' : 'green'), fontSize: 12 }}
                    onClick={() => onToggle(p)}
                  >
                    {p.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Events tab ───────────────────────────────────────────────
const CATEGORIES = ['Festival', 'Sport', 'Business', 'Global']
const PRIORITIES  = ['MEGA', 'LARGE', 'MEDIUM']

const BLANK_EVENT = { name: '', sub: '', date_label: '', month: '', year: '', city: '', area: '', category: 'Festival', priority: 'LARGE', slug: '', icon: '📅', description: '', active: true }

const evInputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e0db', fontSize: 13, fontFamily: 'var(--font-body)', boxSizing: 'border-box' }
const evLabelStyle = { fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }

function EventForm({ onSubmit, onCancel, title, form, setForm, saving }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 1px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        {[
          { label: 'Event name *',  key: 'name',       type: 'text', span: 2 },
          { label: 'Sub-title',     key: 'sub',        type: 'text', span: 2 },
          { label: 'Date label *',  key: 'date_label', type: 'text', placeholder: '14 Jun 2026' },
          { label: 'Month (1–12) *',key: 'month',      type: 'number', placeholder: '6' },
          { label: 'Year *',        key: 'year',       type: 'number', placeholder: '2026' },
          { label: 'Icon',          key: 'icon',       type: 'text', placeholder: '📅' },
          { label: 'City *',        key: 'city',       type: 'text' },
          { label: 'Area',          key: 'area',       type: 'text', placeholder: 'Western Cape' },
          { label: 'Slug *',        key: 'slug',       type: 'text', placeholder: 'accommodation-event-city-2026', span: 2 },
          { label: 'Event start',   key: 'event_start', type: 'date' },
          { label: 'Event end',     key: 'event_end',   type: 'date' },
        ].map(f => (
          <div key={f.key} style={{ gridColumn: f.span ? `span ${f.span}` : 'span 1' }}>
            <label style={evLabelStyle}>{f.label}</label>
            <input type={f.type} value={form[f.key] ?? ''} placeholder={f.placeholder || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={evInputStyle} />
          </div>
        ))}
        <div>
          <label style={evLabelStyle}>Category *</label>
          <select value={form.category ?? 'Festival'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={evInputStyle}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={evLabelStyle}>Priority *</label>
          <select value={form.priority ?? 'LARGE'} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={evInputStyle}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={evLabelStyle}>Active</label>
          <select value={form.active ? 'yes' : 'no'} onChange={e => setForm(p => ({ ...p, active: e.target.value === 'yes' }))} style={evInputStyle}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={evLabelStyle}>Write-up / description</label>
        <textarea value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} style={{ ...evInputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ ...s.btn('accent'), padding: '9px 24px' }} onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : title.startsWith('New') ? 'Create event' : 'Save changes'}
        </button>
        <button style={{ ...s.btn('default'), padding: '9px 20px' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function EventsTab({ events, onCreate, onSave, onToggle, onDelete, creating, setCreating, editing, setEditing, form, setForm, saving }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={s.note}>Events shown on <strong>/events/south-africa</strong>. Edit the write-up, dates, priority or city at any time — changes go live instantly.</p>
        <button style={{ ...s.btn('accent'), padding: '9px 20px', fontSize: 13 }} onClick={() => { setForm({ ...BLANK_EVENT }); setCreating(true); setEditing(null) }}>
          + New event
        </button>
      </div>

      {creating && (
        <EventForm title="New event" onSubmit={onCreate} onCancel={() => { setCreating(false); setForm({}) }} form={form} setForm={setForm} saving={saving} />
      )}
      {editing && !creating && (
        <EventForm title={`Edit — ${editing.name}`} onSubmit={() => onSave(editing.id)} onCancel={() => { setEditing(null); setForm({}) }} form={form} setForm={setForm} saving={saving} />
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr>
              {['','Event','Date','City','Category','Priority','Active','Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={8} style={{ ...s.td, color: '#aaa', textAlign: 'center', padding: 32 }}>No events yet.</td></tr>
            )}
            {events.map(ev => (
              <tr key={ev.id} style={{ opacity: ev.active ? 1 : 0.5 }}>
                <td style={{ ...s.td, fontSize: 22, width: 40 }}>{ev.icon}</td>
                <td style={s.td}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ev.name}</div>
                  {ev.sub && <div style={{ fontSize: 11, color: '#aaa' }}>{ev.sub}</div>}
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 2, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.description}</div>
                </td>
                <td style={{ ...s.td, whiteSpace: 'nowrap' }}>{ev.date_label}</td>
                <td style={s.td}>{ev.city}</td>
                <td style={s.td}>{ev.category}</td>
                <td style={s.td}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: ev.priority === 'MEGA' ? '#fff0f2' : ev.priority === 'LARGE' ? '#fff7ed' : '#f0f9ff', color: ev.priority === 'MEGA' ? '#c8001e' : ev.priority === 'LARGE' ? '#c2570a' : '#0369a1' }}>
                    {ev.priority}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={s.pill(ev.active ? 'green' : 'default')}>{ev.active ? 'Live' : 'Hidden'}</span>
                </td>
                <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                  <button style={{ ...s.btn('default'), marginRight: 6 }} onClick={() => { setForm({ ...ev }); setEditing(ev); setCreating(false) }}>Edit</button>
                  <button style={{ ...s.btn(ev.active ? 'red' : 'green'), marginRight: 6 }} onClick={() => onToggle(ev)}>{ev.active ? 'Hide' : 'Show'}</button>
                  <button style={s.btn('red')} onClick={() => onDelete(ev.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Admin Page ───────────────────────────────────────────
export default function Admin() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()

  const isAdmin = role === 'admin'

  const [tab,      setTab]      = useState('overview')
  const [bookings, setBookings] = useState([])
  const [propertyCount, setPropertyCount] = useState(0)
  const [waitlist, setWaitlist] = useState([])
  const [memberships, setMemberships] = useState([])
  const [memberNames, setMemberNames] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [contacts, setContacts] = useState([])
  const [competition, setCompetition] = useState([])
  const [corporates, setCorporates] = useState([])
  const [corporateRequests, setCorporateRequests] = useState([])
  const [corporateForm, setCorporateForm] = useState({})
  const [creatingCorporate, setCreatingCorporate] = useState(false)
  const [savingCorporate, setSavingCorporate] = useState(false)
  const [reviews, setReviews] = useState([])
  const [promos,  setPromos]  = useState([])
  const [promoForm,      setPromoForm]      = useState({})
  const [creatingPromo,  setCreatingPromo]  = useState(false)
  const [savingPromo,    setSavingPromo]    = useState(false)
  const [events,         setEvents]         = useState([])
  const [eventForm,      setEventForm]      = useState({})
  const [creatingEvent,  setCreatingEvent]  = useState(false)
  const [editingEvent,   setEditingEvent]   = useState(null)
  const [savingEvent,    setSavingEvent]    = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (!user)    { navigate('/auth'); return }
    if (!isAdmin) { navigate('/');    return }
    fetchAll()
  }, [user])

  async function fetchAll() {
    setLoading(true)

    const [bookingsRes, staticCountRes, waitlistRes, contactsRes, membersRes, compRes, corporatesRes, corporateRequestsRes, reviewsRes, promosRes, eventsRes] = await Promise.all([
      supabase.from('hg_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('hg_property_static').select('hotel_id', { count: 'exact', head: true }),
      supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('industry_memberships').select('*').order('created_at', { ascending: false }),
      supabase.from('competition_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('corporate_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('corporate_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('events').select('*').order('year').order('month'),
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
    if (corporatesRes.data) setCorporates(corporatesRes.data)
    if (corporateRequestsRes.data) setCorporateRequests(corporateRequestsRes.data)
    if (reviewsRes.data) setReviews(reviewsRes.data)
    if (promosRes.data)  setPromos(promosRes.data)
    if (eventsRes.data)  setEvents(eventsRes.data)

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

  async function createCorporate() {
    const { company_name, contact_name, email, password, commission_pct, notes } = corporateForm
    if (!company_name || !email || !password) { alert('Company name, email and password are required'); return }
    setSavingCorporate(true)
    const { data, error } = await supabase.functions.invoke('corporate-account-create', {
      body: { company_name, contact_name, email, password, commission_pct: Number(commission_pct || 0), notes },
    })
    setSavingCorporate(false)
    if (error || data?.error) { alert(error?.message || data?.error || 'Failed to create account'); return }
    setCorporates(prev => [data.account, ...prev])
    setCorporateForm({})
    setCreatingCorporate(false)
  }

  async function toggleCorporateActive(corporate, newActive) {
    if (newActive === null) {
      setCorporates(prev => prev.map(c => c.id === corporate.id ? corporate : c))
      return
    }
    const { data } = await supabase.from('corporate_accounts').update({ is_active: newActive }).eq('id', corporate.id).select().single()
    if (data) setCorporates(prev => prev.map(c => c.id === corporate.id ? data : c))
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

  async function approveReview(r) {
    const { error } = await supabase.from('reviews').update({ status: 'approved' }).eq('id', r.id)
    if (!error) setReviews(prev => prev.map(x => x.id === r.id ? { ...x, status: 'approved' } : x))
  }

  async function rejectReview(r) {
    const { error } = await supabase.from('reviews').update({ status: 'rejected' }).eq('id', r.id)
    if (!error) setReviews(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected' } : x))
  }

  async function createPromo() {
    const { code, discount_pct, max_uses, expires_at } = promoForm
    if (!code || !discount_pct) { alert('Code and discount % are required'); return }
    const pct = Number(discount_pct)
    if (isNaN(pct) || pct <= 0 || pct > 100) { alert('Discount must be between 1 and 100'); return }
    setSavingPromo(true)
    const payload = {
      code: code.trim().toUpperCase(),
      discount_pct: pct,
      active: true,
      uses_count: 0,
      ...(max_uses ? { max_uses: Number(max_uses) } : {}),
      ...(expires_at ? { expires_at: new Date(expires_at).toISOString() } : {}),
    }
    const { data, error } = await supabase.from('promo_codes').insert(payload).select().single()
    setSavingPromo(false)
    if (error) { alert(error.message || 'Failed to create promo code'); return }
    setPromos(prev => [data, ...prev])
    setPromoForm({})
    setCreatingPromo(false)
  }

  async function togglePromoActive(promo) {
    const { data, error } = await supabase
      .from('promo_codes')
      .update({ active: !promo.active })
      .eq('id', promo.id)
      .select()
      .single()
    if (!error && data) setPromos(prev => prev.map(p => p.id === promo.id ? data : p))
  }

  async function createEvent() {
    const { name, date_label, month, year, city, category, priority, slug } = eventForm
    if (!name || !date_label || !month || !year || !city || !slug) {
      alert('Name, date, month, year, city, and slug are required'); return
    }
    setSavingEvent(true)
    const payload = {
      name: name.trim(),
      sub: (eventForm.sub || '').trim(),
      date_label: date_label.trim(),
      month: Number(month), year: Number(year),
      city: city.trim(), area: (eventForm.area || '').trim(),
      category, priority,
      slug: slug.trim().toLowerCase(),
      icon: (eventForm.icon || '📅').trim(),
      description: (eventForm.description || '').trim(),
      active: eventForm.active !== false,
      event_start: eventForm.event_start || null,
      event_end:   eventForm.event_end   || null,
    }
    const { data, error } = await supabase.from('events').insert(payload).select().single()
    setSavingEvent(false)
    if (error) { alert(error.message || 'Failed to create event'); return }
    setEvents(prev => [...prev, data].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month))
    setEventForm({})
    setCreatingEvent(false)
  }

  async function saveEvent(id) {
    const { name, date_label, month, year, city, category, priority, slug } = eventForm
    if (!name || !date_label || !month || !year || !city || !slug) {
      alert('Name, date, month, year, city, and slug are required'); return
    }
    setSavingEvent(true)
    const payload = {
      name: name.trim(),
      sub: (eventForm.sub || '').trim(),
      date_label: date_label.trim(),
      month: Number(month), year: Number(year),
      city: city.trim(), area: (eventForm.area || '').trim(),
      category, priority,
      slug: slug.trim().toLowerCase(),
      icon: (eventForm.icon || '📅').trim(),
      description: (eventForm.description || '').trim(),
      active: eventForm.active !== false,
      event_start: eventForm.event_start || null,
      event_end:   eventForm.event_end   || null,
    }
    const { data, error } = await supabase.from('events').update(payload).eq('id', id).select().single()
    setSavingEvent(false)
    if (error) { alert(error.message || 'Failed to save event'); return }
    setEvents(prev => prev.map(e => e.id === id ? data : e).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month))
    setEventForm({})
    setEditingEvent(null)
  }

  async function toggleEventActive(ev) {
    const { data, error } = await supabase.from('events').update({ active: !ev.active }).eq('id', ev.id).select().single()
    if (!error && data) setEvents(prev => prev.map(e => e.id === ev.id ? data : e))
  }

  async function deleteEvent(id) {
    if (!window.confirm('Delete this event permanently?')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (!error) setEvents(prev => prev.filter(e => e.id !== id))
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
  const pendingReviews  = reviews.filter(r => r.status === 'pending').length

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

  const TABS = ['overview', 'properties', 'bookings', 'waitlist', 'memberships', 'contacts', 'competition', 'corporates', 'reviews', 'promos', 'events']

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
              {t === 'contacts'    && '✉️ '}
              {t === 'reviews'     && '⭐ '}
              {t === 'promos'      && '🏷️ '}
              {t === 'events'      && '🗓️ '}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'memberships' && pendingMembers > 0 && (
                <span style={{ marginLeft: 6, background: '#ef4056', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>
                  {pendingMembers}
                </span>
              )}
              {t === 'reviews' && pendingReviews > 0 && (
                <span style={{ marginLeft: 6, background: '#ef4056', color: '#fff', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>
                  {pendingReviews}
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
                <StatCard icon="🏢" label="Corporate accounts" value={corporates.length} sub={`${corporateRequests.filter(r => r.status === 'pending').length} requests pending`} />
                <StatCard icon="⭐" label="Reviews" value={reviews.length} sub={`${pendingReviews} pending approval`} />
                <StatCard icon="🏷️" label="Promo codes" value={promos.length} sub={`${promos.filter(p => p.active).length} active`} />
                <StatCard icon="🗓️" label="Events" value={events.length} sub={`${events.filter(e => e.active).length} live`} />
              </div>
            )}

            {/* Properties */}
            {tab === 'properties' && (
              <>
                <p style={s.note}>Properties booked through BLY via HyperGuest, with booking counts and revenue.</p>
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
                <WaitlistTab waitlist={waitlist} onDelete={deleteWaitlist} />
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

            {/* Corporate accounts */}
            {tab === 'corporates' && (
              <CorporatesTab
                corporates={corporates}
                onSave={createCorporate}
                onToggleActive={toggleCorporateActive}
                creating={creatingCorporate}
                setCreating={setCreatingCorporate}
                form={corporateForm}
                setForm={setCorporateForm}
                saving={savingCorporate}
                corporateRequests={corporateRequests}
                onApproveRequest={(req) => {
                  setCorporateRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))
                  setCorporateForm({ company_name: req.company_name, contact_name: req.contact_name, email: req.email })
                  setCreatingCorporate(true)
                }}
                onRejectRequest={async (req) => {
                  await supabase.from('corporate_requests').update({ status: 'rejected' }).eq('id', req.id)
                  setCorporateRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r))
                }}
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

            {/* Reviews moderation */}
            {tab === 'reviews' && (
              <>
                <p style={s.note}>Guest reviews submitted after verified stays. Approve to publish on the hotel page; reject to hide.</p>
                <ReviewsTab reviews={reviews} onApprove={approveReview} onReject={rejectReview} />
              </>
            )}

            {/* Events */}
            {tab === 'events' && (
              <EventsTab
                events={events}
                onCreate={createEvent}
                onSave={saveEvent}
                onToggle={toggleEventActive}
                onDelete={deleteEvent}
                creating={creatingEvent}
                setCreating={setCreatingEvent}
                editing={editingEvent}
                setEditing={setEditingEvent}
                form={eventForm}
                setForm={setEventForm}
                saving={savingEvent}
              />
            )}

            {/* Promo codes */}
            {tab === 'promos' && (
              <PromosTab
                promos={promos}
                onCreate={createPromo}
                onToggle={togglePromoActive}
                creating={creatingPromo}
                setCreating={setCreatingPromo}
                form={promoForm}
                setForm={setPromoForm}
                saving={savingPromo}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
