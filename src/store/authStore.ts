import { create } from 'zustand'
import {
  getStoredTokens,
  refreshAccessToken,
  clearTokens,
  isTokenExpired,
} from '../services/spotify/auth'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void
  refreshIfNeeded: () => Promise<void>
  logout: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  error: null,

  setTokens: (accessToken, refreshToken) => {
    set({ accessToken, refreshToken, error: null })
  },

  refreshIfNeeded: async () => {
    const { refreshToken } = get()
    if (!refreshToken) {
      set({ error: 'No refresh token available' })
      return
    }

    if (isTokenExpired()) {
      try {
        const tokens = await refreshAccessToken(refreshToken)
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          error: null,
        })
      } catch (error) {
        set({ error: (error as Error).message })
        // If refresh fails, clear tokens and redirect to login
        get().logout()
      }
    }
  },

  logout: () => {
    clearTokens()
    set({ accessToken: null, refreshToken: null, error: null })
  },

  initialize: () => {
    const stored = getStoredTokens()
    if (stored.accessToken && stored.refreshToken) {
      set({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
        isLoading: false,
      })
      // Check if we need to refresh
      get().refreshIfNeeded()
    } else {
      set({ isLoading: false })
    }
  },
}))

// Initialize on load
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize()
}
