import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import { FiUser, FiLogOut, FiZap } from 'react-icons/fi'
import { MdOutlineElectricBolt } from 'react-icons/md'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../AuthModal'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/simulation', label: 'Simulation' },
  { to: '/nexus', label: 'Nexus AI' },
]

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()
  const { user, isAuth, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setShowUserMenu(false)
  }, [location])

  const openLogin = () => { setAuthTab('login'); setShowAuth(true) }
  const openRegister = () => { setAuthTab('register'); setShowAuth(true) }

  const navLinkStyle = (isActive) => ({
    textDecoration: 'none',
    display: 'inline-flex', alignItems: 'center',
    padding: '0.5rem 1rem', borderRadius: '8px',
    fontSize: '0.875rem', fontWeight: 500,
    letterSpacing: '0.03em', transition: 'all 0.25s ease',
    color: isActive ? '#00d4ff' : '#94a3b8',
    background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
    border: isActive ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
  })

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(2, 4, 8, 0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0, 212, 255, 0.12)' : '1px solid transparent',
      }}>
        <div className="container-max" style={{ padding: '0 1.5rem' }}>
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
                <MdOutlineElectricBolt size={20} color="#020408" />
              </div>
              <div>
                <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.05em' }}>
                  PATH<span style={{ color: '#00d4ff' }}>AI</span>
                </span>
                <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Career Intelligence
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <ul style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', listStyle: 'none', margin: 0 }}>
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <NavLink to={to} end={to === '/'} style={({ isActive }) => navLinkStyle(isActive)}>
                    {label === 'Nexus AI' && <FiZap size={13} style={{ marginRight: '0.25rem' }} />}
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Auth area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isAuth ? (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowUserMenu(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px', padding: '0.45rem 0.875rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', transition: 'all 0.2s' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#020408' }}>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span style={{ color: '#e2e8f0', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name?.split(' ')[0] || 'User'}</span>
                  </button>
                  {showUserMenu && (
                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'rgba(6,13,24,0.97)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '12px', padding: '0.5rem', minWidth: '180px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 200 }}>
                      <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid rgba(0,212,255,0.08)', marginBottom: '0.25rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.1rem' }}>{user?.email}</div>
                      </div>
                      <Link to="/dashboard" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '8px', textDecoration: 'none', color: '#94a3b8', fontSize: '0.82rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <FiUser size={14} /> Dashboard
                      </Link>
                      <button onClick={() => { logout(); setShowUserMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b9d', fontSize: '0.82rem', width: '100%', textAlign: 'left', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,0,110,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <FiLogOut size={14} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button onClick={openLogin} style={{ background: 'transparent', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', padding: '0.45rem 1rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)' }}>
                    Sign In
                  </button>
                  <button onClick={openRegister} className="btn-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.825rem' }}>
                    Get Started
                  </button>
                </>
              )}

              {/* Mobile toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px', color: '#00d4ff', cursor: 'pointer' }}>
                {mobileOpen ? <HiX size={20} /> : <HiMenuAlt3 size={20} />}
              </button>
            </div>
          </nav>

          {/* Mobile menu */}
          {mobileOpen && (
            <div className="glass" style={{ position: 'absolute', top: '72px', left: 0, right: 0, padding: '1rem', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem' }}>
                {navLinks.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink to={to} end={to === '/'} style={({ isActive }) => ({ ...navLinkStyle(isActive), display: 'block', padding: '0.75rem 1rem' })}>
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {!isAuth && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={openLogin} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>Sign In</button>
                  <button onClick={openRegister} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Register</button>
                </div>
              )}
              {isAuth && (
                <button onClick={logout} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,0,110,0.06)', border: '1px solid rgba(255,0,110,0.2)', color: '#ff6b9d', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FiLogOut size={15} /> Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} defaultTab={authTab} />
    </>
  )
}

export default Navbar
