import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SearchBar from '../components/SearchBar'
import HotelCard from '../components/HotelCard'

const SAMPLE_HOTELS = [
  { id: '1', name: 'The Alphen Boutique Hotel', slug: 'the-alphen-boutique-hotel', city: 'Cape Town', province: 'Western Cape', price_night: 3200, rating: 4.8, images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'], category: 'boutique' },
  { id: '2', name: 'Singita Boulders Lodge', slug: 'singita-boulders-lodge', city: 'Sabi Sand', province: 'Mpumalanga', price_night: 28000, rating: 4.9, images: ['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600'], category: 'lodge' },
  { id: '3', name: 'Twelve Apostles Hotel', slug: 'twelve-apostles-hotel', city: 'Cape Town', province: 'Western Cape', price_night: 4800, rating: 4.7, images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600'], category: 'hotel' },
  { id: '4', name: 'Grootbos Nature Reserve', slug: 'grootbos-nature-reserve', city: 'Hermanus', province: 'Western Cape', price_night: 6500, rating: 4.9, images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'], category: 'lodge' },
  { id: '5', name: 'The Silo Hotel', slug: 'the-silo-hotel', city: 'Cape Town', province: 'Western Cape', price_night: 9200, rating: 4.8, images: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600'], category: 'boutique' },
  { id: '6', name: 'Ellerman House', slug: 'ellerman-house', city: 'Cape Town', province: 'Western Cape', price_night: 7800, rating: 5.0, images: ['https://images.unsplash.com/photo-1549294413-26f195200c16?w=600'], category: 'boutique' },
]

const CATEGORIES = ['All', 'hotel', 'lodge', 'guesthouse', 'boutique', 'resort']

const s = {
  page: { maxWidth: 1280, margin: '0 auto', padding: '40px 40px' },
  searchWrap: { display: 'flex', justifyContent: 'center', marginBottom: 48 },
  controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  results: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text)' },
  filters: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterBtn: (active) => ({
    padding: '8px 18px',
    borderRadius: 99,
    border: '1.5px solid',
    borderColor: active ? 'var(--text)' : 'var(--border)',
    background: active ? 'var(--text)' : 'none',
    color: active ? '#fff' : 'var(--text)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    textTransform: 'capitalize',
    transition: 'all 0.15s',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 24,
  },
  empty: {
    textAlign: 'center',
    padding: '80px 0',
    color: 'var(--text-muted)',
    fontSize: 16,
  },
  loading: {
    textAlign: 'center',
    padding: '80px 0',
    color: 'var(--text-muted)',
    fontSize: 15,
  },
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')

  const city = searchParams.get('city') || ''

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let query = supabase.from('hotels').select('*').order('rating', { ascending: false })
        if (city) query = query.ilike('city', `%${city}%`)
        const { data, error } = await query
        if (!error && data?.length) {
          setHotels(data)
        } else {
          setHotels(city
            ? SAMPLE_HOTELS.filter(h => h.city.toLowerCase().includes(city.toLowerCase()))
            : SAMPLE_HOTELS
          )
        }
      } catch (_) {
        setHotels(SAMPLE_HOTELS)
      }
      setLoading(false)
    }
    load()
  }, [city])

  const filtered = category === 'All' ? hotels : hotels.filter(h => h.category === category)

  return (
    <main>
      <div style={s.page}>
        <div style={s.searchWrap}>
          <SearchBar />
        </div>

        <div style={s.controls}>
          <div style={s.results}>
            {loading ? 'Loading…' : `${filtered.length} stays${city ? ` in ${city}` : ''}`}
          </div>
          <div style={s.filters}>
            {CATEGORIES.map(c => (
              <button key={c} style={s.filterBtn(category === c)} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading
          ? <div style={s.loading}>Finding the best stays…</div>
          : filtered.length === 0
            ? <div style={s.empty}>No stays found. Try a different location or filter.</div>
            : (
              <div style={s.grid}>
                {filtered.map((hotel, i) => (
                  <div key={hotel.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <HotelCard hotel={hotel} width="100%" />
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </main>
  )
}
