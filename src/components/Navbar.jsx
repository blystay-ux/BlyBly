import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
    height: 'var(--nav-height)', display: 'flex', alignItems: 'center',
    padding: '0 40px',
  },
  inner: {
    width: '100%', maxWidth: 1280, margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28,
    letterSpacing: '-1px', color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: 2,
    textDecoration: 'none',
  },
  dot: {
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: 'var(--accent)', marginLeft: 2, marginBottom: -2,
  },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  staysBtn: {
    padding: '9px 20px', borderRadius: 99,
    border: '1.5px solid var(--accent)',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
    color: 'var(--accent)', cursor: 'pointer', background: 'none',
    transition: 'all 0.15s',
  },
  btnOutline: {
    padding: '9px 20px', borderRadius: 99, border: '1.5px solid var(--text)',
    fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
    color: 'var(--text)', cursor: 'pointer', background: 'none',
  },
  btnFill: {
    padding: '9px 20px', borderRadius: 99, background: 'var(--text)',
    color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600,
    fontSize: 14, cursor: 'pointer', border: 'none',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
    fontFamily: 'var(--font-body)',
  },
}

export default function Navbar() {
  const navigate = useNavigate()
  const { user, role, signOut } = useAuth()

  const isAdmin = role === 'admin'
  const initial = user?.email?.[0]?.toUpperCase()

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          Bly<span style={styles.dot} />
        </Link>

        {/* Right-side actions — role based */}
        <div style={styles.actions}>
          {user ? (
            <>
              {/* Guests see Stays → bookings; admin does not */}
              {!isAdmin && (
                <button style={styles.staysBtn} onClick={() => navigate('/my-bookings')}>
                  Stays
                </button>
              )}
              <button style={styles.avatar} title={user.email}>{initial}</button>
              <button style={styles.btnOutline} onClick={() => { signOut(); navigate('/') }}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button style={styles.staysBtn} onClick={() => navigate('/')}>
                Stays
              </button>
              <button style={styles.btnOutline} onClick={() => navigate('/auth')}>
                Sign in
              </button>
              <button style={styles.btnFill} onClick={() => navigate('/auth')}>
                Book now
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
