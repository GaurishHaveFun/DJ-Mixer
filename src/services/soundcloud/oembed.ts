// SoundCloud oEmbed API for fetching track metadata without API key
// Docs: https://developers.soundcloud.com/docs/oembed

import type { SpotifyTrack } from '../spotify/api'

interface SoundCloudOEmbedResponse {
  version: number
  type: string
  provider_name: string
  provider_url: string
  height: number
  width: string
  title: string
  description: string
  thumbnail_url: string
  html: string
  author_name: string
  author_url: string
}

// Validate that a URL is a SoundCloud track URL
export function isValidSoundCloudUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === 'soundcloud.com' ||
      parsed.hostname === 'www.soundcloud.com' ||
      parsed.hostname === 'm.soundcloud.com'
    )
  } catch {
    return false
  }
}

// Extract track ID from oEmbed HTML (used internally)
function extractTrackIdFromHtml(html: string): string | null {
  // The iframe src contains tracks/ID
  const match = html.match(/tracks(?:%2F|\/)(\d+)/)
  return match ? match[1] : null
}

// Fetch track info via oEmbed API
export async function fetchTrackInfo(trackUrl: string): Promise<SpotifyTrack | null> {
  if (!isValidSoundCloudUrl(trackUrl)) {
    throw new Error('Invalid SoundCloud URL')
  }

  const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`

  try {
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch track info: ${response.status}`)
    }

    const data: SoundCloudOEmbedResponse = await response.json()

    // Extract track ID from the embed HTML
    const trackId = extractTrackIdFromHtml(data.html)

    // Parse title - usually "Track Name by Artist Name"
    // or just the track name if format differs
    let trackName = data.title
    let artistName = data.author_name

    // Some titles are formatted as "Track Name by Artist Name"
    const byMatch = data.title.match(/^(.+?)\s+by\s+(.+)$/i)
    if (byMatch) {
      trackName = byMatch[1]
      artistName = byMatch[2]
    }

    // Build SpotifyTrack-compatible object
    const track: SpotifyTrack = {
      id: `sc-${trackId || Date.now()}`,
      uri: trackUrl, // Use the URL as the URI for SoundCloud
      name: trackName,
      duration_ms: 0, // Will be updated by widget when loaded
      artists: [{ name: artistName }],
      album: {
        name: 'SoundCloud',
        images: [
          {
            url: data.thumbnail_url || 'https://placehold.co/300x300/FF5500/ffffff?text=SoundCloud',
            width: 300,
            height: 300,
          },
          {
            url: data.thumbnail_url
              ? data.thumbnail_url.replace('-t500x500', '-t67x67')
              : 'https://placehold.co/64x64/FF5500/ffffff?text=SC',
            width: 64,
            height: 64,
          },
        ],
      },
    }

    return track
  } catch (error) {
    console.error('Error fetching SoundCloud track info:', error)
    throw error
  }
}

// Build the widget iframe URL from a track URL
export function getWidgetUrl(trackUrl: string): string {
  const encodedUrl = encodeURIComponent(trackUrl)
  return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`
}
