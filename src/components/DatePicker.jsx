import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function toDateStr(d) {
  // Build the string from LOCAL date parts directly -- NEVER use
  // .toISOString() here, since that converts to UTC first and rolls the
  // date back by one day for any timezone ahead of UTC (like SAST, UTC+2).
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function isValidDateStr(str) {
  if (!str) return false
  const d = new Date(str)
  return !isNaN(d.getTime())
}
function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const s = {
  wrap: { position: 'relative' },
  trigger: {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 13, color: '#111', width: '100%', textAlign: 'left',
    fontFamily: 'var(--font-body)', cursor: 'pointer', padding: 0,
  },
  // Rendered via portal into document.body -- position: fixed with
  // coordinates computed from the trigger's actual screen position, since
  // it's no longer nested inside the search bar's local layout at all.
  popover: (top, left) => ({
    position: 'fixed', top, left, zIndex: 9999,
    background: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    padding: 16, width: 280,
  }),
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthLabel: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#111' },
  navBtn: {
    width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)',
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 14, color: '#111',
  },
  dayLabels: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 },
  dayLabel: { textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted, #8a8580)', padding: '4px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  cell: { height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  day: (selected, disabled, today) => ({
    width: 30, height: 30, borderRadius: '50%', border: 'none',
    background: selected ? '#111' : 'transparent',
    color: disabled ? '#ccc' : selected ? '#fff' : today ? '#ef4056' : '#111',
    fontSize: 12, fontWeight: selected || today ? 700 : 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
}

export default function DatePicker({ value, onChange, min, label }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [viewDate, setViewDate] = useState(() => (isValidDateStr(value) ? parseLocal(value) : new Date()))
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      const clickedTrigger = triggerRef.current && triggerRef.current.contains(e.target)
      const clickedPopover = popoverRef.current && popoverRef.current.contains(e.target)
      if (!clickedTrigger && !clickedPopover) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (isValidDateStr(value)) setViewDate(parseLocal(value))
  }, [value])

  function openCalendar() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 10, left: rect.left })
    }
    setOpen(o => !o)
  }

  const minDate = isValidDateStr(min) ? parseLocal(min) : null
  const selectedDate = isValidDateStr(value) ? parseLocal(value) : null
  const today = new Date()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function goPrevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }
  function goNextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }
  function pickDay(day) {
    const picked = new Date(year, month, day)
    onChange(toDateStr(picked))
    setOpen(false)
  }

  const displayLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' })
    : 'Select date'

  return (
    <div style={s.wrap}>
      <button type="button" ref={triggerRef} style={s.trigger} onClick={openCalendar} aria-label={label}>
        {displayLabel}
      </button>

      {open && createPortal(
        <div ref={popoverRef} style={s.popover(coords.top, coords.left)}>
          <div style={s.header}>
            <button type="button" style={s.navBtn} onClick={goPrevMonth} aria-label="Previous month">‹</button>
            <span style={s.monthLabel}>{MONTH_NAMES[month]} {year}</span>
            <button type="button" style={s.navBtn} onClick={goNextMonth} aria-label="Next month">›</button>
          </div>

          <div style={s.dayLabels}>
            {DAY_LABELS.map((d, i) => <div key={i} style={s.dayLabel}>{d}</div>)}
          </div>

          <div style={s.grid}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} style={s.cell} />
              const cellDate = new Date(year, month, day)
              const disabled = minDate ? cellDate < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : false
              const selected = selectedDate ? sameDay(cellDate, selectedDate) : false
              const isToday = sameDay(cellDate, today)
              return (
                <div key={i} style={s.cell}>
                  <button
                    type="button"
                    style={s.day(selected, disabled, isToday)}
                    disabled={disabled}
                    onClick={() => pickDay(day)}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
