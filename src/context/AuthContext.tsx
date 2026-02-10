import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiRequest } from '../api'

interface AuthContextValue {
  token: string | null
  email: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'fotine27@gmail.com'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState(() => localStorage.getItem('cheria_token'))
  const [email, setEmail] = useState(() => localStorage.getItem('cheria_email'))
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem('cheria_is_admin') === 'true',
  )
  const [isLoading, setIsLoading] = useState(false)

  const applySession = useCallback(
    (data: { token: string; email: string; isAdmin?: boolean }) => {
      setToken(data.token)
      setEmail(data.email)
      const adminFlag = data.isAdmin ?? data.email === ADMIN_EMAIL
      setIsAdmin(adminFlag)
      localStorage.setItem('cheria_token', data.token)
      localStorage.setItem('cheria_email', data.email)
      localStorage.setItem('cheria_is_admin', adminFlag ? 'true' : 'false')
    },
    [],
  )

  const login = useCallback(async (inputEmail: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await apiRequest<{
        token: string
        email: string
        isAdmin?: boolean
      }>('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail, password }),
      })
      applySession(data)
    } finally {
      setIsLoading(false)
    }
  }, [applySession])

  const signup = useCallback(async (inputEmail: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await apiRequest<{
        token: string
        email: string
        isAdmin?: boolean
      }>('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail, password }),
      })
      applySession(data)
    } finally {
      setIsLoading(false)
    }
  }, [applySession])

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiRequest('/api/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // Allow local logout even if the request fails.
      }
    }

    setToken(null)
    setEmail(null)
    setIsAdmin(false)
    localStorage.removeItem('cheria_token')
    localStorage.removeItem('cheria_email')
    localStorage.removeItem('cheria_is_admin')
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email,
      isAuthenticated: Boolean(token),
      isAdmin,
      isLoading,
      login,
      signup,
      logout,
    }),
    [token, email, isAdmin, isLoading, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
