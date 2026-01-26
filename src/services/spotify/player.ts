/// <reference types="@types/spotify-web-playback-sdk" />

let player: Spotify.Player | null = null
let deviceId: string | null = null

interface PlayerCallbacks {
  onReady?: (deviceId: string) => void
  onNotReady?: () => void
  onStateChange?: (state: Spotify.PlaybackState | null) => void
  onError?: (error: Spotify.Error) => void
}

/**
 * Initialize the Spotify Web Playback SDK player
 */
export function initializePlayer(
  token: string,
  callbacks: PlayerCallbacks = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Wait for SDK to be ready
    window.onSpotifyWebPlaybackSDKReady = () => {
      player = new Spotify.Player({
        name: 'Spotify DJ',
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      })

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player Ready with Device ID:', device_id)
        deviceId = device_id
        callbacks.onReady?.(device_id)
        resolve(device_id)
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline:', device_id)
        callbacks.onNotReady?.()
      })

      player.addListener('player_state_changed', (state) => {
        callbacks.onStateChange?.(state)
      })

      player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message)
        callbacks.onError?.({ message })
        reject(new Error(message))
      })

      player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message)
        callbacks.onError?.({ message })
        reject(new Error(message))
      })

      player.addListener('account_error', ({ message }) => {
        console.error('Account error:', message)
        callbacks.onError?.({ message })
        reject(new Error(message))
      })

      player.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message)
        callbacks.onError?.({ message })
      })

      player.connect()
    }

    // If SDK is already loaded
    if (window.Spotify) {
      window.onSpotifyWebPlaybackSDKReady()
    }
  })
}

/**
 * Get the current player instance
 */
export function getPlayer(): Spotify.Player | null {
  return player
}

/**
 * Get the device ID
 */
export function getDeviceId(): string | null {
  return deviceId
}

/**
 * Play a track by URI
 */
export async function playTrack(
  token: string,
  trackUri: string,
  positionMs = 0
): Promise<void> {
  if (!deviceId) throw new Error('Player not ready')

  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: [trackUri],
      position_ms: positionMs,
    }),
  })
}

/**
 * Pause playback
 */
export async function pause(): Promise<void> {
  await player?.pause()
}

/**
 * Resume playback
 */
export async function resume(): Promise<void> {
  await player?.resume()
}

/**
 * Toggle play/pause
 */
export async function togglePlay(): Promise<void> {
  await player?.togglePlay()
}

/**
 * Seek to position
 */
export async function seek(positionMs: number): Promise<void> {
  await player?.seek(positionMs)
}

/**
 * Set volume (0.0 to 1.0)
 */
export async function setVolume(volume: number): Promise<void> {
  await player?.setVolume(Math.max(0, Math.min(1, volume)))
}

/**
 * Get current playback state
 */
export async function getCurrentState(): Promise<Spotify.PlaybackState | null> {
  return await player?.getCurrentState() ?? null
}

/**
 * Skip to next track
 */
export async function nextTrack(): Promise<void> {
  await player?.nextTrack()
}

/**
 * Skip to previous track
 */
export async function previousTrack(): Promise<void> {
  await player?.previousTrack()
}

/**
 * Disconnect the player
 */
export function disconnect(): void {
  player?.disconnect()
  player = null
  deviceId = null
}
