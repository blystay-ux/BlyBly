import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="text-3xl">{icon}</div>
      <p className="mt-3 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-black/50">{label}</p>
    </div>
  )
}

function HotelCard({ hotel, onManage }) {
  const statusColor = hotel.is_active
    ? { dot: 'bg-green-400', text: 'Live' }
    : { dot: 'bg-yellow-400', text: 'Pending review' }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      {/* Image */}
      <div className="relative h-48 w-full">
        <img
          src={
            hotel.image_url ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
          }
          alt={hotel.name}
          className="h-full w-full object-cover"
        />
        {/* Status pill */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow">
          <span className={`h-2 w-2 rounded-full ${statusColor.dot}`} />
          <span className="text-xs font-bold">{statusColor.text}</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-5">
        <h3 className="text-lg font-black tracking-tight">{hotel.name}</h3>
        <p className="mt-0.5 text-sm text-black/50">{hotel.location || hotel.city}</p>

        <div className="mt-4 flex gap-4 text-sm">
          {hotel.price_per_night && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/30">Rate</p>
              <p className="mt-1 font-semibold">
                R {Number(hotel.price_per_night).toLocaleString('en-ZA')} / night
              </p>
            </div>
          )}
          {hotel.rooms != null && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/30">Rooms</p>
              <p className="mt-1 font-semibold">{hotel.rooms}</p>
            </div>
          )}
          {hotel.booking_count != null && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-black/30">Bookings</p>
              <p className="mt-1 font-semibold">{hotel.booking_count}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => onManage(hotel)}
          className="mt-5 w-full rounded-full border border-black/20 py-2.5 text-sm font-bold hover:border-black hover:bg-black hover:text-white transition"
        >
          Manage property
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  return (
    <div className="col-span-full flex flex-col items-center rounded-2xl bg-white/60 py-20 text-center">
      <div className="text-5xl">🏨</div>
      <p className="mt-4 text-lg font-black">No properties listed yet</p>
      <p className="mt-2 text-sm text-black/50">
        List your first property and start reaching guests across South Africa.
      </p>
      <button
        onClick={() => navigate('/list-hotel')}
        className="mt-6 rounded-full bg-[#ef4056] px-8 py-3 text-sm font-black text-white shadow"
      >
        List a property
      </button>
    </div>
  )
}

export default function Extranet() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [hotels,  setHotels]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/auth?mode=extranet'); return }

    async function fetchHotels() {
      setLoading(true)
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) setHotels(data)
      setLoading(false)
    }

    fetchHotels()
  }, [user])

  const handleManage = (hotel) => {
    navigate(`/manage-hotel?id=${hotel.id}`)
  }

  const totalBookings = hotels.reduce((sum, h) => sum + (h.booking_count || 0), 0)
  const liveCount     = hotels.filter(h => h.is_active).length

  return (
    <main className="min-h-screen bg-[#F8F7F5] px-6 py-12 md:px-14">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ef4056]">
              Hotel Extranet
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] md:text-5xl">
              Your properties<span className="text-[#ef4056]">.</span>
            </h1>
            <p className="mt-2 text-sm text-black/50">
              {user?.email}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/list-hotel')}
              className="rounded-full bg-[#ef4056] px-6 py-2.5 text-sm font-black text-white shadow hover:opacity-90 transition"
            >
              + Add property
            </button>
            <button
              onClick={() => { signOut(); navigate('/') }}
              className="rounded-full border border-black/20 px-6 py-2.5 text-sm font-bold hover:border-black transition"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        {!loading && hotels.length > 0 && (
          <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon="🏨" label="Properties listed"  value={hotels.length} />
            <StatCard icon="✅" label="Live properties"    value={liveCount} />
            <StatCard icon="📅" label="Total bookings"     value={totalBookings} />
            <StatCard icon="📍" label="Cities covered"
              value={new Set(hotels.map(h => h.city || h.location).filter(Boolean)).size || '—'}
            />
          </div>
        )}

        {/* Hotels grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/80" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.length === 0
              ? <EmptyState />
              : hotels.map(h => (
                  <HotelCard key={h.id} hotel={h} onManage={handleManage} />
                ))
            }
          </div>
        )}

      </div>
    </main>
  )
}
