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
    padding: '6px 6px 6px 0', display: 'flex', alignItems: 'center',
    boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
    width: '100%', maxWidth: 860,
  },
  field: {
    display: 'flex', alignItems: 'center', gap: 10,
    flex: 1, padding: '10px 20px',
    borderRight: '1px solid #E2DFDB',
  },
  fieldLast: {
    display: 'flex', alignItems: 'center', gap: 10,
    flex: 1, padding: '10px 20px',
  },
  icon: { fontSize: 16, flexShrink: 0 },
  input: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 14, color: '#111', width: '100%',
    fontFamily: 'var(--font-body)',
  },
  select: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 14, color: '#111', width: '100%',
    appearance: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer',
  },
  searchBtn: {
    background: '#111', color: '#fff', borderRadius: 99,
    padding: '12px 22px', fontFamily: 'var(--font-body)',
    fontWeight: 700, fontSize: 14, border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
    marginLeft: 6,
  },
}

export default function SearchBar() {
  const navigate  = useNavigate()
  const today     = new Date().toISOString().split('T')[0]
  const threeDays = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

  const [cities,   setCities]   = useState(MAJOR_CITIES)
  const [city,     setCity]     = useState('Cape Town')
  const [checkIn,  setCheckIn]  = useState(today)
  const [checkOut, setCheckOut] = useState(threeDays)
  const [guests,   setGuests]   = useState(2)

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

  const go = () => {
    const params = new URLSearchParams({ city, checkIn, checkOut, guests })
    navigate(`/search?${params}`)
  }

  return (
    <div style={s.wrapper}>

      <div style={s.field}>
        <span style={s.icon}>📍</span>
        <select style={s.select} value={city} onChange={e => setCity(e.target.value)}>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={s.field}>
        <span style={s.icon}>📅</span>
        <input type="date" style={s.input} value={checkIn} min={today}
          onChange={e => setCheckIn(e.target.value)} />
      </div>

      <div style={s.field}>
        <span style={s.icon}>📅</span>
        <input type="date" style={s.input} value={checkOut} min={checkIn}
          onChange={e => setCheckOut(e.target.value)} />
      </div>

      <div style={s.fieldLast}>
        <span style={s.icon}>👥</span>
        <input
          type="number" style={{ ...s.input, maxWidth: 36 }}
          value={guests} min={1} max={20}
          onChange={e => setGuests(e.target.value)}
        />
        <span style={{ fontSize: 13, color: '#999' }}>
          {guests == 1 ? 'guest' : 'guests'}
        </span>
      </div>

      <button style={s.searchBtn} onClick={go}>
        🔍 Search
      </button>

    </div>
  )
}
