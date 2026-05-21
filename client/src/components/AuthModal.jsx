import { useState } from 'react'
import { FiX, FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const AuthModal = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const [tab, setTab] = useState(defaultTab)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const { login } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = tab === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || json.errors?.[0]?.msg || 'Authentication failed')
      }
      login(json.user, json.token)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
    background: 'rgba(6,13,24,0.8)', border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: '10px', color: '#e2e8f0', fontFamily: 'var(--font-primary)',
    fontSize: '0.9rem', outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,4,8,0.85)', backdropFilter: 'blur(8px)' }} />

      {/* Modal */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '440px', background: 'rgba(6,13,24,0.95)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '20px', padding: '2rem', boxShadow: '0 0 60px rgba(0,212,255,0.08)', animation: 'modalIn 0.25s ease' }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(-10px)}to{opacity:1;transform:none}}`}</style>

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: '0.25rem' }}>
          <FiX size={20} />
        </button>

        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 0 24px rgba(0,212,255,0.3)' }}>
            <span style={{ color: '#020408', fontWeight: 900, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>P</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.25rem' }}>
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#475569' }}>
            {tab === 'login' ? 'Sign in to access your career dashboard' : 'Start your AI-powered career journey'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, padding: '0.5rem', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease',
              background: tab === t ? 'rgba(0,212,255,0.1)' : 'transparent',
              color: tab === t ? '#00d4ff' : '#475569',
              boxShadow: tab === t ? '0 0 12px rgba(0,212,255,0.12)' : 'none',
            }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(255,0,110,0.08)', border: '1px solid rgba(255,0,110,0.2)', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#ff6b9d' }}>
            <FiAlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'register' && (
            <div style={{ position: 'relative' }}>
              <FiUser size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input style={inputStyle} type="text" placeholder="Full name" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required minLength={2} />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <FiMail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input style={inputStyle} type="email" placeholder="Email address" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>

          <div style={{ position: 'relative' }}>
            <FiLock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input style={{ ...inputStyle, paddingRight: '3rem' }} type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
            <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
              {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn-primary"
            style={{ justifyContent: 'center', marginTop: '0.5rem', opacity: loading ? 0.7 : 1, background: 'linear-gradient(135deg,#00d4ff,#7c3aed)' }}>
            {loading
              ? <><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Processing...</>
              : tab === 'login' ? 'Sign In →' : 'Create Account →'
            }
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#334155', marginTop: '1.25rem' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }} style={{ background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}>
            {tab === 'login' ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthModal
