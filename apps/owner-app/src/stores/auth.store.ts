import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setAccessToken } from '../services/api'

interface User {
  id: string
  email: string
  name: string
  restaurantId: string
}

interface Restaurant {
  id: string
  name: string
  slug: string
}

interface AuthState {
  user: User | null
  restaurant: Restaurant | null
  isAuthenticated: boolean
  setAuth: (user: User, restaurant: Restaurant, accessToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      restaurant: null,
      isAuthenticated: false,
      setAuth: (user, restaurant, accessToken) => {
        setAccessToken(accessToken)
        set({ user, restaurant, isAuthenticated: true })
      },
      clearAuth: () => {
        setAccessToken(null)
        set({ user: null, restaurant: null, isAuthenticated: false })
      },
    }),
    { name: 'parce-auth', partialize: (s) => ({ user: s.user, restaurant: s.restaurant }) }
  )
)
