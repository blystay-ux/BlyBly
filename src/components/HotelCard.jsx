import { useNavigate } from 'react-router-dom'

const s = {
  card: {
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    background: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    flexShrink: 0,
  },
  img: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    display: 'block',
  },
  imgPlaceholder: {
    width: '100%',
    height: 200,
    background: 'linear-gradient(135deg, #e2dfdb 0%, #c8c4be 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
  },
  body: {
    padding: '14px 16px 18px',
  },
  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--text)',
    lineHeight: 1.3,
    flex: 1,
    paddingRight: 8,
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--text)',
    flexShrink: 0,
  },
  star: { color: 'var(--accent)' },
  location: {
    fontSize: 13,
    color: 'var(--text-muted)',
    marginBottom: 12,
  },
  price: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
  },
  amount: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 20,
    color: 'var(--text)',
  },
  per: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  badge: {
    display: 'inline-block',
    background: 'var(--accent-light)',
    color: 'var(--accent)',
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 99,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
}

export default function HotelCard({ hotel, width = 260 }) {
  const navigate = useNavigate()
  const img = hotel.images?.[0]

  return (
    <div
      style={{ ...s.card, width }}
      onClick={() => navigate(`/hotel/${hotel.slug}`)}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {img
        ? <img src={img} alt={hotel.name} style={s.img} loading="lazy" />
        : <div style={s.imgPlaceholder}>🏨</div>
      }
      <div style={s.body}>
        {hotel.category && <span style={s.badge}>{hotel.category}</span>}
        <div style={s.top}>
          <div style={s.name}>{hotel.name}</div>
          <div style={s.rating}>
            <span style={s.star}>★</span>
            {hotel.rating?.toFixed(1)}
          </div>
        </div>
        <div style={s.location}>{hotel.city}, {hotel.province}</div>
        <div style={s.price}>
          <span style={s.amount}>R{Number(hotel.price_night).toLocaleString()}</span>
          <span style={s.per}>/ night</span>
        </div>
      </div>
    </div>
  )
}
