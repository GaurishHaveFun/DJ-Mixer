import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'
import { useDemoStore } from '../store/demoStore'
import { useSoundCloudStore } from '../store/soundCloudStore'
import { initializePlayer, disconnect } from '../services/spotify/player'
import { djEffects } from '../services/audio/effects'
import Deck from '../components/deck/Deck'
import MixerPanel from '../components/mixer/MixerPanel'
import TrackBrowser from '../components/browser/TrackBrowser'
import EffectsPad from '../components/effects/EffectsPad'

export default function DJ() {
  const navigate = useNavigate()
  const { accessToken, logout } = useAuthStore()
  const { setConnected, isConnected } = usePlayerStore()
  const { isDemo, setDemoMode } = useDemoStore()
  const { isSoundCloud, setSoundCloudMode } = useSoundCloudStore()
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize player (real, demo, or SoundCloud)
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true)

        // Initialize DJ effects (works in all modes)
        await djEffects.initialize()

        if (isSoundCloud) {
          // SoundCloud mode - no Spotify connection needed
          // Widget initialization happens in Deck components
          setConnected(true, 'soundcloud-device')
          setError(null)
        } else if (isDemo) {
          // Demo mode - no Spotify connection needed
          setConnected(true, 'demo-device')
          setError(null)
        } else if (accessToken) {
          // Real Spotify mode
          const deviceId = await initializePlayer(accessToken, {
            onReady: (id) => {
              console.log('Player ready:', id)
              setConnected(true, id)
            },
            onNotReady: () => {
              setConnected(false)
            },
            onError: (err) => {
              setError(err.message)
            },
          })

          setConnected(true, deviceId)
          setError(null)
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsInitializing(false)
      }
    }

    init()

    return () => {
      if (!isDemo && !isSoundCloud) {
        disconnect()
      }
      setConnected(false)
    }
  }, [accessToken, isDemo, isSoundCloud, setConnected])

  // Keyboard shortcuts for effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const effectName = djEffects.getEffectByShortcut(e.key)
      if (effectName) {
        e.preventDefault()
        djEffects.play(effectName)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleExit = () => {
    if (isSoundCloud) {
      setSoundCloudMode(false)
    } else if (isDemo) {
      setDemoMode(false)
    } else {
      logout()
    }
    navigate('/login')
  }

  // Get mode label
  const getModeLabel = () => {
    if (isSoundCloud) return 'SoundCloud'
    if (isDemo) return 'Demo'
    return isConnected ? 'Connected' : 'Disconnected'
  }

  const getModeColor = () => {
    if (isSoundCloud) return 'text-orange-500'
    if (isDemo) return 'text-yellow-400'
    return isConnected ? 'text-spotify-green' : 'text-red-400'
  }

  const getModeDotColor = () => {
    if (isSoundCloud) return 'bg-orange-500'
    if (isDemo) return 'bg-yellow-400'
    return isConnected ? 'bg-spotify-green' : 'bg-red-400'
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green mb-4"></div>
        <p className="text-spotify-lightgray">Initializing DJ deck...</p>
      </div>
    )
  }

  if (error && !isDemo && !isSoundCloud) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-red-400 text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <p className="text-red-200/70 text-sm mb-4">
            Make sure you have Spotify Premium and the Spotify app is not playing elsewhere.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-spotify-green hover:bg-green-400 text-black font-semibold py-2 px-6 rounded-full transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-spotify-darkgray border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {isSoundCloud ? (
            <>
              SoundCloud <span className="text-orange-500">DJ</span>
            </>
          ) : (
            <>
              Spotify <span className="text-spotify-green">DJ</span>
            </>
          )}
          {isDemo && (
            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
              DEMO MODE
            </span>
          )}
        </h1>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-2 text-sm ${getModeColor()}`}>
            <span className={`w-2 h-2 rounded-full ${getModeDotColor()}`}></span>
            {getModeLabel()}
          </span>
          <button
            onClick={handleExit}
            className="text-spotify-lightgray hover:text-white text-sm transition-colors"
          >
            {isSoundCloud || isDemo ? 'Exit' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Main DJ Interface */}
      <main className="flex-1 p-4 flex flex-col gap-4 overflow-auto">
        {/* Decks */}
        <div className="grid grid-cols-2 gap-4 flex-shrink-0">
          <Deck deckId="A" />
          <Deck deckId="B" />
        </div>

        {/* Mixer and Effects */}
        <div className="grid grid-cols-[1fr_300px] gap-4 flex-shrink-0">
          <MixerPanel />
          <EffectsPad />
        </div>

        {/* Track Browser */}
        <div className="flex-shrink-0">
          <TrackBrowser />
        </div>
      </main>
    </div>
  )
}
