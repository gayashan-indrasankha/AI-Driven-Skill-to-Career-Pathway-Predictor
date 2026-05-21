import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      if (!token) { setLoading(false); return }
      try {
        const res = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success) {
          setUser(json.data)
        } else {
          logout()
        }
      } catch {
        // Keep token if network fails (offline)
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [])

  const login = (userData, tokenValue) => {
    setUser(userData)
    setToken(tokenValue)
    localStorage.setItem('token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
