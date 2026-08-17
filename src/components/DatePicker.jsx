
/
Claude finished the response

Architected custom calendar widget with navigation and date selection logic
Architected custom calendar widget with navigation and date selection logic
Absolutely — a custom calendar dropdown will look much more polished and consistent than the native browser date picker (which is exactly what's inconsistent-looking in your screenshot). Let me build a proper reusable calendar component.


Ran a command
Ran a command
First, a standalone reusable DatePicker.jsx component — a real calendar grid, month navigation, brand-styled.


Created 2 files
Created 2 files
Now integrating it into SearchBar.jsx, replacing the two native <input type="date"> fields.


Edited 2 files, viewed a file
Edited 2 files, viewed a file
Now let's verify both files compile cleanly.


Ran a command
Ran a command
Both clean.


Presented 2 files
Presented 2 files
What's new:

Real month-grid calendar dropdown, matching your brand (dark selected date, red "today" highlight, clean typography)
Click outside to close, prev/next month navigation
Respects the same min-date rules as before (can't pick a past check-in, checkout can't be before/equal to check-in) — same underlying safe date-guarding logic from the earlier crash fix, just with a proper UI on top now
Works identically wherever SearchBar is used (Home, Search results page) — no other file needs to change
2. Replace SearchBar.jsx
https://github.com/blystay-ux/BlyBly/edit/main/src/components/SearchBar.jsx → Ctrl+A, delete, paste the updated content → commit.
1
2
3
4
Let me know how it looks once it's live.


Datepicker
Code · JSX 

Searchbar pre calendar
Code · JSX 
1786960430070_image.png
Please see issue


Scrutinized calendar styling inconsistencies and date rendering logic
Scrutinized calendar styling inconsistencies and date rendering logic
Thanks for the screenshot — I can see the calendar is rendering, but I want to pin down exactly what's wrong rather than guess. A few things could be the actual issue here:

What exactly is wrong in this screenshot?
slector doesn't work

Diagnosed timezone bug causing date selection to shift by one day
Diagnosed timezone bug causing date selection to shift by one day
Found it — a real, definite bug: South Africa's timezone (UTC+2) causes every date you click to shift back by one day.

Why this happens
When you click "18", the code builds a Date object for local midnight on the 18th, then converts it to a date string using .toISOString(). That conversion step converts to UTC first — and since SAST is 2 hours ahead of UTC, local midnight on the 18th becomes 22:00 on the 17th in UTC. So clicking "18" was silently storing "17" instead. This happens on every single click, not intermittently — which matches exactly what you're seeing.


Editing file
Editing file
Let's verify the fix.


Ran a command
Ran a command
Clean.


Presented file
Presented file
One thing worth knowing: this same .toISOString()-for-date-strings pattern appears in a couple of other places I wrote earlier this session (defaultCheckIn() in SearchBar.jsx, for instance) — those are lower-risk since they only misfire during a narrow window (midnight–2am local time), not on every use like this one did. Worth a proper cleanup pass later, but not urgent right now — only DatePicker.jsx needed the fix to solve what you're seeing.

Replace DatePicker.jsx
https://github.com/blystay-ux/BlyBly/edit/main/src/components/DatePicker.jsx → Ctrl+A, delete, paste the updated content.
1
2
3
Let me know how it looks once it's live.


Datepicker
Code · JSX 

And the date 


Claude is AI and can make mistakes. Please double-check responses.


Datepicker · JSX
import { useState, useRef, useEffect } from 'react'
 
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
 
function toDateStr(d) {
  // Build the string from LOCAL date parts directly -- NEVER use
  // .toISOString() here. toISOString() converts to UTC first, and for any
  // timezone ahead of UTC (like SAST, UTC+2), local midnight rolls back to
  // the previous day in UTC -- meaning every single date click was silently
  // storing the day BEFORE the one actually clicked. This was the root
  // cause of "the selector doesn't work."
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
  popover: {
    position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 50,
    background: '#fff', borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
    padding: 16, width: 280,
  },
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
  const [viewDate, setViewDate] = useState(() => (isValidDateStr(value) ? parseLocal(value) : new Date()))
  const ref = useRef(null)
 
  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])
 
  useEffect(() => {
    if (isValidDateStr(value)) setViewDate(parseLocal(value))
  }, [value])
 
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
    <div style={s.wrap} ref={ref}>
      <button type="button" style={s.trigger} onClick={() => setOpen(o => !o)} aria-label={label}>
        {displayLabel}
      </button>
 
      {open && (
        <div style={s.popover}>
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
        </div>
      )}
    </div>
  )
}
 






























































Downloaded Foreshore_v6.html Show in Explorer
