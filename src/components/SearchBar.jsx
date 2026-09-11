import { useState, useEffect, useRef } from 'react'
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

// Fetches EVERY row from hg_cities, paginating past Supabase's default
// 1000-row cap on unfiltered queries. This is the actual root cause of an
// earlier bug where most cities silently never appeared in the dropdown --
// the fix isn't to restrict scope (a workaround), it's to paginate properly.
async function fetchAllCities() {
  const PAGE_SIZE = 1000
  let allRows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('hg_cities')
      .select('city, country')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    allRows = allRows.concat(data)
    if (data.length < PAGE_SIZE) break // last page
    from += PAGE_SIZE
  }
  return allRows
}

// Base styles are desktop-first (single row, pill-shaped). The <style>
// block below overrides these via classes on narrow screens -- inline
// styles alone can't express @media queries, and trying to force the
// single-row pill layout to wrap on mobile was exactly what produced the
// distorted blob shape this rebuild fixes.
const s = {
  wrapper: {
    background: '#fff', borderRadius: 99,
    padding: '6px 6px 6px 0', display: 'flex', alignItems: 'center',
    boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
    width: '100%', maxWidth: 720,
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
    justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 6,
  },
  error: { width: '100%', color: '#ef4056', fontSize: 12, fontWeight: 600, padding: '4px 20px 0' },
  notice: { width: '100%', color: '#8a8580', fontSize: 11, padding: '4px 20px 0' },
}

