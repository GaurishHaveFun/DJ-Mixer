import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore, type DeckId } from '../../store/playerStore'
import { useAuthStore } from '../../store/authStore'
import { useDemoStore } from '../../store/demoStore'
import { useSoundCloudStore } from '../../store/soundCloudStore'
import { playTrack, pause, getCurrentState, setVolume } from '../../services/spotify/player'
import { demoPlayer } from '../../services/audio/demoPlayer'
import { formatDuration, getAlbumArt } from '../../services/spotify/api'
import { playbackController } from '../../services/playbackController'

// SoundCloud Widget API types
declare global {
  interface Window {
    SC?: {
      Widget: (iframe: HTMLIFrameElement) => SCWidget
    }
  }
}

interface SCWidget {
  bind: (event: string, callback: (data?: unknown) => void) => void
  unbind: (event: string) => void
  load: (url: string, options?: { auto_play?: boolean; callback?: () => void }) => void
  play: () => void
  pause: () => void
  seekTo: (ms: number) => void
  setVolume: (vol: number) => void
  getDuration: (cb: (duration: number) => void) => void
  getPosition: (cb: (position: number) => void) => void
}

interface DeckProps {
  deckId: DeckId
}

// Load SoundCloud Widget API script once
let scApiLoaded = false
let scApiLoading: Promise<void> | null = null

function loadSCApi(): Promise<void> {
  if (scApiLoaded) return Promise.resolve()
  if (scApiLoading) return scApiLoading

  scApiLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://w.soundcloud.com/player/api.js'
    script.async = true
    script.onload = () => {
      scApiLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load SC API'))
    document.head.appendChild(script)
  })

  return scApiLoading
}

