import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DatePicker from './DatePicker'

// CERTIFICATION RESTRICTION LIFTED 2026-08-14 -- HyperGuest issued the live
// token and Phase 3 (live property booking) is underway. Full city search
// is now enabled again. If this ever needs to go back to cert-only mode
// (e.g. live token revoked), set this back to true.
const CERT_RESTRICTED = false
const CERT_RESTRICTED_CITIES = ['Haifa']

// Kept alphabetical for readability in the source, though the dropdown
// re-sorts everything anyway once the live city list merges in.
const MAJOR_CITIES = [
  'Ballito', 'Bela-Bela', 'Bloemfontein', 'Cape Town', 'Clarens',
  'Durban', 'East London', 'Franschhoek', 'George', 'Gqeberha',
  'Hartbeespoort', 'Hazyview', 'Hermanus', 'Hoedspruit', "Jeffrey's Bay",
  'Johannesburg', 'Kimberley', 'Knysna', 'Langebaan', 'Magaliesburg',
  'Marloth Park', 'Mossel Bay', 'Nelspruit', 'Oudtshoorn', 'Paarl',
  'Paternoster', 'Pilanesberg', 'Plettenberg Bay', 'Polokwane', 'Pretoria',
  'Sabi Sand', 'Somerset West', 'Springbok', 'St Lucia', 'Stellenbosch',
  'Sun City', 'Tzaneen', 'Umhlanga', 'Upington', 'White River',
]

// ── Date helpers, all guarded against invalid/empty input ──
// Native <input type="date"> can briefly emit an empty or partial string
// while a user is typing digit-by-digit (not just via the picker UI), and
// new Date('').toISOString() THROWS rather than returning null -- that was
// crashing the component whenever a date field went through an intermediate
// invalid state. Every function below now fails safe instead.

function isValidDateStr(str) {
  if (!str) return false
  const d = new Date(str)
  return !isNaN(d.getTime())
}

function defaultCheckIn() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function addNights(dateStr, nights) {
  if (!isValidDateStr(dateStr)) return defaultCheckIn()
  const d = new Date(dateStr)
  d.setDate(d.getDate() + nights)
  return d.toISOString().split('T')[0]
}

function nightsBetween(checkIn, checkOut) {
  if (!isValidDateStr(checkIn) || !isValidDateStr(checkOut)) return 1
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

  const initialCities = CERT_RESTRICTED ? CERT_RESTRICTED_CITIES : [...MAJOR_CITIES].sort()
  const [cities, setCities] = useState(initialCities)
  const [city, setCity] = useState(initialCity || initialCities[0])
  const [checkIn, setCheckIn] = useState(isValidDateStr(initialCheckIn) ? initialCheckIn : defaultCheckIn())
  const [checkOut, setCheckOut] = useState(
    isValidDateStr(initialCheckOut) ? initialCheckOut : addNights(isValidDateStr(initialCheckIn) ? initialCheckIn : defaultCheckIn(), 2)
  )
  const [adults, setAdults] = useState(initialAdults || 2)
  const [error, setError] = useState('')

  useEffect(() => {
    if (CERT_RESTRICTED) return
    async function fetchListedCities() {
      const { data, error } = await supabase.from('hg_cities').select('city')
      if (error) {
        console.error('Failed to load HyperGuest city list:', error)
        return
      }
      if (data) {
        const listed = data.map(row => row.city).filter(Boolean)
        // Always alphabetical -- merge major cities + live-synced cities,
        // dedupe, then sort once as the final step so ordering is
        // consistent regardless of which list contributed a given city.
        const merged = Array.from(new Set([...MAJOR_CITIES, ...listed])).sort((a, b) => a.localeCompare(b))
        setCities(merged)
      }
    }
    fetchListedCities()
  }, [])

  // Only auto-adjust checkOut when checkIn is actually a valid date --
  // an in-progress/invalid checkIn should never cascade into breaking
  // checkOut too.
  useEffect(() => {
    if (!isValidDateStr(checkIn)) return
    if (!isValidDateStr(checkOut) || new Date(checkOut) <= new Date(checkIn)) {
      setCheckOut(addNights(checkIn, 1))
    }
  }, [checkIn])

  const go = () => {
    setError('')
    if (!isValidDateStr(checkIn) || !isValidDateStr(checkOut)) {
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

  // Safe fallback for the checkout field's min attribute -- never throws
  // even if checkIn is momentarily invalid while being edited.
  const checkoutMin = isValidDateStr(checkIn) ? addNights(checkIn, 1) : undefined

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
          <DatePicker
            value={checkIn}
            onChange={setCheckIn}
            min={new Date().toISOString().split('T')[0]}
            label="Check-in date"
          />
        </div>
        <div style={s.field}>
          <span style={s.icon}>📅</span>
          <DatePicker
            value={checkOut}
            onChange={setCheckOut}
            min={checkoutMin}
            label="Check-out date"
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
