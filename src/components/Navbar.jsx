import { Link } from 'react-router-dom'

const styles = {
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'var(--bg)', borderBottom: '1px solid var(--border)',
    height: 'var(--nav-height)', display: 'flex', alignItems: 'center',
    padding: '0 40px',
  },
  inner: {
    width: '100%', maxWidth: 1280, margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
  },
  logo: {
    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28,
    letterSpacing: '-1px', color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: 2,
    textDecoration: 'none', flexShrink: 0,
  },
  dot: {
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: 'var(--accent)', marginLeft: 2, marginBottom: -2,
  },
  actions: { display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'flex-end' },
  link: {
    fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
    color: 'var(--text)', textDecoration: 'none', cursor: 'pointer',
    background: 'none', border: 'none', whiteSpace: 'nowrap',
  },
  linkAccent: {
    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
    color: 'var(--accent)', textDecoration: 'none', cursor: 'pointer',
    background: 'none', border: 'none', whiteSpace: 'nowrap',
  },
  btnOutline: {
    padding: '9px 18px', borderRadius: 99, border: '1.5px solid var(--text)',
    fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
    color: 'var(--text)', cursor: 'pointer', background: 'none', whiteSpace: 'nowrap',
  },
  btnFill: {
    padding: '9px 18px', borderRadius: 99, background: 'var(--text)',
    color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 600,
    fontSize: 14, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none',
    fontFamily: 'var(--font-body)', flexShrink: 0,
  },
}

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          Bly<span style={styles.dot} />
        </Link>

        {/* Links */}
        <div style={styles.actions}>
          <Link to="/industry" style={styles.link}>Industry</Link>
        </div>

      </div>
    </nav>
  )
}
