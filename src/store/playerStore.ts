import { create } from 'zustand'
import type { SpotifyTrack } from '../services/spotify/api'

export type DeckId = 'A' | 'B'

interface DeckState {
  track: SpotifyTrack | null
  isPlaying: boolean
  position: number // Current position in ms
  volume: number // 0 to 1
}

interface PlayerState {
  // Deck states
  deckA: DeckState
  deckB: DeckState
  activeDeck: DeckId

  // Mixer state
  crossfaderPosition: number // -100 (full A) to +100 (full B)
  masterVolume: number // 0 to 1

  // Playback state from Spotify
  isConnected: boolean
  deviceId: string | null

  // Actions
  setDeckTrack: (deck: DeckId, track: SpotifyTrack | null) => void
  setDeckPlaying: (deck: DeckId, isPlaying: boolean) => void
  setDeckPosition: (deck: DeckId, position: number) => void
  setDeckVolume: (deck: DeckId, volume: number) => void
  setDeckDuration: (deck: DeckId, duration: number) => void
  setActiveDeck: (deck: DeckId) => void
  setCrossfaderPosition: (position: number) => void
  setMasterVolume: (volume: number) => void
  setConnected: (connected: boolean, deviceId?: string) => void

  // Computed volumes based on crossfader
  getEffectiveVolume: (deck: DeckId) => number
}

const initialDeckState: DeckState = {
  track: null,
  isPlaying: false,
  position: 0,
  volume: 1,
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  deckA: { ...initialDeckState },
  deckB: { ...initialDeckState },
  activeDeck: 'A',
  crossfaderPosition: 0,
  masterVolume: 0.8,
  isConnected: false,
  deviceId: null,

  setDeckTrack: (deck, track) => {
    set((state) => ({
      [deck === 'A' ? 'deckA' : 'deckB']: {
        ...state[deck === 'A' ? 'deckA' : 'deckB'],
        track,
        position: 0,
      },
    }))
  },

  setDeckPlaying: (deck, isPlaying) => {
    set((state) => ({
      [deck === 'A' ? 'deckA' : 'deckB']: {
        ...state[deck === 'A' ? 'deckA' : 'deckB'],
        isPlaying,
      },
    }))
  },

  setDeckPosition: (deck, position) => {
    set((state) => ({
      [deck === 'A' ? 'deckA' : 'deckB']: {
        ...state[deck === 'A' ? 'deckA' : 'deckB'],
        position,
      },
    }))
  },

  setDeckVolume: (deck, volume) => {
    set((state) => ({
      [deck === 'A' ? 'deckA' : 'deckB']: {
        ...state[deck === 'A' ? 'deckA' : 'deckB'],
        volume: Math.max(0, Math.min(1, volume)),
      },
    }))
  },

  setDeckDuration: (deck, duration) => {
    set((state) => {
      const deckKey = deck === 'A' ? 'deckA' : 'deckB'
      const deckState = state[deckKey]
      if (!deckState.track) return state
      return {
        [deckKey]: {
          ...deckState,
          track: {
            ...deckState.track,
            duration_ms: duration,
          },
        },
      }
    })
  },

  setActiveDeck: (deck) => set({ activeDeck: deck }),

  setCrossfaderPosition: (position) => {
    set({ crossfaderPosition: Math.max(-100, Math.min(100, position)) })
  },

  setMasterVolume: (volume) => {
    set({ masterVolume: Math.max(0, Math.min(1, volume)) })
  },

  setConnected: (connected, deviceId) => {
    set({ isConnected: connected, deviceId: deviceId || null })
  },

  // Equal power crossfade calculation
  getEffectiveVolume: (deck) => {
    const state = get()
    const deckState = deck === 'A' ? state.deckA : state.deckB
    const normalized = (state.crossfaderPosition + 100) / 200 // 0 to 1

    // Equal power crossfade curve
    const crossfadeMultiplier =
      deck === 'A'
        ? Math.cos(normalized * Math.PI / 2)
        : Math.sin(normalized * Math.PI / 2)

    return deckState.volume * crossfadeMultiplier * state.masterVolume
  },
}))
