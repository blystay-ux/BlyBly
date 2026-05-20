import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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

const heroSlides = [
  { title: 'Cape Town',     image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1800&q=85' },
  { title: 'Johannesburg',  image: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1800&q=85' },
  { title: 'Durban',        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85' },
  { title: 'Drakensberg',   image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1800&q=85' },
  { title: 'Port Elizabeth', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85' },
  { title: 'Marloth Park',  image: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?auto=format&fit=crop&w=1800&q=85' },
]

const destinations = [
  { name: 'KaapStad',      city: 'Cape Town',    slogan: 'Mooi genoeg om jou ex jealous te maak',     image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=900&q=85' },
  { name: 'Johannesburg',  city: 'Johannesburg',  slogan: 'More than gold. More than business.',        image: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=900&q=85' },
  { name: 'Pretoria',      city: 'Pretoria',      slogan: 'Come for the Jacarandas, stay for the braai!', image: 'https://images.unsplash.com/photo-1523430410476-0185cb1f6ff9?auto=format&fit=crop&w=900&q=85' },
  { name: 'Durban',        city: 'Durban',        slogan: 'Beach, bunny chow en repeat!',              image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85' },
  { name: 'Drakensberg',   city: 'Drakensberg',   slogan: 'Leave the city for the Berg.',              image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=900&q=85' },
  { name: 'Port Elizabeth', city: 'Gqeberha',     slogan: 'Sea breeze and easy living.',               image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85' },
]

function DestinationCard({ destination, onClick }) {
  return (
    <article
      onClick={onClick}
      className="group relative h-[310px] overflow-hidden rounded-3xl bg-black shadow-xl cursor-pointer"
    >
      <img
        src={destination.image} alt={destination.name}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="text-2xl font-black tracking-[-0.04em]">{destination.name}</h3>
        <p className="mt-1 text-sm leading-snug text-white/90">{destination.slogan}</p>
      </div>
    </article>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const today     = new Date().toISOString().split('T')[0]
  const threeDays = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]

  const [activeSlide, setActiveSlide] = useState(0)
  const [cities,      setCities]      = useState(MAJOR_CITIES)
  const [city,        setCity]        = useState('Cape Town')
  const [checkIn,     setCheckIn]     = useState(today)
  const [checkOut,    setCheckOut]    = useState(threeDays)
  const [guests,      setGuests]      = useState(2)

  const slide = useMemo(() => heroSlides[activeSlide], [activeSlide])

  useEffect(() => {
    const timer = setInterval(() => setActiveSlide(c => (c + 1) % heroSlides.length), 4500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    async function fetchListedCities() {
      const { data } = await supabase.from('hotels').select('city').not('city', 'is', null)
      if (data) {
        const listed = data.map(h => h.city).filter(Boolean)
        const merged = Array.from(new Set([...MAJOR_CITIES, ...listed])).sort()
        setCities(merged)
      }
    }
    fetchListedCities()
  }, [])

  const goSearch = () => {
    const params = new URLSearchParams({ city, checkIn, checkOut, guests })
    navigate(`/search?${params}`)
  }

  const handleDestination = (dest) => {
    if (!user) { navigate('/auth'); return }
    const params = new URLSearchParams({ city: dest.city, checkIn, checkOut, guests })
    navigate(`/search?${params}`)
  }

  return (
    <main className="min-h-screen bg-[#F8F7F5] text-black">

      {/* ── Hero ── */}
      <section className="relative min-h-[760px] border-b border-black/10">

        <div className="absolute inset-0 overflow-hidden">
          <img key={slide.image} src={slide.image} alt={slide.title}
            className="h-full w-full object-cover transition-opacity duration-700" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F8F7F5]/95 via-[#F8F7F5]/55 to-transparent" />

       {/* Headline */}
<div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl items-center px-8 pt-10 md:px-14">
  <div className="max-w-2xl">
    
    <h1 className="text-6xl font-black leading-[0.92] tracking-[-0.07em] md:text-8xl">
      Bly waar<br />
      dit saak maak
      <span className="text-[#ef4056]">.</span>
    </h1>

    {/* Small tagline */}
    <p className="mt-4 ml-1 text-sm md:text-base font-medium tracking-wide text-black/70">
      Bly<span className="text-[#ef4056]">.</span> where it matters
    </p>

  </div>

        {/* Next slide arrow */}
        <button
          onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)}
          className="absolute right-7 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-3xl text-black shadow-xl"
        >→</button>

        {/* Dots */}
        <div className="absolute bottom-28 left-1/2 z-20 flex -translate-x-1/2 gap-4">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setActiveSlide(i)}
              className={`h-3 w-3 rounded-full ${i === activeSlide ? 'bg-[#ef4056]' : 'bg-white/80'}`} />
          ))}
        </div>

        {/* ── Search bar ── */}
        <div className="absolute -bottom-10 left-1/2 z-30 w-[90%] max-w-5xl -translate-x-1/2">
          <div className="flex items-center rounded-full bg-white shadow-2xl overflow-hidden">

            {/* City */}
            <div className="flex flex-1 items-center gap-3 border-r border-black/10 px-6 py-4">
              <span className="text-base flex-shrink-0">📍</span>
              <select
                className="w-full bg-transparent text-sm font-medium text-black outline-none appearance-none cursor-pointer"
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Check-in */}
            <div className="flex flex-1 items-center gap-3 border-r border-black/10 px-6 py-4">
              <span className="text-base flex-shrink-0">📅</span>
              <input type="date"
                className="w-full bg-transparent text-sm font-medium text-black outline-none cursor-pointer"
                value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} />
            </div>

            {/* Check-out */}
            <div className="flex flex-1 items-center gap-3 border-r border-black/10 px-6 py-4">
              <span className="text-base flex-shrink-0">📅</span>
              <input type="date"
                className="w-full bg-transparent text-sm font-medium text-black outline-none cursor-pointer"
                value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)} />
            </div>

            {/* Guests */}
            <div className="flex items-center gap-2 border-r border-black/10 px-6 py-4">
              <span className="text-base flex-shrink-0">👥</span>
              <input type="number"
                className="w-10 bg-transparent text-sm font-medium text-black outline-none"
                value={guests} min={1} max={20} onChange={e => setGuests(e.target.value)} />
              <span className="text-xs text-black/40 whitespace-nowrap">
                {guests == 1 ? 'guest' : 'guests'}
              </span>
            </div>

            {/* Search button */}
            <button
              onClick={goSearch}
              className="flex items-center gap-2 bg-black text-white font-bold text-sm px-8 py-5 hover:bg-[#ef4056] transition-colors duration-200 whitespace-nowrap"
            >
              🔍 Search
            </button>

          </div>
        </div>
      </section>

      {/* ── Destinations ── */}
      <section id="stays" className="mx-auto max-w-7xl px-8 pb-14 pt-24 md:px-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ef4056]">Destinations</p>
        <h2 className="mt-3 text-4xl font-black tracking-[-0.06em] md:text-5xl">
          Where will you ... Bly<span className="text-[#ef4056]">?</span>
        </h2>
        {!user && (
          <p className="mt-3 text-sm text-black/50">
            <button onClick={() => navigate('/auth')}
              className="underline font-semibold text-black/70 hover:text-[#ef4056] transition">
              Sign in
            </button>{' '}to start booking.
          </p>
        )}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map(dest => (
            <DestinationCard key={dest.name} destination={dest} onClick={() => handleDestination(dest)} />
          ))}
        </div>
      </section>

      {/* ── List your property ── */}
      <section className="mx-auto max-w-7xl px-8 py-8 md:px-14">
        <div className="rounded-[2rem] bg-white/75 p-10 text-center shadow-sm md:p-14">
          <div className="mb-5 text-6xl">🏨</div>
          <h2 className="text-4xl font-black tracking-[-0.06em] md:text-5xl">Own a stay? Get seen.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-black/60">
            List your property on BLY. and reach a new generation of South African travellers.
          </p>
          <a href="/list-hotel"
            className="mt-7 inline-block rounded-full bg-[#ef4056] px-10 py-4 text-lg font-black text-white shadow-lg">
            List your property
          </a>

          {/* Partner & Admin access */}
          <div className="mt-6 border-t border-black/10 pt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-black/50">Already listed with us?</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="/auth?mode=extranet"
                className="inline-flex items-center gap-2 rounded-full border border-black/20 px-7 py-3 text-sm font-bold text-black hover:border-black transition">
                🔑 Access Extranet
              </a>
              <a href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 px-7 py-3 text-sm font-semibold text-black/40 hover:border-black/30 hover:text-black/60 transition">
                ⚙️ Admin Login
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="mx-auto grid max-w-7xl gap-6 px-8 pb-16 pt-8 md:grid-cols-3 md:px-14">
        <div className="flex items-center gap-5 rounded-3xl bg-white/60 p-7">
          <div className="text-4xl">🏷️</div>
          <div><h3 className="text-xl font-black">Better rates</h3><p className="text-black/60">Book direct. Save more.</p></div>
        </div>
        <div className="flex items-center gap-5 rounded-3xl bg-white/60 p-7">
          <div className="text-4xl">❤️</div>
          <div><h3 className="text-xl font-black">Local stays</h3><p className="text-black/60">Support local. Stay local.</p></div>
        </div>
        <div className="flex items-center gap-5 rounded-3xl bg-white/60 p-7">
          <div className="text-4xl">🛡️</div>
          <div><h3 className="text-xl font-black">Secure & simple</h3><p className="text-black/60">Safe booking. Zero hassle.</p></div>
        </div>
      </section>

    </main>
  )
}
