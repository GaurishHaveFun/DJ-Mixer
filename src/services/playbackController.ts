// Global playback controller for triggering deck playback from outside Deck components

type PlaybackCallback = () => void

interface DeckCallbacks {
  play: PlaybackCallback
  pause: PlaybackCallback
}

const deckCallbacks: { A: DeckCallbacks | null; B: DeckCallbacks | null } = {
  A: null,
  B: null,
}

export const playbackController = {
  // Called by Deck components to register their play/pause functions
  register(deckId: 'A' | 'B', callbacks: DeckCallbacks) {
    deckCallbacks[deckId] = callbacks
  },

  // Called by Deck components when unmounting
  unregister(deckId: 'A' | 'B') {
    deckCallbacks[deckId] = null
  },

  // Trigger play on a specific deck
  play(deckId: 'A' | 'B') {
    deckCallbacks[deckId]?.play()
  },

  // Trigger pause on a specific deck
  pause(deckId: 'A' | 'B') {
    deckCallbacks[deckId]?.pause()
  },

  // Check if a deck has registered callbacks
  isRegistered(deckId: 'A' | 'B'): boolean {
    return deckCallbacks[deckId] !== null
  },
}
