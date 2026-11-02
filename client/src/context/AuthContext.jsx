import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './useAuth'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  // Only show a loading state when there is a stored token to validate
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'))

  const login = useCallback((userData, tokenValue) => {
    setUser(userData)
    setToken(tokenValue)
    localStorage.setItem('token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  // Validate the token whenever it changes (page load, login)
  useEffect(() => {
    if (!token) return
    let cancelled = false
    const validate = async () => {
      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (cancelled) return
        if (json.success) {
          setUser(json.data)
        } else {
          logout()
        }
      } catch {
        // Keep token if network fails (offline)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    validate()
    return () => { cancelled = true }
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
