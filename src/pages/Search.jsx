import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const MAJOR_CITIES = [
  'Cape Town', 'Johannesburg', 'Pretoria', 'Durban', 'Gqeberha',
  'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Kimberley',
  'George', 'Hermanus', 'Franschhoek', 'Stellenbosch', 'Knysna',
  'Mossel Bay', 'Plettenberg Bay', 'Oudtshoorn', 'Hazyview', 'White River',
  'Hoedspruit', 'Hartbeespoort', 'Magaliesburg', 'Clarens', 'Paternoster',
  'Langebaan', 'Paarl', 'Somerset West', 'Umhlanga', 'Ballito',
  'St Lucia', "Jeffrey's Bay", 'Pilanesberg', 'Sun City', 'Bela-Bela',
  'Sabi Sand', 'Marloth Park', 'Upington', 'Springbok', 'Tzaneen',
]

const s = {
  wrapper: {
    background: '#fff', borderRadius: 99,
    padding: '8px 24px', display: 'flex', alignItems: 'center',
    gap: 0, boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
    width: '100%', maxWidth: 860,
  },
  field: {
    display: 'flex', alignItems: 'center', gap: 10,
    flex: 1, padding: '10px 20px',
    borderRight: '1px solid #E2DFDB', cursor: 'pointer',
  },
  fieldLast: {
    display: 'flex', alignItems: 'center', gap: 10,
    flex: 1, padding: '10px 20px', cursor: 'pointer',
  },
  icon: { fontSize: 18 },
  input: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 15, color: '#111', width: '100%', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  select: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 15, color: '#111', width: '100%', cursor: 'pointer',
    appearance: 'none', fontFamily: 'var(--font-body)',
  },
}

export default function SearchBar() {
  const navigate = useNavigate()
  const today     = new Date().toISOString().split('T')[0]
  const threeDays = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

  const [cities,   setCities]   = useState(MAJOR_CITIES)
  const [city,     setCity]     = useState('Cape Town')
  const [checkIn,  setCheckIn]  = useState(today)
  const [checkOut, setCheckOut] = useState(threeDays)
  const [guests,   setGuests]   = useState(2)

  // Merge major cities with any additional cities from listed hotels
  useEffect(() => {
    async function fetchListedCities() {
      const { data } = await supabase
        .from('hotels')
        .select('city')
        .not('city', 'is', null)

      if (data) {
        const listed = data.map(h => h.city).filter(Boolean)
        const merged = Array.from(new Set([...MAJOR_CITIES, ...listed])).sort()
        setCities(merged)
      }
    }
    fetchListedCities()
  }, [])

  const go = (overrides = {}) => {
    const params = new URLSearchParams({ city, checkIn, checkOut, guests, ...overrides })
    navigate(`/search?${params}`)
  }

  const handleKey = (e) => { if (e.key === 'Enter') go() }

  return (
    <div style={s.wrapper}>

      {/* Location — auto-searches on city change */}
      <div style={s.field}>
        <span style={s.icon}>📍</span>
        <select
          style={s.select}
          value={city}
          onChange={e => { setCity(e.target.value); go({ city: e.target.value }) }}
        >
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Check-in */}
      <div style={s.field}>
        <span style={s.icon}>📅</span>
        <input type="date" style={s.input} value={checkIn} min={today}
          onChange={e => setCheckIn(e.target.value)} onKeyDown={handleKey} />
      </div>

      {/* Check-out */}
      <div style={s.field}>
        <span style={s.icon}>📅</span>
        <input type="date" style={s.input} value={checkOut} min={checkIn}
          onChange={e => setCheckOut(e.target.value)} onKeyDown={handleKey} />
      </div>

      {/* Guests */}
      <div style={s.fieldLast}>
        <span style={s.icon}>👥</span>
        <input
          type="number" style={{ ...s.input, maxWidth: 40 }}
          value={guests} min={1} max={20}
          onChange={e => setGuests(e.target.value)} onKeyDown={handleKey}
        />
        <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>
          {guests == 1 ? 'guest' : 'guests'} · ↵
        </span>
      </div>

    </div>
  )
}
