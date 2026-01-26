const BASE_URL = 'https://api.spotify.com/v1'

export interface SpotifyTrack {
  id: string
  uri: string
  name: string
  duration_ms: number
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string; width: number; height: number }>
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  images: Array<{ url: string }>
  tracks: {
    total: number
  }
}

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: Array<{ url: string }>
}

/**
 * Fetch current user profile
 */
export async function getCurrentUser(token: string): Promise<SpotifyUser> {
  const response = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user profile')
  }

  return response.json()
}

/**
 * Search for tracks
 */
export async function searchTracks(
  token: string,
  query: string,
  limit = 20
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: String(limit),
  })

  const response = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to search tracks')
  }

  const data = await response.json()
  return data.tracks.items
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(
  token: string,
  limit = 50
): Promise<SpotifyPlaylist[]> {
  const response = await fetch(`${BASE_URL}/me/playlists?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch playlists')
  }

  const data = await response.json()
  return data.items
}

/**
 * Get playlist tracks
 */
export async function getPlaylistTracks(
  token: string,
  playlistId: string,
  limit = 50
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `${BASE_URL}/playlists/${playlistId}/tracks?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch playlist tracks')
  }

  const data = await response.json()
  return data.items.map((item: { track: SpotifyTrack }) => item.track).filter(Boolean)
}

/**
 * Get track by ID
 */
export async function getTrack(token: string, trackId: string): Promise<SpotifyTrack> {
  const response = await fetch(`${BASE_URL}/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch track')
  }

  return response.json()
}

/**
 * Format duration from milliseconds to mm:ss
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Get album art URL (prefer medium size)
 */
export function getAlbumArt(track: SpotifyTrack, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const images = track.album.images
  if (!images.length) return ''

  // Images are typically: large (640), medium (300), small (64)
  if (size === 'small') return images[images.length - 1]?.url || images[0].url
  if (size === 'large') return images[0].url
  return images[1]?.url || images[0].url
}