export default function Deck({ deckId }: DeckProps) {
  const { accessToken } = useAuthStore()
  const { isDemo } = useDemoStore()
  const { isSoundCloud } = useSoundCloudStore()
  const {
    deckA,
    deckB,
    activeDeck,
    crossfaderPosition,
    masterVolume,
    setActiveDeck,
    setDeckPlaying,
    setDeckPosition,
    setDeckDuration,
    getEffectiveVolume,
  } = usePlayerStore()

  const deck = deckId === 'A' ? deckA : deckB
  const isActive = activeDeck === deckId
  const positionInterval = useRef<number | null>(null)

  // SoundCloud widget state
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<SCWidget | null>(null)
  const currentTrackUrl = useRef<string | null>(null)

  const colorClass = deckId === 'A' ? 'border-deck-a' : 'border-deck-b'
  const bgColorClass = deckId === 'A' ? 'bg-deck-a/10' : 'bg-deck-b/10'

  // Initialize SoundCloud widget when iframe loads
  useEffect(() => {
    if (!isSoundCloud) return

    const initWidget = async () => {
      await loadSCApi()

      // Wait for iframe to be ready
      if (!iframeRef.current || !window.SC) return

      const widget = window.SC.Widget(iframeRef.current)
      widgetRef.current = widget

      // Bind events
      widget.bind('ready', () => {
        console.log(`Deck ${deckId} widget ready`)
      })

      widget.bind('play', () => {
        setDeckPlaying(deckId, true)
      })

      widget.bind('pause', () => {
        setDeckPlaying(deckId, false)
      })

      widget.bind('playProgress', (data: unknown) => {
        const progress = data as { currentPosition: number }
        setDeckPosition(deckId, progress.currentPosition)
      })

      widget.bind('finish', () => {
        setDeckPlaying(deckId, false)
        setDeckPosition(deckId, 0)
      })
    }

    initWidget()

    return () => {
      if (widgetRef.current) {
        widgetRef.current.unbind('ready')
        widgetRef.current.unbind('play')
        widgetRef.current.unbind('pause')
        widgetRef.current.unbind('playProgress')
        widgetRef.current.unbind('finish')
      }
      widgetRef.current = null
    }
  }, [isSoundCloud, deckId, setDeckPlaying, setDeckPosition])

  // Load track into widget when track changes
  useEffect(() => {
    if (!isSoundCloud || !widgetRef.current || !deck.track) return

    const trackUrl = deck.track.uri
    if (!trackUrl.startsWith('http')) return
    if (currentTrackUrl.current === trackUrl) return

    currentTrackUrl.current = trackUrl
    console.log(`Deck ${deckId} loading track:`, trackUrl)

    widgetRef.current.load(trackUrl, {
      auto_play: false,
      callback: () => {
        console.log(`Deck ${deckId} track loaded`)
        // Get duration after load
        widgetRef.current?.getDuration((duration) => {
          console.log(`Deck ${deckId} duration:`, duration)
          if (setDeckDuration) {
            setDeckDuration(deckId, duration)
          }
        })
      },
    })
  }, [isSoundCloud, deck.track, deckId, setDeckDuration])

  // Update volume when crossfader/volume changes
  const effectiveVolume = getEffectiveVolume(deckId)

  useEffect(() => {
    if (isSoundCloud && widgetRef.current) {
      // SoundCloud uses 0-100 scale
      widgetRef.current.setVolume(effectiveVolume * 100)
      console.log(`Deck ${deckId} volume set to:`, effectiveVolume * 100)
    } else if (isDemo) {
      if (deck.isPlaying && demoPlayer.trackId === deck.track?.id) {
        demoPlayer.setVolume(effectiveVolume)
      }
    } else if (isActive) {
      setVolume(effectiveVolume)
    }
  // crossfaderPosition and masterVolume are included to trigger re-renders when they change
  }, [effectiveVolume, isSoundCloud, isDemo, isActive, deck.isPlaying, deck.track?.id, deckId, crossfaderPosition, masterVolume])

  // Update position periodically for demo/spotify modes
  useEffect(() => {
    // SoundCloud handles position via playProgress event
    if (isSoundCloud) return

    if (deck.isPlaying) {
      if (isDemo) {
        positionInterval.current = window.setInterval(() => {
          const newPosition = deck.position + 100
          if (deck.track && newPosition >= deck.track.duration_ms) {
            demoPlayer.stop()
            setDeckPosition(deckId, 0)
            setDeckPlaying(deckId, false)
          } else {
            setDeckPosition(deckId, newPosition)
          }
        }, 100)
      } else if (isActive) {
        positionInterval.current = window.setInterval(async () => {
          const state = await getCurrentState()
          if (state && !state.paused) {
            setDeckPosition(deckId, state.position)
          }
        }, 500)
      }
    }

    return () => {
      if (positionInterval.current) {
        clearInterval(positionInterval.current)
      }
    }
  }, [deck.isPlaying, deck.position, deck.track, isActive, isDemo, isSoundCloud, deckId, setDeckPosition, setDeckPlaying])

  // Play function that can be called externally
  const triggerPlay = useCallback(async () => {
    if (!deck.track || deck.isPlaying) return

    try {
      setActiveDeck(deckId)

      if (isSoundCloud && widgetRef.current) {
        widgetRef.current.setVolume(effectiveVolume * 100)
        widgetRef.current.play()
      } else if (isDemo) {
        await demoPlayer.initialize()
        demoPlayer.setVolume(effectiveVolume)
        await demoPlayer.play(deck.track.id)
      } else if (accessToken) {
        await playTrack(accessToken, deck.track.uri, deck.position)
        await setVolume(effectiveVolume)
      }
      setDeckPlaying(deckId, true)
    } catch (error) {
      console.error('Play error:', error)
    }
  }, [deck.track, deck.isPlaying, deck.position, isSoundCloud, isDemo, accessToken, effectiveVolume, deckId, setActiveDeck, setDeckPlaying, getEffectiveVolume])

  // Pause function that can be called externally
  const triggerPause = useCallback(async () => {
    if (!deck.isPlaying) return

    try {
      if (isSoundCloud && widgetRef.current) {
        widgetRef.current.pause()
      } else if (isDemo) {
        demoPlayer.stop()
      } else {
        await pause()
      }
      setDeckPlaying(deckId, false)
    } catch (error) {
      console.error('Pause error:', error)
    }
  }, [deck.isPlaying, isSoundCloud, isDemo, deckId, setDeckPlaying])

  // Register with playback controller
  useEffect(() => {
    playbackController.register(deckId, {
      play: triggerPlay,
      pause: triggerPause,
    })

    return () => {
      playbackController.unregister(deckId)
    }
  }, [deckId, triggerPlay, triggerPause])

  const handlePlay = async () => {
    if (!deck.track) return

    if (deck.isPlaying) {
      await triggerPause()
    } else {
      await triggerPlay()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = Number(e.target.value)
    setDeckPosition(deckId, newPosition)

    if (isSoundCloud && widgetRef.current) {
      widgetRef.current.seekTo(newPosition)
    }
  }

  const progressPercent = deck.track
    ? (deck.position / deck.track.duration_ms) * 100
    : 0

  return (
    <div
      className={`rounded-lg border-2 ${colorClass} ${bgColorClass} p-4 transition-all ${
        isActive ? 'ring-2 ring-white/30' : ''
      }`}
    >
      {/* SoundCloud Widget iframe - always present but hidden */}
      {isSoundCloud && (
        <iframe
          ref={iframeRef}
          src="https://w.soundcloud.com/player/?url=https://soundcloud.com/&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false"
          width="100%"
          height="166"
          allow="autoplay"
          style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}
          title={`SoundCloud Widget Deck ${deckId}`}
        />
      )}

      {/* Deck Label */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-2xl font-bold ${
            deckId === 'A' ? 'text-deck-a' : 'text-deck-b'
          }`}
        >
          DECK {deckId}
        </span>
        <div className="flex items-center gap-2">
          {isSoundCloud && (
            <span className="text-xs text-orange-500 bg-orange-500/20 px-2 py-1 rounded">
              SC
            </span>
          )}
          {isActive && (
            <span className="text-xs text-spotify-green bg-spotify-green/20 px-2 py-1 rounded">
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Track Info */}
      {deck.track ? (
        <div className="flex gap-4 mb-4">
          {/* Album Art */}
          <img
            src={getAlbumArt(deck.track)}
            alt={deck.track.album.name}
            className="w-24 h-24 rounded shadow-lg"
          />

          {/* Track Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{deck.track.name}</h3>
            <p className="text-spotify-lightgray text-sm truncate">
              {deck.track.artists.map((a) => a.name).join(', ')}
            </p>
            <p className="text-spotify-lightgray/70 text-xs truncate mt-1">
              {deck.track.album.name}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 mb-4 bg-spotify-darkgray/50 rounded">
          <p className="text-spotify-lightgray">
            {isSoundCloud ? 'Paste a SoundCloud URL below' : 'Drop a track here'}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="relative h-2 bg-spotify-darkgray rounded-full overflow-hidden">
          <div
            className={`absolute h-full ${
              deckId === 'A' ? 'bg-deck-a' : 'bg-deck-b'
            } transition-all`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={deck.track?.duration_ms || 100}
          value={deck.position}
          onChange={handleSeek}
          disabled={!deck.track}
          className="w-full h-2 absolute opacity-0 cursor-pointer"
          style={{ marginTop: '-8px' }}
        />
        <div className="flex justify-between text-xs text-spotify-lightgray mt-1">
          <span>{formatDuration(deck.position)}</span>
          <span>{deck.track ? formatDuration(deck.track.duration_ms) : '0:00'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePlay}
          disabled={!deck.track}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            deck.track
              ? deck.isPlaying
                ? 'bg-spotify-green text-black hover:bg-green-400'
                : 'bg-spotify-darkgray text-white hover:bg-gray-600'
              : 'bg-spotify-darkgray/50 text-gray-600 cursor-not-allowed'
          }`}
        >
          {deck.isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Volume Indicator */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-spotify-lightgray mb-1">
          <span>Volume</span>
          <span>{Math.round(getEffectiveVolume(deckId) * 100)}%</span>
        </div>
        <div className="h-1 bg-spotify-darkgray rounded-full overflow-hidden">
          <div
            className={`h-full ${deckId === 'A' ? 'bg-deck-a' : 'bg-deck-b'}`}
            style={{ width: `${getEffectiveVolume(deckId) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
