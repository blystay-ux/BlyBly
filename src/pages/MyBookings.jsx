import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const STATUS_STYLES = {
  confirmed: { bg: '#dcfce7', color: '#16a34a', label: 'Confirmed' },
  pending:   { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
  cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
  completed: { bg: '#f1f5f9', color: '#475569', label: 'Completed' },
  Confirmed: { bg: '#dcfce7', color: '#16a34a', label: 'Confirmed' },
  Pending:   { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
  Cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
  Failed:    { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
}

function Badge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span
      style={{ background: s.bg, color: s.color }}
      className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
    >
      {s.label}
    </span>
  )
}

// ── Legacy bookings card (bookings table) ──────────────────────
function BookingCard({ booking }) {
  const navigate = useNavigate()
  const hotel = booking.hotels || {}
  const checkIn  = new Date(booking.check_in)
  const checkOut = new Date(booking.check_out)
  const nights   = Math.round((checkOut - checkIn) / 86400000)

  const fmt = (d) =>
    d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md sm:flex-row">
      <div className="relative h-44 w-full flex-shrink-0 sm:h-auto sm:w-48">
        <img
          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
          alt={hotel.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-tight">{hotel.name || 'Stay'}</h3>
            <p className="mt-0.5 text-sm text-black/50">{hotel.location || hotel.city}</p>
          </div>
          <Badge status={booking.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">Check-in</p>
            <p className="mt-1 font-semibold">{fmt(checkIn)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">Check-out</p>
            <p className="mt-1 font-semibold">{fmt(checkOut)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">Nights</p>
            <p className="mt-1 font-semibold">{nights}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">Guests</p>
            <p className="mt-1 font-semibold">{booking.guests}</p>
          </div>
          {booking.total_price && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/30">Total</p>
              <p className="mt-1 font-semibold">
                R {Number(booking.total_price).toLocaleString('en-ZA')}
              </p>
            </div>
          )}
        </div>
        {hotel.slug && booking.status !== 'cancelled' && (
          <button
            onClick={() => navigate(`/hotel/${hotel.slug}`)}
            className="mt-5 self-start rounded-full border border-black/20 px-5 py-2 text-sm font-bold hover:border-black transition"
          >
            View property →
          </button>
        )}
      </div>
    </div>
  )
}

// ── HyperGuest booking card ────────────────────────────────────
function HgBookingCard({ booking, reviewed, isUpcoming }) {
  const navigate = useNavigate()
  const checkIn  = new Date(booking.check_in)
  const checkOut = new Date(booking.check_out)
  const nights   = Math.max(1, Math.round((checkOut - checkIn) / 86400000))
  const guest    = booking.lead_guest || {}
  const sell     = booking.prices?.sell

  const fmt = (d) =>
    d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

  const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md sm:flex-row">
      {/* Thumbnail */}
      <div className="relative h-44 w-full flex-shrink-0 sm:h-auto sm:w-48">
        <img
          src={booking._imageUrl || PLACEHOLDER}
          alt={booking._propertyName || 'Hotel'}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-tight">
              {booking._propertyName || `Property ${booking.hyperguest_property_id}`}
            </h3>
            {booking.agency_reference && (
              <p className="mt-0.5 text-xs text-black/40">Ref: {booking.agency_reference}</p>
            )}
          </div>
          <Badge status={booking.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">Check-in</p>
            <p className="mt-1 font-semibold">{fmt(checkIn)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">Check-out</p>
            <p className="mt-1 font-semibold">{fmt(checkOut)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/30">Nights</p>
            <p className="mt-1 font-semibold">{nights}</p>
          </div>
          {guest.firstName && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/30">Guest</p>
              <p className="mt-1 font-semibold">{[guest.firstName, guest.lastName].filter(Boolean).join(' ')}</p>
            </div>
          )}
          {sell && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/30">Total</p>
              <p className="mt-1 font-semibold">{sell.currency} {Number(sell.price).toLocaleString('en-ZA')}</p>
            </div>
          )}
        </div>

        {/* Review button — only for past, non-cancelled stays */}
        {!isUpcoming && booking.status !== 'Cancelled' && booking.status !== 'cancelled' && (
          <div className="mt-5">
            {reviewed ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-5 py-2 text-sm font-bold text-green-700 border border-green-200">
                ✓ Review submitted
              </span>
            ) : (
              <button
                onClick={() => navigate(`/review/hg/${booking.id}`)}
                className="rounded-full bg-[#ef4056] px-5 py-2 text-sm font-bold text-white hover:bg-[#d63347] transition"
              >
                Leave a review →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ type }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/60 py-20 text-center">
      <div className="text-5xl">{type === 'upcoming' ? '🗓️' : '📋'}</div>
      <p className="mt-4 text-lg font-black">
        {type === 'upcoming' ? 'No upcoming stays' : 'No past stays yet'}
      </p>
      <p className="mt-2 text-sm text-black/50">
        {type === 'upcoming'
          ? 'When you book a stay it will appear here.'
          : 'Your completed stays will show up here.'}
      </p>
      {type === 'upcoming' && (
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-full bg-[#ef4056] px-8 py-3 text-sm font-black text-white shadow"
        >
          Explore stays
        </button>
      )}
    </div>
  )
}

export default function MyBookings() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  // Legacy bookings
  const [bookings, setBookings] = useState([])
  // HyperGuest bookings
  const [hgBookings, setHgBookings] = useState([])
  // Set of hg_booking_ids the user has already reviewed
  const [reviewedIds, setReviewedIds] = useState(new Set())

  const [loading,  setLoading]  = useState(true)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchAll() {
    setLoading(true)

    // Run all fetches in parallel
    const [legacyRes, hgRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, hotels(*)')
        .eq('user_id', user.id)
        .order('check_in', { ascending: false }),
      supabase
        .from('hg_bookings')
        .select('id, check_in, check_out, status, lead_guest, prices, hyperguest_property_id, hotel_id, agency_reference, guest_email')
        .ilike('guest_email', user.email)
        .order('check_in', { ascending: false }),
    ])

    if (!legacyRes.error && legacyRes.data) setBookings(legacyRes.data)

    let enrichedHg = hgRes.data || []

    // Enrich with property names + images
    if (enrichedHg.length) {
      const propIds = [...new Set(enrichedHg.map(b => b.hyperguest_property_id).filter(Boolean))]
      if (propIds.length) {
        const [indexRes, staticRes] = await Promise.all([
          supabase.from('hg_property_index').select('hotel_id, name').in('hotel_id', propIds),
          supabase.from('hg_property_static').select('hotel_id, images').in('hotel_id', propIds),
        ])
        const nameMap = {}
        ;(indexRes.data || []).forEach(p => { nameMap[p.hotel_id] = p.name })
        const imgMap = {}
        ;(staticRes.data || []).forEach(p => {
          const photo = (p.images || []).find(i => i.type === 'photo')
          if (photo?.uri) imgMap[p.hotel_id] = photo.uri
        })
        enrichedHg = enrichedHg.map(b => ({
          ...b,
          _propertyName: nameMap[b.hyperguest_property_id] || null,
          _imageUrl: imgMap[b.hyperguest_property_id] || null,
        }))
      }

      // Fetch which bookings this user has already reviewed
      const hgIds = enrichedHg.map(b => b.id)
      const { data: revData } = await supabase
        .from('reviews')
        .select('hg_booking_id')
        .eq('user_id', user.id)
        .in('hg_booking_id', hgIds)
      const reviewed = new Set((revData || []).map(r => r.hg_booking_id))
      setReviewedIds(reviewed)
    }

    setHgBookings(enrichedHg)
    setLoading(false)
  }

  const now = new Date()

  // Combine and split legacy bookings
  const legacyUpcoming = bookings.filter(b => new Date(b.check_out) >= now && b.status !== 'cancelled')
  const legacyPast     = bookings.filter(b => new Date(b.check_out) <  now || b.status === 'cancelled')

  // Split HG bookings
  const hgUpcoming = hgBookings.filter(b => new Date(b.check_out) >= now && b.status !== 'Cancelled')
  const hgPast     = hgBookings.filter(b => new Date(b.check_out) <  now || b.status === 'Cancelled')

  const upcomingCount = legacyUpcoming.length + hgUpcoming.length
  const hasUpcoming   = upcomingCount > 0
  const hasPast       = legacyPast.length > 0 || hgPast.length > 0

  const shownLegacy = tab === 'upcoming' ? legacyUpcoming : legacyPast
  const shownHg     = tab === 'upcoming' ? hgUpcoming    : hgPast
  const totalShown  = shownLegacy.length + shownHg.length

  return (
    <main className="min-h-screen bg-[#F8F7F5] px-6 py-12 md:px-14">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ef4056]">My account</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] md:text-5xl">
            Your stays<span className="text-[#ef4056]">.</span>
          </h1>
          <p className="mt-2 text-black/50">
            Signed in as <span className="font-semibold text-black/70">{user?.email}</span>
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2">
          {['upcoming', 'past'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-6 py-2.5 text-sm font-bold transition capitalize ${
                tab === t
                  ? 'bg-black text-white'
                  : 'bg-white text-black/60 hover:text-black'
              }`}
            >
              {t}
              {t === 'upcoming' && hasUpcoming && (
                <span className="ml-2 rounded-full bg-[#ef4056] px-2 py-0.5 text-xs text-white">
                  {upcomingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/80" />
            ))}
          </div>
        ) : totalShown === 0 ? (
          <EmptyState type={tab} />
        ) : (
          <div className="flex flex-col gap-5">
            {/* HG bookings first (real bookings) */}
            {shownHg.map(b => (
              <HgBookingCard
                key={b.id}
                booking={b}
                reviewed={reviewedIds.has(b.id)}
                isUpcoming={tab === 'upcoming'}
              />
            ))}
            {/* Legacy bookings */}
            {shownLegacy.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}

      </div>
    </main>
  )
}
