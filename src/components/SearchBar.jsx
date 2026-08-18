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

// Always shown first, in this exact order -- not alphabetized among
// themselves, unlike everything else in the dropdown.
const PRIORITY_CITIES = ['Cape Town', 'Johannesburg', 'Pretoria', 'Durban']

// Fallback South African cities shown before the live hg_cities fetch
// completes (or if it fails). Priority cities are deliberately excluded
// here since they're always rendered separately, above this list.
const FALLBACK_SA_CITIES = [
  'Ballito', 'Bela-Bela', 'Bloemfontein', 'Clarens',
  'East London', 'Franschhoek', 'George', 'Gqeberha',
  'Hartbeespoort', 'Hazyview', 'Hermanus', 'Hoedspruit', "Jeffrey's Bay",
  'Kimberley', 'Knysna', 'Langebaan', 'Magaliesburg',
  'Marloth Park', 'Mossel Bay', 'Nelspruit', 'Oudtshoorn', 'Paarl',
  'Paternoster', 'Pilanesberg', 'Plettenberg Bay', 'Polokwane',
  'Sabi Sand', 'Somerset West', 'Springbok', 'St Lucia', 'Stellenbosch',
  'Sun City', 'Tzaneen', 'Umhlanga', 'Upington', 'White River',
].sort((a, b) => a.localeCompare(b))

// Converts an ISO country code (e.g. "ZA") to a readable name (e.g. "South
// Africa") using the browser's built-in Intl API -- no need to hand-maintain
// a country code lookup table. Falls back to the raw code if unsupported.
let countryNamer = null
try {
  countryNamer = new Intl.DisplayNames(['en'], { type: 'region' })
} catch {
  countryNamer = null
}
function countryName(code) {
  if (!code) return 'Other'
  try {
    return (countryNamer && countryNamer.of(code)) || code
  } catch {
    return code
  }
}

// ── Date helpers, all guarded against invalid/empty input ──
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

function buildFallbackGroups() {
  return [{ label: 'South Africa', cities: FALLBACK_SA_CITIES }]
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

  const [cityGroups, setCityGroups] = useState(CERT_RESTRICTED ? [] : buildFallbackGroups())
  const [city, setCity] = useState(initialCity || (CERT_RESTRICTED ? CERT_RESTRICTED_CITIES[0] : PRIORITY_CITIES[0]))
  const [checkIn, setCheckIn] = useState(isValidDateStr(initialCheckIn) ? initialCheckIn : defaultCheckIn())
  const [checkOut, setCheckOut] = useState(
    isValidDateStr(initialCheckOut) ? initialCheckOut : addNights(isValidDateStr(initialCheckIn) ? initialCheckIn : defaultCheckIn(), 2)
  )
  // Default is 1 adult, not 2.
  const [adults, setAdults] = useState(initialAdults || 1)
  const [error, setError] = useState('')

  useEffect(() => {
    if (CERT_RESTRICTED) return
    async function fetchListedCities() {
      const { data, error } = await supabase.from('hg_cities').select('city, country')
      if (error) {
        console.error('Failed to load HyperGuest city list:', error)
        return
      }
      if (!data) return

      // Group everything (except the 4 priority cities, shown separately
      // above) by country, cities alphabetical within each group, groups
      // alphabetical by their resolved display name.
      const byCountry = {}
      for (const row of data) {
        if (!row.city || PRIORITY_CITIES.includes(row.city)) continue
        const label = countryName(row.country)
        if (!byCountry[label]) byCountry[label] = new Set()
        byCountry[label].add(row.city)
      }
      // Make sure the South Africa group exists and includes the fallback
      // list too, in case live data is sparse for some SA cities.
      const saLabel = countryName('ZA')
      if (!byCountry[saLabel]) byCountry[saLabel] = new Set()
      for (const c of FALLBACK_SA_CITIES) byCountry[saLabel].add(c)

      const groups = Object.entries(byCountry)
        .map(([label, citySet]) => ({
          label,
          cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      setCityGroups(groups)
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
            {CERT_RESTRICTED ? (
              CERT_RESTRICTED_CITIES.map(c => <option key={c}>{c}</option>)
            ) : (
              <>
                <optgroup label="Popular">
                  {PRIORITY_CITIES.map(c => <option key={c}>{c}</option>)}
                </optgroup>
                {cityGroups.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.cities.map(c => <option key={c}>{c}</option>)}
                  </optgroup>
                ))}
              </>
            )}
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