export default function SearchBar({ initialCity, initialCheckIn, initialCheckOut, initialAdults, initialRooms }) {
  const navigate = useNavigate()

  const [cityGroups, setCityGroups] = useState(CERT_RESTRICTED ? [] : buildFallbackGroups())
  const [city, setCity] = useState(initialCity || (CERT_RESTRICTED ? CERT_RESTRICTED_CITIES[0] : PRIORITY_CITIES[0]))
  const [cityQuery, setCityQuery] = useState('')
  const [cityOpen, setCityOpen] = useState(false)
  const cityRef = useRef(null)
  const [checkIn, setCheckIn] = useState(isValidDateStr(initialCheckIn) ? initialCheckIn : defaultCheckIn())
  const [checkOut, setCheckOut] = useState(
    isValidDateStr(initialCheckOut) ? initialCheckOut : addNights(isValidDateStr(initialCheckIn) ? initialCheckIn : defaultCheckIn(), 1)
  )
  // Default is 1 adult, not 2.
  const [adults, setAdults] = useState(initialAdults || 2)
  const [error, setError] = useState('')

  useEffect(() => {
    if (CERT_RESTRICTED) return
    async function fetchListedCities() {
      // Fetches HyperGuest's ENTIRE global city list, properly paginated
      // (see fetchAllCities -- this is the real fix for the earlier bug
      // where only ~1000 arbitrary cities loaded and most of them, SA
      // included, never appeared). Grouped by country: South Africa is
      // pinned to appear right after "Popular", every other country
      // follows alphabetically by its resolved display name.
      let data
      try {
        data = await fetchAllCities()
      } catch (error) {
        console.error('Failed to load HyperGuest city list:', error)
        return
      }
      if (!data.length) return

      const byCountry = {}
      for (const row of data) {
        if (!row.city || PRIORITY_CITIES.includes(row.city)) continue
        const label = countryName(row.country)
        if (!byCountry[label]) byCountry[label] = new Set()
        byCountry[label].add(row.city)
      }
      // Make sure South Africa's fallback list is included too, in case
      // live data is ever sparse for some SA cities.
      const saLabel = countryName('ZA')
      if (!byCountry[saLabel]) byCountry[saLabel] = new Set()
      for (const c of FALLBACK_SA_CITIES) byCountry[saLabel].add(c)

      const otherGroups = Object.entries(byCountry)
        .filter(([label]) => label !== saLabel)
        .map(([label, citySet]) => ({
          label,
          cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      // South Africa first (pinned, right after "Popular" above), then
      // every other country alphabetically.
      const groups = [
        { label: saLabel, cities: Array.from(byCountry[saLabel]).sort((a, b) => a.localeCompare(b)) },
        ...otherGroups,
      ]

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

  // Close city dropdown on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setCityOpen(false)
        setCityQuery('')
      }
    }
    if (cityOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [cityOpen])

  // Filtered groups for the combobox
  const q = cityQuery.trim().toLowerCase()
  const filteredGroups = q
    ? (() => {
        const result = []
        // Check popular first
        const popMatches = PRIORITY_CITIES.filter(c => c.toLowerCase().includes(q))
        if (popMatches.length) result.push({ label: 'Popular', cities: popMatches })
        // Then country groups
        for (const g of cityGroups) {
          const cityMatches = g.cities.filter(c => c.toLowerCase().includes(q))
          const countryMatches = g.label.toLowerCase().includes(q)
          if (cityMatches.length || countryMatches) {
            result.push({ label: g.label, cities: countryMatches && !cityMatches.length ? g.cities : cityMatches })
          }
        }
        return result
      })()
    : [{ label: 'Popular', cities: PRIORITY_CITIES }, ...cityGroups]

  function selectCity(c) {
    setCity(c)
    setCityQuery('')
    setCityOpen(false)
  }

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
      <style>{`
        @media (max-width: 640px) {
          .bly-searchbar-wrapper {
            flex-direction: column !important;
            align-items: stretch !important;
            border-radius: 20px !important;
            padding: 8px !important;
          }
          .bly-searchbar-field, .bly-searchbar-field-last {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #E2DFDB !important;
            padding: 12px 14px !important;
          }
          .bly-searchbar-field-last {
            border-bottom: none !important;
          }
          .bly-searchbar-btn {
            width: 100% !important;
            margin: 8px 0 0 0 !important;
            padding: 14px 22px !important;
          }
        }
      `}</style>
      <div className="bly-searchbar-wrapper" style={s.wrapper}>
        <div className="bly-searchbar-field" style={{ ...s.field, position: 'relative' }} ref={cityRef}>
          <span style={s.icon}>📍</span>
          {CERT_RESTRICTED ? (
            <span style={{ fontSize: 13, color: '#111' }}>{city}</span>
          ) : (
            <input
              style={{ ...s.input, cursor: 'pointer', minWidth: 100 }}
              value={cityOpen ? cityQuery : city}
              placeholder={city}
              onFocus={() => { setCityOpen(true); setCityQuery('') }}
              onChange={e => { setCityQuery(e.target.value); setCityOpen(true) }}
              onKeyDown={e => {
                if (e.key === 'Escape') { setCityOpen(false); setCityQuery('') }
                if (e.key === 'Enter') {
                  const flat = filteredGroups.flatMap(g => g.cities)
                  if (flat.length) selectCity(flat[0])
                }
              }}
              autoComplete="off"
            />
          )}
          {cityOpen && !CERT_RESTRICTED && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: -16, minWidth: 260, maxWidth: 320,
              background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
              zIndex: 200, maxHeight: 340, overflowY: 'auto', padding: '8px 0',
            }}>
              {filteredGroups.length === 0 && (
                <div style={{ padding: '12px 16px', fontSize: 13, color: '#aaa' }}>No destinations found</div>
              )}
              {filteredGroups.map(group => (
                <div key={group.label}>
                  <div style={{ padding: '6px 16px 2px', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#999' }}>
                    {group.label}
                  </div>
                  {group.cities.map(c => (
                    <div
                      key={c}
                      onMouseDown={() => selectCity(c)}
                      style={{
                        padding: '9px 16px', fontSize: 14, cursor: 'pointer',
                        background: c === city ? '#f4f2ef' : 'transparent',
                        fontWeight: c === city ? 600 : 400,
                        color: '#111',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f7f5'}
                      onMouseLeave={e => e.currentTarget.style.background = c === city ? '#f4f2ef' : 'transparent'}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bly-searchbar-field" style={s.field}>
          <span style={s.icon}>📅</span>
          <DatePicker
            value={checkIn}
            onChange={setCheckIn}
            min={new Date().toISOString().split('T')[0]}
            label="Check-in date"
          />
        </div>
        <div className="bly-searchbar-field" style={s.field}>
          <span style={s.icon}>📅</span>
          <DatePicker
            value={checkOut}
            onChange={setCheckOut}
            min={checkoutMin}
            label="Check-out date"
          />
        </div>
        <div className="bly-searchbar-field-last" style={s.fieldLast}>
          <span style={s.icon}>🧑‍🤝‍🧑</span>
          <select style={s.select} value={adults} onChange={e => setAdults(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'adult' : 'adults'}</option>
            ))}
          </select>
        </div>

        <button className="bly-searchbar-btn" style={s.searchBtn} onClick={go}>🔍 Search</button>
      </div>
      {error && <div style={s.error}>{error}</div>}
      {CERT_RESTRICTED && !error && (
        <div style={s.notice}>Search is temporarily limited to Haifa while our HyperGuest integration completes certification.</div>
      )}
    </div>
  )
}
