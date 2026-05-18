import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const ROOM_AMENITIES = [
  'King bed','Twin beds','Single bed','Double bed',
  'Sea view','Garden view','Mountain view','Pool view',
  'Ensuite bathroom','Balcony','Air conditioning',
  'Mini bar','Safe','Smart TV','Kitchenette','Fireplace',
]

const s = {
  page: { maxWidth: 900, margin: '0 auto', padding: '40px 32px' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-1px', marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 },
  hotelCard: { background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: 28 },
  hotelName: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 4 },
  hotelMeta: { fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { padding: '8px 18px', borderRadius: 99, background: 'var(--text)', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  roomRow: { display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 12, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' },
  roomName: { fontWeight: 600, fontSize: 15 },
  roomMeta: { fontSize: 12, color: 'var(--text-muted)', marginTop: 2 },
  pill: { padding: '5px 12px', borderRadius: 99, background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' },
  editBtn: { padding: '6px 14px', borderRadius: 99, border: '1.5px solid var(--border)', background: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' },
  deleteBtn: { padding: '6px 14px', borderRadius: 99, border: '1.5px solid #ffcccc', background: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#cc0000', fontFamily: 'var(--font-body)' },
  empty: { textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 14 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 20 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, marginTop: 14 },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box', outline: 'none' },
  textarea: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box', outline: 'none', minHeight: 80, resize: 'vertical' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  amenityGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 6 },
  chip: (on) => ({ padding: '7px 10px', borderRadius: 8, border: '1.5px solid', borderColor: on ? 'var(--text)' : 'var(--border)', background: on ? 'var(--text)' : 'none', color: on ? '#fff' : 'var(--text)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'center', transition: 'all 0.12s' }),
  modalBtns: { display: 'flex', gap: 10, marginTop: 24 },
  cancelBtn: { flex: 1, padding: '12px 0', borderRadius: 99, border: '1.5px solid var(--border)', background: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  saveBtn: { flex: 2, padding: '12px 0', borderRadius: 99, background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  error: { background: '#fff0f0', color: '#cc0000', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginTop: 12 },
  noHotel: { textAlign: 'center', padding: '60px 0' },
  availRow: { display: 'flex', alignItems: 'center', gap: 8 },
  availDot: (n) => ({ width: 10, height: 10, borderRadius: '50%', background: n > 3 ? '#1a7a40' : n > 0 ? '#a06000' : '#cc0000', flexShrink: 0 }),
}

const EMPTY_ROOM = { name: '', description: '', price_night: '', max_guests: 2, total_rooms: 1, amenities: [], images: '' }

export default function ManageHotel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hotels, setHotels] = useState([])
  const [roomTypes, setRoomTypes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [activeHotel, setActiveHotel] = useState(null)
  const [form, setForm] = useState(EMPTY_ROOM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const { data: h } = await supabase.from('hotels').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (h?.length) {
      setHotels(h)
      for (const hotel of h) {
        const { data: rooms } = await supabase.from('room_types').select('*').eq('hotel_id', hotel.id).order('price_night')
        setRoomTypes(prev => ({ ...prev, [hotel.id]: rooms || [] }))
      }
    }
    setLoading(false)
  }

  function openAdd(hotel) {
    setActiveHotel(hotel)
    setEditingRoom(null)
    setForm(EMPTY_ROOM)
    setError('')
    setShowModal(true)
  }

  function openEdit(hotel, room) {
    setActiveHotel(hotel)
    setEditingRoom(room)
    setForm({ ...room, images: room.images?.join('\n') || '' })
    setError('')
    setShowModal(true)
  }

  function toggleAmenity(a) {
    setForm(f => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a] }))
  }

  async function saveRoom() {
    if (!form.name || !form.price_night) { setError('Name and price are required.'); return }
    setSaving(true); setError('')
    const payload = {
      hotel_id: activeHotel.id,
      name: form.name,
      description: form.description,
      price_night: parseFloat(form.price_night),
      max_guests: parseInt(form.max_guests),
      total_rooms: parseInt(form.total_rooms),
      amenities: form.amenities,
      images: form.images ? form.images.split('\n').map(s => s.trim()).filter(Boolean) : [],
    }
    let err
    if (editingRoom) {
      const res = await supabase.from('room_types').update(payload).eq('id', editingRoom.id)
      err = res.error
    } else {
      const res = await supabase.from('room_types').insert(payload)
      err = res.error
    }
    if (err) { setError(err.message); setSaving(false); return }
    setShowModal(false)
    await loadData()
    setSaving(false)
  }

  async function deleteRoom(roomId, hotelId) {
    if (!window.confirm('Delete this room type?')) return
    await supabase.from('room_types').delete().eq('id', roomId)
    setRoomTypes(prev => ({ ...prev, [hotelId]: prev[hotelId].filter(r => r.id !== roomId) }))
  }

  if (!user) return (
    <div style={{ ...s.page, ...s.noHotel }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
      <div style={s.title}>Sign in required</div>
      <button style={{ marginTop: 20, padding: '12px 28px', borderRadius: 99, background: 'var(--text)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }} onClick={() => navigate('/auth')}>Sign in →</button>
    </div>
  )

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-muted)' }}>Loading your hotels…</div>

  if (!hotels.length) return (
    <div style={{ ...s.page, ...s.noHotel }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🏨</div>
      <div style={s.title}>No hotels listed yet</div>
      <div style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 24 }}>List your first property to start managing room types.</div>
      <button style={{ padding: '12px 28px', borderRadius: 99, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }} onClick={() => navigate('/list-hotel')}>List my hotel →</button>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.title}>Manage my hotel</div>
      <div style={s.sub}>Add and manage room types for your properties.</div>

      {hotels.map(hotel => {
        const rooms = roomTypes[hotel.id] || []
        return (
          <div key={hotel.id} style={s.hotelCard}>
            <div style={s.hotelName}>{hotel.name}</div>
            <div style={s.hotelMeta}>📍 {hotel.city}, {hotel.province} · {hotel.category} · R{Number(hotel.price_night).toLocaleString()} base rate</div>

            <div style={s.sectionTitle}>
              <span>Room types ({rooms.length})</span>
              <button style={s.addBtn} onClick={() => openAdd(hotel)}>+ Add room type</button>
            </div>

            {rooms.length === 0
              ? <div style={s.empty}>No room types yet — add your first one above.</div>
              : rooms.map(room => (
                <div key={room.id} style={s.roomRow}>
                  <div>
                    <div style={s.roomName}>{room.name}</div>
                    <div style={s.roomMeta}>
                      Up to {room.max_guests} guests · {room.total_rooms} room{room.total_rooms > 1 ? 's' : ''} total
                      {room.amenities?.length > 0 && ` · ${room.amenities.slice(0, 3).join(', ')}${room.amenities.length > 3 ? '…' : ''}`}
                    </div>
                  </div>
                  <div style={s.availRow}>
                    <div style={s.availDot(room.total_rooms)} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{room.total_rooms} available</span>
                  </div>
                  <span style={s.pill}>R{Number(room.price_night).toLocaleString()}/night</span>
                  <button style={s.editBtn} onClick={() => openEdit(hotel, room)}>Edit</button>
                  <button style={s.deleteBtn} onClick={() => deleteRoom(room.id, hotel.id)}>Delete</button>
                </div>
              ))
            }
          </div>
        )
      })}

      {/* Modal */}
      {showModal && (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modal}>
            <div style={s.modalTitle}>{editingRoom ? 'Edit room type' : 'Add room type'}</div>

            <label style={s.label}>Room name</label>
            <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Deluxe Suite, Standard Room, Garden Chalet" />

            <label style={s.label}>Description</label>
            <textarea style={s.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what makes this room special…" />

            <div style={s.grid2}>
              <div>
                <label style={s.label}>Price per night (R)</label>
                <input style={s.input} type="number" value={form.price_night} onChange={e => setForm(f => ({ ...f, price_night: e.target.value }))} placeholder="1800" />
              </div>
              <div>
                <label style={s.label}>Max guests</label>
                <input style={s.input} type="number" value={form.max_guests} min={1} max={20} onChange={e => setForm(f => ({ ...f, max_guests: e.target.value }))} />
              </div>
            </div>

            <label style={s.label}>Total rooms of this type</label>
            <input style={s.input} type="number" value={form.total_rooms} min={1} onChange={e => setForm(f => ({ ...f, total_rooms: e.target.value }))} placeholder="e.g. 5" />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>How many of this room type does your property have?</div>

            <label style={s.label}>Room features</label>
            <div style={s.amenityGrid}>
              {ROOM_AMENITIES.map(a => (
                <button key={a} style={s.chip(form.amenities.includes(a))} onClick={() => toggleAmenity(a)}>{a}</button>
              ))}
            </div>

            <label style={s.label}>Photo URLs (one per line)</label>
            <textarea style={{ ...s.textarea, minHeight: 70 }} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://..." />

            {error && <div style={s.error}>{error}</div>}

            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={saveRoom} disabled={saving}>{saving ? 'Saving…' : editingRoom ? 'Save changes' : 'Add room type'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
