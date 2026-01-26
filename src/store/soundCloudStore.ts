import { create } from 'zustand'
import type { SpotifyTrack } from '../services/spotify/api'

interface SoundCloudState {
  isSoundCloud: boolean
  // Track history for quick re-loading
  trackHistory: SpotifyTrack[]
  // Actions
  setSoundCloudMode: (isSoundCloud: boolean) => void
  addToHistory: (track: SpotifyTrack) => void
  removeFromHistory: (trackId: string) => void
  clearHistory: () => void
}

const MAX_HISTORY_SIZE = 20

export const useSoundCloudStore = create<SoundCloudState>((set) => ({
  isSoundCloud: false,
  trackHistory: [],

  setSoundCloudMode: (isSoundCloud) => set({ isSoundCloud }),

  addToHistory: (track) =>
    set((state) => {
      // Don't add duplicates
      if (state.trackHistory.some((t) => t.uri === track.uri)) {
        return state
      }
      // Keep history at max size, removing oldest
      const newHistory = [track, ...state.trackHistory].slice(0, MAX_HISTORY_SIZE)
      return { trackHistory: newHistory }
    }),

  removeFromHistory: (trackId) =>
    set((state) => ({
      trackHistory: state.trackHistory.filter((t) => t.id !== trackId),
    })),

  clearHistory: () => set({ trackHistory: [] }),
}))
