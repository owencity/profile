import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  nickname: string
  profileImage?: string
  provider: 'kakao' | 'google'
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  login: (user: AuthUser, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' },
  ),
)
