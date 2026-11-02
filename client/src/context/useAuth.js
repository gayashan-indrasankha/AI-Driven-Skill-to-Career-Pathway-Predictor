import { createContext, useContext } from 'react'

// Kept apart from AuthProvider so that file only exports components (React Fast Refresh)
export const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
