import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// BLY. CRM — lives ONLY inside /admin (loaded lazily by Admin.jsx when the CRM tab
// is opened). Every table is protected by row-level security (public.is_admin()),
// so non-admins get no data even if they find this code.
// Tracks corporate / B2B accounts and property partners. Not for travellers.
// ─────────────────────────────────────────────────────────────────────────────

const STAGES = ['Lead', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost']
const OPEN_STAGES = ['Lead', 'Contacted', 'Proposal', 'Negotiation']
const TYPES = ['Corporate', 'Property partner', 'Travel agent', 'Other']
const STATUSES = ['Prospect', 'Active', 'Inactive']
const ACT_TYPES = ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note']
const ACT_ICON = { Call: '📞', Email: '✉️', WhatsApp: '💬', Meeting: '🤝', Note: '📝' }
const STAGE_COLOR = { Lead: '#94a3b8', Contacted: '#60a5fa', Proposal: '#f59e0b', Negotiation: '#a78bfa', Won: '#16a34a', Lost: '#dc2626' }

const c = {
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
  h2: { fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', margin: '0 0 12px' },
  sub: (a) => ({ padding: '7px 16px', borderRadius: 99, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', background: a ? '#ef4056' : '#fff', color: a ? '#fff' : '#555' }),
  btn: (v) => ({ padding: '8px 16px', borderRadius: 99, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', background: v === 'accent' ? '#ef4056' : v === 'red' ? '#fee2e2' : v === 'green' ? '#dcfce7' : '#f1f5f9', color: v === 'accent' ? '#fff' : v === 'red' ? '#dc2626' : v === 'green' ? '#16a34a' : '#333' }),
  mini: { padding: '3px 9px', borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  input: { width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #E2DFDB', fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box', background: '#fff' },
  label: { fontSize: 12, fontWeight: 700, color: '#777', marginBottom: 4, display: 'block' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', borderBottom: '1px solid #f0ede8' },
  td: { padding: '12px 16px', fontSize: 14, color: '#333', borderBottom: '1px solid #f0ede8' },
  muted: { color: '#999', fontSize: 13 },
}

const today = () => new Date().toISOString().slice(0, 10)
const money = (v) => (v == null || v === '' ? '—' : 'R' + Number(v).toLocaleString('en-ZA', { maximumFractionDigits: 0 }))
const fdate = (d) => (d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
const clean = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' ? null : v]))

// ── Generic modal form ───────────────────────────────────────────────────────
function FormModal({ title, fields, initial, onSave, onClose, saveLabel = 'Save' }) {
  const [vals, setVals] = useState(() => {
    const v = {}
    fields.forEach((f) => { v[f.key] = initial?.[f.key] ?? f.default ?? '' })
    return v
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k, v) => setVals((p) => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    const missing = fields.find((f) => f.required && !String(vals[f.key] ?? '').trim())
    if (missing) { setErr(`${missing.label} is required`); return }
    setBusy(true); setErr('')
    try {
      const out = { ...vals }
      fields.forEach((f) => { if (f.type === 'number' && out[f.key] !== '') out[f.key] = Number(out[f.key]) })
      await onSave(out)
    } catch (ex) { setErr(ex.message || 'Could not save'); setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} style={{ ...c.card, width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ ...c.h2, fontSize: 20 }}>{title}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {fields.map((f) => (
            <div key={f.key} style={{ gridColumn: f.wide ? '1 / -1' : 'auto' }}>
              <label style={c.label}>{f.label}{f.required ? ' *' : ''}</label>
              {f.type === 'select' ? (
                <select style={c.input} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                  {f.blank && <option value="">—</option>}
                  {f.options.map((o) => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea style={{ ...c.input, minHeight: 80, resize: 'vertical' }} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              ) : (
                <input style={c.input} type={f.type || 'text'} step={f.type === 'number' ? 'any' : undefined} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} />
              )}
            </div>
          ))}
        </div>
        {err && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" style={c.btn()} onClick={onClose}>Cancel</button>
          <button type="submit" style={c.btn('accent')} disabled={busy}>{busy ? 'Saving…' : saveLabel}</button>
        </div>
      </form>
    </div>
  )
}

// ── Field definitions ────────────────────────────────────────────────────────
const companyFields = [
  { key: 'name', label: 'Company name', required: true, wide: true },
  { key: 'type', label: 'Type', type: 'select', options: TYPES, default: 'Corporate' },
  { key: 'status', label: 'Status', type: 'select', options: STATUSES, default: 'Prospect' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'city', label: 'City' },
  { key: 'province', label: 'Province' },
  { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
]
const contactFields = [
  { key: 'first_name', label: 'First name', required: true },
  { key: 'last_name', label: 'Last name' },
  { key: 'job_title', label: 'Job title', wide: true },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
]

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CrmTab() {
  const [view, setView] = useState('dashboard')
  const [data, setData] = useState({ companies: [], contacts: [], deals: [], activities: [], tasks: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [openCompany, setOpenCompany] = useState(null)

  const load = useCallback(async () => {
    const [co, ct, de, ac, ta] = await Promise.all([
      supabase.from('crm_companies').select('*').order('name'),
      supabase.from('crm_contacts').select('*').order('first_name'),
      supabase.from('crm_deals').select('*').order('created_at', { ascending: false }),
      supabase.from('crm_activities').select('*').order('occurred_at', { ascending: false }),
      supabase.from('crm_tasks').select('*').order('due_date', { ascending: true, nullsFirst: false }),
    ])
    const firstErr = [co, ct, de, ac, ta].find((r) => r.error)
    if (firstErr) setError(firstErr.error.message); else setError('')
    setData({ companies: co.data || [], contacts: ct.data || [], deals: de.data || [], activities: ac.data || [], tasks: ta.data || [] })
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const companyById = useMemo(() => Object.fromEntries(data.companies.map((x) => [x.id, x])), [data.companies])
  const contactById = useMemo(() => Object.fromEntries(data.contacts.map((x) => [x.id, x])), [data.contacts])

  // generic db helpers (always reload after a write)
  const save = async (table, id, values) => {
    const q = id ? supabase.from(table).update(clean(values)).eq('id', id) : supabase.from(table).insert(clean(values))
    const { error: e } = await q
    if (e) throw e
    setModal(null); await load()
  }
  const remove = async (table, id, what) => {
    if (!window.confirm(`Delete this ${what}? This cannot be undone.`)) return
    const { error: e } = await supabase.from(table).delete().eq('id', id)
    if (e) { setError(e.message); return }
    await load()
  }

  // deals
  const dealFields = (companyId) => [
    { key: 'title', label: 'Deal title', required: true, wide: true },
    { key: 'company_id', label: 'Company', type: 'select', required: true, default: companyId || '', blank: true, options: data.companies.map((x) => ({ value: x.id, label: x.name })), wide: true },
    { key: 'stage', label: 'Stage', type: 'select', options: STAGES, default: 'Lead' },
    { key: 'value_zar', label: 'Value (R)', type: 'number' },
    { key: 'contact_id', label: 'Contact', type: 'select', blank: true, options: data.contacts.filter((x) => !companyId || x.company_id === companyId).map((x) => ({ value: x.id, label: `${x.first_name} ${x.last_name || ''}`.trim() })) },
    { key: 'next_follow_up', label: 'Next follow-up', type: 'date' },
    { key: 'expected_close', label: 'Expected close', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
  ]
  const saveDeal = (id) => async (vals) => {
    const v = { ...vals }
    v.closed_at = v.stage === 'Won' || v.stage === 'Lost' ? new Date().toISOString() : null
    await save('crm_deals', id, v)
  }
  const moveDeal = async (deal, dir) => {
    const i = STAGES.indexOf(deal.stage) + dir
    if (i < 0 || i >= STAGES.length) return
    const stage = STAGES[i]
    const { error: e } = await supabase.from('crm_deals').update({ stage, closed_at: stage === 'Won' || stage === 'Lost' ? new Date().toISOString() : null }).eq('id', deal.id)
    if (e) setError(e.message); else load()
  }

  // activities + tasks
  const activityFields = (companyId) => [
    { key: 'type', label: 'Type', type: 'select', options: ACT_TYPES, default: 'Call' },
    { key: 'contact_id', label: 'Contact', type: 'select', blank: true, options: data.contacts.filter((x) => x.company_id === companyId).map((x) => ({ value: x.id, label: `${x.first_name} ${x.last_name || ''}`.trim() })) },
    { key: 'summary', label: 'What happened', type: 'textarea', required: true, wide: true },
    { key: 'follow_up', label: 'Follow up on (optional)', type: 'date', wide: true },
  ]
  const logActivity = (companyId) => async (vals) => {
    const { follow_up, ...rest } = vals
    const { error: e1 } = await supabase.from('crm_activities').insert(clean({ ...rest, company_id: companyId }))
    if (e1) throw e1
    if (follow_up) {
      const { error: e2 } = await supabase.from('crm_tasks').insert({ company_id: companyId, title: `Follow up: ${String(rest.summary).slice(0, 80)}`, due_date: follow_up })
      if (e2) throw e2
    }
    setModal(null); await load()
  }
  const taskFields = (companyId) => [
    { key: 'title', label: 'Task', required: true, wide: true },
    { key: 'company_id', label: 'Company', type: 'select', blank: true, default: companyId || '', options: data.companies.map((x) => ({ value: x.id, label: x.name })), wide: true },
    { key: 'due_date', label: 'Due date', type: 'date', default: today() },
  ]
  const toggleTask = async (t) => {
    const { error: e } = await supabase.from('crm_tasks').update({ done: !t.done, done_at: t.done ? null : new Date().toISOString() }).eq('id', t.id)
    if (e) setError(e.message); else load()
  }

  // derived
  const openDeals = data.deals.filter((d) => OPEN_STAGES.includes(d.stage))
  const openTasks = data.tasks.filter((t) => !t.done)
  const t0 = today()
  const dueTasks = openTasks.filter((t) => t.due_date && t.due_date <= t0)
  const dueDeals = openDeals.filter((d) => d.next_follow_up && d.next_follow_up <= t0)
  const monthStart = t0.slice(0, 8) + '01'
  const wonThisMonth = data.deals.filter((d) => d.stage === 'Won' && (d.closed_at || '').slice(0, 10) >= monthStart)

  const openCo = openCompany ? companyById[openCompany] : null

  const Banner = error ? <div style={{ ...c.card, background: '#fee2e2', color: '#b91c1c', marginBottom: 16, fontSize: 13 }}>{error}</div> : null

  if (loading) return <div style={{ ...c.card, color: '#999' }}>Loading CRM…</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['dashboard', '📈 Dashboard'], ['pipeline', '🧭 Pipeline'], ['companies', '🏢 Companies'], ['tasks', `✅ Tasks${dueTasks.length ? ` (${dueTasks.length})` : ''}`]].map(([k, l]) => (
          <button key={k} style={c.sub(view === k && !openCo)} onClick={() => { setView(k); setOpenCompany(null) }}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={c.btn('accent')} onClick={() => setModal({ title: 'New company', fields: companyFields, onSave: (v) => save('crm_companies', null, v) })}>+ Company</button>
        <button style={c.btn()} onClick={() => setModal({ title: 'New deal', fields: dealFields(openCo?.id), onSave: saveDeal(null) })}>+ Deal</button>
      </div>
      {Banner}

      {/* ── Company detail ── */}
      {openCo && (
        <CompanyDetail
          co={openCo}
          data={data}
          contactById={contactById}
          onBack={() => setOpenCompany(null)}
          onEditCompany={() => setModal({ title: 'Edit company', fields: companyFields, initial: openCo, onSave: (v) => save('crm_companies', openCo.id, v) })}
          onAddContact={() => setModal({ title: 'New contact', fields: contactFields, onSave: (v) => save('crm_contacts', null, { ...v, company_id: openCo.id }) })}
          onEditContact={(ct) => setModal({ title: 'Edit contact', fields: contactFields, initial: ct, onSave: (v) => save('crm_contacts', ct.id, v) })}
          onDeleteContact={(ct) => remove('crm_contacts', ct.id, 'contact')}
          onAddDeal={() => setModal({ title: 'New deal', fields: dealFields(openCo.id), onSave: saveDeal(null) })}
          onEditDeal={(d) => setModal({ title: 'Edit deal', fields: dealFields(openCo.id), initial: d, onSave: saveDeal(d.id) })}
          onDeleteDeal={(d) => remove('crm_deals', d.id, 'deal')}
          onLog={() => setModal({ title: 'Log activity', fields: activityFields(openCo.id), onSave: logActivity(openCo.id), saveLabel: 'Log it' })}
          onDeleteActivity={(a) => remove('crm_activities', a.id, 'activity')}
          onAddTask={() => setModal({ title: 'New task', fields: taskFields(openCo.id), onSave: (v) => save('crm_tasks', null, v) })}
          onToggleTask={toggleTask}
        />
      )}

      {/* ── Dashboard ── */}
      {!openCo && view === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
            <Stat label="Companies" value={data.companies.length} sub={`${data.companies.filter((x) => x.status === 'Active').length} active`} />
            <Stat label="Open deals" value={openDeals.length} sub={money(openDeals.reduce((a, d) => a + Number(d.value_zar || 0), 0)) + ' in pipeline'} />
            <Stat label="Won this month" value={wonThisMonth.length} sub={money(wonThisMonth.reduce((a, d) => a + Number(d.value_zar || 0), 0))} />
            <Stat label="Follow-ups due" value={dueTasks.length + dueDeals.length} sub="tasks + deals, today or overdue" hot={dueTasks.length + dueDeals.length > 0} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <div style={c.card}>
              <h3 style={c.h2}>Follow up now</h3>
              {dueTasks.length + dueDeals.length === 0 && <div style={c.muted}>Nothing due. 🎉</div>}
              {dueDeals.map((d) => (
                <Row key={d.id} onClick={() => setOpenCompany(d.company_id)} left={`🧭 ${d.title}`} mid={companyById[d.company_id]?.name} right={fdate(d.next_follow_up)} late={d.next_follow_up < t0} />
              ))}
              {dueTasks.map((t) => (
                <Row key={t.id} onClick={() => t.company_id && setOpenCompany(t.company_id)} left={`✅ ${t.title}`} mid={companyById[t.company_id]?.name} right={fdate(t.due_date)} late={t.due_date < t0} />
              ))}
            </div>
            <div style={c.card}>
              <h3 style={c.h2}>Pipeline by stage</h3>
              {STAGES.map((st) => {
                const ds = data.deals.filter((d) => d.stage === st)
                return (
                  <div key={st} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: STAGE_COLOR[st] }} />
                    <span style={{ flex: 1, fontSize: 14 }}>{st}</span>
                    <span style={{ fontWeight: 700 }}>{ds.length}</span>
                    <span style={{ ...c.muted, width: 90, textAlign: 'right' }}>{money(ds.reduce((a, d) => a + Number(d.value_zar || 0), 0))}</span>
                  </div>
                )
              })}
            </div>
            <div style={c.card}>
              <h3 style={c.h2}>Recent activity</h3>
              {data.activities.length === 0 && <div style={c.muted}>No activity logged yet.</div>}
              {data.activities.slice(0, 8).map((a) => (
                <Row key={a.id} onClick={() => setOpenCompany(a.company_id)} left={`${ACT_ICON[a.type] || '📝'} ${a.summary.slice(0, 70)}`} mid={companyById[a.company_id]?.name} right={fdate(a.occurred_at)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline board ── */}
      {!openCo && view === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, minmax(210px, 1fr))`, gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {STAGES.map((st) => {
            const ds = data.deals.filter((d) => d.stage === st)
            return (
              <div key={st} style={{ background: '#efede9', borderRadius: 14, padding: 10, minHeight: 200 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px 10px', fontWeight: 800, fontSize: 13 }}>
                  <span style={{ color: STAGE_COLOR[st] }}>● {st}</span><span style={c.muted}>{ds.length}</span>
                </div>
                {ds.map((d) => (
                  <div key={d.id} style={{ ...c.card, padding: 12, marginBottom: 8, borderRadius: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer' }} onClick={() => setOpenCompany(d.company_id)}>{d.title}</div>
                    <div style={c.muted}>{companyById[d.company_id]?.name}</div>
                    <div style={{ fontSize: 13, margin: '4px 0' }}>{money(d.value_zar)}</div>
                    {d.next_follow_up && <div style={{ fontSize: 12, color: d.next_follow_up < t0 && OPEN_STAGES.includes(d.stage) ? '#dc2626' : '#888' }}>Follow up {fdate(d.next_follow_up)}</div>}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button style={c.mini} disabled={STAGES.indexOf(d.stage) === 0} onClick={() => moveDeal(d, -1)}>◀</button>
                      <button style={c.mini} disabled={STAGES.indexOf(d.stage) === STAGES.length - 1} onClick={() => moveDeal(d, 1)}>▶</button>
                      <button style={{ ...c.mini, marginLeft: 'auto' }} onClick={() => setModal({ title: 'Edit deal', fields: dealFields(d.company_id), initial: d, onSave: saveDeal(d.id) })}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Companies ── */}
      {!openCo && view === 'companies' && <CompanyList data={data} onOpen={setOpenCompany} />}

      {/* ── Tasks ── */}
      {!openCo && view === 'tasks' && (
        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={c.h2}>Open tasks</h3>
            <button style={c.btn('accent')} onClick={() => setModal({ title: 'New task', fields: taskFields(null), onSave: (v) => save('crm_tasks', null, v) })}>+ Task</button>
          </div>
          {openTasks.length === 0 && <div style={c.muted}>No open tasks.</div>}
          {openTasks.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0ede8' }}>
              <input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{t.title}</div>
                {t.company_id && <button style={{ ...c.muted, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setOpenCompany(t.company_id)}>{companyById[t.company_id]?.name}</button>}
              </div>
              <span style={{ fontSize: 13, color: t.due_date && t.due_date < t0 ? '#dc2626' : '#888', fontWeight: t.due_date && t.due_date < t0 ? 700 : 400 }}>{fdate(t.due_date)}</span>
              <button style={c.mini} onClick={() => remove('crm_tasks', t.id, 'task')}>✕</button>
            </div>
          ))}
        </div>
      )}

      {modal && <FormModal {...modal} onClose={() => setModal(null)} />}
    </div>
  )
}

// ── Small pieces ─────────────────────────────────────────────────────────────
function Stat({ label, value, sub, hot }) {
  return (
    <div style={c.card}>
      <div style={c.muted}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', color: hot ? '#ef4056' : '#111' }}>{value}</div>
      <div style={{ ...c.muted, fontSize: 12 }}>{sub}</div>
    </div>
  )
}
function Row({ left, mid, right, late, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid #f0ede8', cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ flex: 1, fontSize: 14 }}>{left}</span>
      <span style={{ ...c.muted, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mid}</span>
      <span style={{ fontSize: 12, color: late ? '#dc2626' : '#999', fontWeight: late ? 700 : 400 }}>{right}</span>
    </div>
  )
}

function CompanyList({ data, onOpen }) {
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const rows = data.companies.filter((x) =>
    (!type || x.type === type) && (!status || x.status === status) &&
    (!q || [x.name, x.city, x.email].some((f) => (f || '').toLowerCase().includes(q.toLowerCase())))
  )
  const count = (id, list) => list.filter((x) => x.company_id === id).length
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input style={{ ...c.input, width: 260 }} placeholder="Search name, city, email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={{ ...c.input, width: 170 }} value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select style={{ ...c.input, width: 150 }} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{STATUSES.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
        <thead><tr>{['Company', 'Type', 'Status', 'City', 'Contacts', 'Open deals'].map((h) => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id} onClick={() => onOpen(x.id)} style={{ cursor: 'pointer' }}>
              <td style={{ ...c.td, fontWeight: 700 }}>{x.name}</td>
              <td style={c.td}>{x.type}</td>
              <td style={c.td}>{x.status}</td>
              <td style={c.td}>{x.city || '—'}</td>
              <td style={c.td}>{count(x.id, data.contacts)}</td>
              <td style={c.td}>{data.deals.filter((d) => d.company_id === x.id && OPEN_STAGES.includes(d.stage)).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div style={{ textAlign: 'center', padding: '50px 20px', color: '#aaa' }}>{data.companies.length === 0 ? 'No companies yet. Click "+ Company" to add your first one.' : 'No companies match.'}</div>}
    </div>
  )
}

function CompanyDetail({ co, data, contactById, onBack, onEditCompany, onAddContact, onEditContact, onDeleteContact, onAddDeal, onEditDeal, onDeleteDeal, onLog, onDeleteActivity, onAddTask, onToggleTask }) {
  const contacts = data.contacts.filter((x) => x.company_id === co.id)
  const deals = data.deals.filter((x) => x.company_id === co.id)
  const acts = data.activities.filter((x) => x.company_id === co.id)
  const tasks = data.tasks.filter((x) => x.company_id === co.id)
  const wa = (n) => (n || '').replace(/[^\d]/g, '').replace(/^0/, '27')
  return (
    <div>
      <button style={{ ...c.btn(), marginBottom: 14 }} onClick={onBack}>← Back</button>
      <div style={{ ...c.card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.03em' }}>{co.name}</div>
            <div style={c.muted}>{co.type} · {co.status}{co.city ? ` · ${co.city}` : ''}{co.province ? `, ${co.province}` : ''}</div>
            <div style={{ fontSize: 14, marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {co.email && <a href={`mailto:${co.email}`}>{co.email}</a>}
              {co.phone && <a href={`tel:${co.phone}`}>{co.phone}</a>}
              {co.website && <a href={/^https?:/.test(co.website) ? co.website : `https://${co.website}`} target="_blank" rel="noreferrer">{co.website}</a>}
            </div>
            {co.notes && <div style={{ fontSize: 14, marginTop: 10, whiteSpace: 'pre-wrap' }}>{co.notes}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <button style={c.btn('accent')} onClick={onLog}>📝 Log activity</button>
            <button style={c.btn()} onClick={onEditCompany}>Edit</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={c.h2}>Contacts</h3><button style={c.mini} onClick={onAddContact}>+ Add</button></div>
          {contacts.length === 0 && <div style={c.muted}>No contacts yet.</div>}
          {contacts.map((ct) => (
            <div key={ct.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700 }}>{ct.first_name} {ct.last_name} {ct.job_title && <span style={{ ...c.muted, fontWeight: 400 }}>· {ct.job_title}</span>}</div>
                <div style={{ display: 'flex', gap: 6 }}><button style={c.mini} onClick={() => onEditContact(ct)}>Edit</button><button style={c.mini} onClick={() => onDeleteContact(ct)}>✕</button></div>
              </div>
              <div style={{ fontSize: 13, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {ct.email && <a href={`mailto:${ct.email}`}>{ct.email}</a>}
                {ct.phone && <a href={`tel:${ct.phone}`}>{ct.phone}</a>}
                {ct.whatsapp && <a href={`https://wa.me/${wa(ct.whatsapp)}`} target="_blank" rel="noreferrer">WhatsApp</a>}
              </div>
              {ct.notes && <div style={{ ...c.muted, marginTop: 4 }}>{ct.notes}</div>}
            </div>
          ))}
        </div>

        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={c.h2}>Deals</h3><button style={c.mini} onClick={onAddDeal}>+ Add</button></div>
          {deals.length === 0 && <div style={c.muted}>No deals yet.</div>}
          {deals.map((d) => (
            <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div><span style={{ fontWeight: 700 }}>{d.title}</span> <span style={{ fontSize: 11, fontWeight: 800, color: STAGE_COLOR[d.stage] }}>● {d.stage}</span></div>
                <div style={{ display: 'flex', gap: 6 }}><button style={c.mini} onClick={() => onEditDeal(d)}>Edit</button><button style={c.mini} onClick={() => onDeleteDeal(d)}>✕</button></div>
              </div>
              <div style={c.muted}>{money(d.value_zar)}{d.contact_id && contactById[d.contact_id] ? ` · ${contactById[d.contact_id].first_name}` : ''}{d.next_follow_up ? ` · follow up ${fdate(d.next_follow_up)}` : ''}</div>
            </div>
          ))}
        </div>

        <div style={c.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={c.h2}>Tasks</h3><button style={c.mini} onClick={onAddTask}>+ Add</button></div>
          {tasks.length === 0 && <div style={c.muted}>No tasks.</div>}
          {tasks.map((t) => (
            <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0ede8', opacity: t.done ? 0.5 : 1 }}>
              <input type="checkbox" checked={t.done} onChange={() => onToggleTask(t)} />
              <span style={{ flex: 1, fontSize: 14, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
              <span style={{ fontSize: 12, color: !t.done && t.due_date && t.due_date < today() ? '#dc2626' : '#999' }}>{fdate(t.due_date)}</span>
            </div>
          ))}
        </div>

        <div style={c.card}>
          <h3 style={c.h2}>History</h3>
          {acts.length === 0 && <div style={c.muted}>Nothing logged yet. Use "Log activity" after each call, email or meeting.</div>}
          {acts.map((a) => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0ede8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={c.muted}>{ACT_ICON[a.type]} {a.type}{a.contact_id && contactById[a.contact_id] ? ` · ${contactById[a.contact_id].first_name}` : ''} · {fdate(a.occurred_at)}</div>
                <button style={c.mini} onClick={() => onDeleteActivity(a)}>✕</button>
              </div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{a.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
