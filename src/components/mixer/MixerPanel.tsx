import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { useSoundCloudStore } from '../../store/soundCloudStore'
import { setVolume } from '../../services/spotify/player'
import { djEffects } from '../../services/audio/effects'

export default function MixerPanel() {
  const {
    crossfaderPosition,
    setCrossfaderPosition,
    masterVolume,
    setMasterVolume,
    deckA,
    deckB,
    setDeckVolume,
    getEffectiveVolume,
    activeDeck,
    setActiveDeck,
    setDeckPlaying,
  } = usePlayerStore()

  const { isSoundCloud } = useSoundCloudStore()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionRef = useRef<number | null>(null)

  // Update Spotify volume when crossfader or master volume changes
  useEffect(() => {
    const effectiveVolume = getEffectiveVolume(activeDeck)
    setVolume(effectiveVolume)
  }, [crossfaderPosition, masterVolume, activeDeck, getEffectiveVolume])

  // Cleanup transition on unmount
  useEffect(() => {
    return () => {
      if (transitionRef.current) {
        clearInterval(transitionRef.current)
      }
    }
  }, [])

  // Auto-transition function with DJ effect
  const performTransition = async (targetDeck: 'A' | 'B') => {
    if (isTransitioning) return

    const sourceDeck = targetDeck === 'A' ? 'B' : 'A'
    const sourceIsPlaying = targetDeck === 'A' ? deckB.isPlaying : deckA.isPlaying
    const targetHasTrack = targetDeck === 'A' ? deckA.track : deckB.track

    if (!targetHasTrack) return

    setIsTransitioning(true)

    // Play a random DJ effect
    const effects = ['scratch', 'drop', 'rewind'] as const
    const randomEffect = effects[Math.floor(Math.random() * effects.length)]

    try {
      await djEffects.initialize()
      djEffects.play(randomEffect)
    } catch (e) {
      console.log('Effects not available')
    }

    // Animate crossfader
    const startPosition = crossfaderPosition
    const endPosition = targetDeck === 'A' ? -100 : 100
    const duration = 500 // ms
    const steps = 20
    const stepDuration = duration / steps
    const stepSize = (endPosition - startPosition) / steps

    let currentStep = 0

    // For SoundCloud: stop source first, then start target
    if (isSoundCloud && sourceIsPlaying) {
      setDeckPlaying(sourceDeck, false)
    }

    transitionRef.current = window.setInterval(() => {
      currentStep++
      const newPosition = startPosition + (stepSize * currentStep)
      setCrossfaderPosition(newPosition)

      // Start target deck partway through transition
      if (currentStep === Math.floor(steps / 2)) {
        setActiveDeck(targetDeck)
        if (targetHasTrack) {
          setDeckPlaying(targetDeck, true)
        }
      }

      if (currentStep >= steps) {
        if (transitionRef.current) {
          clearInterval(transitionRef.current)
          transitionRef.current = null
        }
        setCrossfaderPosition(endPosition)
        setIsTransitioning(false)
      }
    }, stepDuration)
  }

  return (
    <div className="bg-spotify-darkgray rounded-lg p-4">
      <h2 className="text-white font-semibold mb-4 text-center">MIXER</h2>

      {/* Channel Strips */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-6">
        {/* Deck A Channel */}
        <div className="flex flex-col items-center">
          <span className="text-deck-a font-bold mb-2">A</span>
          <div className="relative h-32 w-6 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute bottom-0 w-full bg-deck-a transition-all"
              style={{ height: `${deckA.volume * 100}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={deckA.volume * 100}
            onChange={(e) => setDeckVolume('A', Number(e.target.value) / 100)}
            className="w-32 h-6 -rotate-90 mt-12 mb-12"
            style={{ transformOrigin: 'center' }}
          />
          <span className="text-spotify-lightgray text-xs mt-2">
            {Math.round(deckA.volume * 100)}%
          </span>
        </div>

        {/* Master Volume */}
        <div className="flex flex-col items-center">
          <span className="text-spotify-green font-bold mb-2">M</span>
          <div className="relative h-32 w-6 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute bottom-0 w-full bg-spotify-green transition-all"
              style={{ height: `${masterVolume * 100}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume * 100}
            onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
            className="w-32 h-6 -rotate-90 mt-12 mb-12"
            style={{ transformOrigin: 'center' }}
          />
          <span className="text-spotify-lightgray text-xs mt-2">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

        {/* Deck B Channel */}
        <div className="flex flex-col items-center">
          <span className="text-deck-b font-bold mb-2">B</span>
          <div className="relative h-32 w-6 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute bottom-0 w-full bg-deck-b transition-all"
              style={{ height: `${deckB.volume * 100}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={deckB.volume * 100}
            onChange={(e) => setDeckVolume('B', Number(e.target.value) / 100)}
            className="w-32 h-6 -rotate-90 mt-12 mb-12"
            style={{ transformOrigin: 'center' }}
          />
          <span className="text-spotify-lightgray text-xs mt-2">
            {Math.round(deckB.volume * 100)}%
          </span>
        </div>
      </div>

      {/* Auto-Transition Buttons */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => performTransition('A')}
          disabled={isTransitioning || !deckA.track}
          className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
            isTransitioning || !deckA.track
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-deck-a/20 text-deck-a border border-deck-a hover:bg-deck-a hover:text-black'
          }`}
        >
          ← TRANS A
        </button>
        <button
          onClick={() => performTransition('B')}
          disabled={isTransitioning || !deckB.track}
          className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
            isTransitioning || !deckB.track
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-deck-b/20 text-deck-b border border-deck-b hover:bg-deck-b hover:text-black'
          }`}
        >
          TRANS B →
        </button>
      </div>

      {/* Crossfader */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-deck-a font-bold">A</span>
          <span className="text-spotify-lightgray">CROSSFADER</span>
          <span className="text-deck-b font-bold">B</span>
        </div>

        {/* Crossfader Track */}
        <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
          {/* Gradient background showing mix */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right,
                rgba(255, 107, 107, ${1 - (crossfaderPosition + 100) / 200}) 0%,
                rgba(78, 205, 196, ${(crossfaderPosition + 100) / 200}) 100%)`,
            }}
          />

          {/* Crossfader handle position indicator */}
          <div
            className={`absolute top-1 bottom-1 w-4 bg-white rounded-full shadow-lg transition-all ${
              isTransitioning ? 'transition-none' : ''
            }`}
            style={{
              left: `calc(${(crossfaderPosition + 100) / 2}% - 8px)`,
            }}
          />
        </div>

        <input
          type="range"
          min="-100"
          max="100"
          value={crossfaderPosition}
          onChange={(e) => setCrossfaderPosition(Number(e.target.value))}
          disabled={isTransitioning}
          className="w-full h-8 opacity-0 cursor-pointer absolute"
          style={{ marginTop: '-32px' }}
        />

        {/* Cut buttons */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setCrossfaderPosition(-100)}
            disabled={isTransitioning}
            className={`px-4 py-2 rounded font-bold transition-colors ${
              crossfaderPosition === -100
                ? 'bg-deck-a text-black'
                : 'bg-gray-700 text-deck-a hover:bg-gray-600'
            } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            CUT A
          </button>

          <button
            onClick={() => setCrossfaderPosition(0)}
            disabled={isTransitioning}
            className={`px-4 py-2 rounded font-bold transition-colors ${
              crossfaderPosition === 0
                ? 'bg-white text-black'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            CENTER
          </button>

          <button
            onClick={() => setCrossfaderPosition(100)}
            disabled={isTransitioning}
            className={`px-4 py-2 rounded font-bold transition-colors ${
              crossfaderPosition === 100
                ? 'bg-deck-b text-black'
                : 'bg-gray-700 text-deck-b hover:bg-gray-600'
            } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            CUT B
          </button>
        </div>
      </div>
    </div>
  )
}
