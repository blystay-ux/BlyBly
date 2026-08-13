import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// TEMPORARY CERTIFICATION RESTRICTION (added 2026-08-13):
// hyperguest-city-search currently only returns results for property 19912
// (in Haifa) -- our HyperGuest account only has a certification token, not
// a live one. Rather than show the full worldwide city list (~53k+
// properties, hundreds of cities) when everything except Haifa returns an
// empty "restricted" message, the dropdown is limited to just Haifa for
// now. Once HyperGuest issues a live token and ALLOW_LIVE_HYPERGUEST_BOOKINGS
// is flipped on the Edge Functions, replace CERT_RESTRICTED_CITIES below
// with the original dynamic hg_cities fetch (see git history for the
// pre-restriction version of this component).
const CERT_RESTRICTED = true
const CERT_RESTRICTED_CITIES = ['Haifa']

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

function defaultCheckIn() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function addNights(dateStr, nights) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}
function nightsBetween(checkIn, checkOut) {
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

const s = {
  wrapper: {
    background: '#fff', borderRadius: 99,
    padding: '6px 6px 6px 0', display: 'flex', alignItems: 'center',
    boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
    width: '100%', maxWidth: 720, flexWrap: 'wrap', rowGap: 6,
  },
  field: {
    display: 'flex', alignItems: 'center', gap: 8,
    flex: 1, minWidth: 130, padding: '10px 16px',
    borderRight: '1px solid #E2DFDB',
  },
  fieldLast: {
    display: 'flex', alignItems: 'center', gap: 8,
    flex: 1, minWidth: 130, padding: '10px 16px',
  },
  icon: { fontSize: 15, flexShrink: 0 },
  input: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 13, color: '#111', width: '100%',
    fontFamily: 'var(--font-body)',
  },
  select: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 13, color: '#111', width: '100%',
    appearance: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer',
  },
  searchBtn: {
    background: '#111', color: '#fff', borderRadius: 99,
    padding: '12px 22px', fontFamily: 'var(--font-body)',
    fontWeight: 700, fontSize: 14, border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: 6, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 6,
  },
  error: { width: '100%', color: '#ef4056', fontSize: 12, fontWeight: 600, padding: '4px 20px 0' },
  notice: { width: '100%', color: '#8a8580', fontSize: 11, padding: '4px 20px 0' },
}

export default function SearchBar({ initialCity, initialCheckIn, initialCheckOut, initialAdults }) {
  const navigate = useNavigate()

  const [cities, setCities] = useState(CERT_RESTRICTED ? CERT_RESTRICTED_CITIES : MAJOR_CITIES)
  const [city, setCity] = useState(initialCity || cities[0])
  const [checkIn, setCheckIn] = useState(initialCheckIn || defaultCheckIn())
  const [checkOut, setCheckOut] = useState(initialCheckOut || addNights(initialCheckIn || defaultCheckIn(), 2))
  const [adults, setAdults] = useState(initialAdults || 2)
  const [error, setError] = useState('')

  useEffect(() => {
    if (CERT_RESTRICTED) return // skip the dynamic fetch entirely while restricted
    async function fetchListedCities() {
      const { data, error } = await supabase.from('hg_cities').select('city')
      if (error) {
        console.error('Failed to load HyperGuest city list:', error)
        return
      }
      if (data) {
        const listed = data.map(row => row.city).filter(Boolean)
        const merged = Array.from(new Set([...MAJOR_CITIES, ...listed])).sort()
        setCities(merged)
      }
    }
    fetchListedCities()
  }, [])

  useEffect(() => {
    if (new Date(checkOut) <= new Date(checkIn)) {
      setCheckOut(addNights(checkIn, 1))
    }
  }, [checkIn])

  const go = () => {
    setError('')
    if (!checkIn || !checkOut) {
      setError('Please select your check-in and check-out dates.')
      return
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out must be after check-in.')
      return
    }
    if (new Date(checkIn) < new Date(new Date().toDateString())) {
      setError('Check-in date is in the past.')
      return
    }
    const params = new URLSearchParams({
      city,
      checkIn,
      nights: String(nightsBetween(checkIn, checkOut)),
      adults: String(adults),
    })
    navigate(`/search?${params}`)
  }

  return (
    <div>
      <div style={s.wrapper}>
        <div style={s.field}>
          <span style={s.icon}>📍</span>
          <select style={s.select} value={city} onChange={e => setCity(e.target.value)}>
            {cities.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <span style={s.icon}>📅</span>
          <input
            type="date" style={s.input} value={checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setCheckIn(e.target.value)}
            aria-label="Check-in date"
          />
        </div>
        <div style={s.field}>
          <span style={s.icon}>📅</span>
          <input
            type="date" style={s.input} value={checkOut}
            min={addNights(checkIn, 1)}
            onChange={e => setCheckOut(e.target.value)}
            aria-label="Check-out date"
          />
        </div>
        <div style={s.fieldLast}>
          <span style={s.icon}>🧑‍🤝‍🧑</span>
          <select style={s.select} value={adults} onChange={e => setAdults(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'adult' : 'adults'}</option>
            ))}
          </select>
        </div>
        <button style={s.searchBtn} onClick={go}>🔍 Search</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {CERT_RESTRICTED && !error && (
        <div style={s.notice}>Search is temporarily limited to Haifa while our HyperGuest integration completes certification.</div>
      )}
    </div>
  )
}
