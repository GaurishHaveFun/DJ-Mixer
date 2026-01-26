import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { usePlayerStore, type DeckId } from '../../store/playerStore'
import { useDemoStore, DEMO_TRACKS } from '../../store/demoStore'
import { useSoundCloudStore } from '../../store/soundCloudStore'
import {
  searchTracks,
  getUserPlaylists,
  getPlaylistTracks,
  formatDuration,
  getAlbumArt,
  type SpotifyTrack,
  type SpotifyPlaylist,
} from '../../services/spotify/api'
import { fetchTrackInfo, isValidSoundCloudUrl } from '../../services/soundcloud/oembed'

export default function TrackBrowser() {
  const { accessToken } = useAuthStore()
  const { setDeckTrack } = usePlayerStore()
  const { isDemo } = useDemoStore()
  const { isSoundCloud, trackHistory, addToHistory } = useSoundCloudStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [tracks, setTracks] = useState<SpotifyTrack[]>(isDemo ? DEMO_TRACKS : [])
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'search' | 'playlists' | 'url'>('url')

  // Set appropriate default tab based on mode
  useEffect(() => {
    if (isSoundCloud) {
      setActiveTab('url')
      setTracks(trackHistory)
    } else if (isDemo) {
      setActiveTab('search')
      setTracks(DEMO_TRACKS)
    } else {
      setActiveTab('search')
      setTracks([])
    }
  }, [isSoundCloud, isDemo, trackHistory])

  // Update tracks when history changes in SoundCloud mode
  useEffect(() => {
    if (isSoundCloud && activeTab === 'url') {
      setTracks(trackHistory)
    }
  }, [isSoundCloud, activeTab, trackHistory])

  // Load user playlists on mount (only in Spotify mode)
  useEffect(() => {
    if (!accessToken || isDemo || isSoundCloud) return

    const loadPlaylists = async () => {
      try {
        const userPlaylists = await getUserPlaylists(accessToken)
        setPlaylists(userPlaylists)
      } catch (error) {
        console.error('Failed to load playlists:', error)
      }
    }

    loadPlaylists()
  }, [accessToken, isDemo, isSoundCloud])

  // Search tracks (demo mode filters local tracks)
  useEffect(() => {
    if (activeTab !== 'search') return

    if (isDemo) {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const filtered = DEMO_TRACKS.filter(
          (track) =>
            track.name.toLowerCase().includes(query) ||
            track.artists.some((a) => a.name.toLowerCase().includes(query))
        )
        setTracks(filtered)
      } else {
        setTracks(DEMO_TRACKS)
      }
      return
    }

    if (!accessToken || !searchQuery.trim()) return

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const results = await searchTracks(accessToken, searchQuery)
        setTracks(results)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [accessToken, searchQuery, activeTab, isDemo])

  // Load playlist tracks
  const handlePlaylistSelect = async (playlistId: string) => {
    if (!accessToken || isDemo || isSoundCloud) return

    setSelectedPlaylist(playlistId)
    setIsLoading(true)

    try {
      const playlistTracks = await getPlaylistTracks(accessToken, playlistId)
      setTracks(playlistTracks)
    } catch (error) {
      console.error('Failed to load playlist tracks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle SoundCloud URL submission
  const handleUrlSubmit = async (targetDeck: DeckId) => {
    const url = urlInput.trim()
    setUrlError(null)

    if (!url) {
      setUrlError('Please enter a SoundCloud URL')
      return
    }

    if (!isValidSoundCloudUrl(url)) {
      setUrlError('Please enter a valid SoundCloud URL')
      return
    }

    setIsLoading(true)

    try {
      const track = await fetchTrackInfo(url)
      if (track) {
        // Set a default duration since oEmbed doesn't provide it
        // Widget will update with real duration
        if (track.duration_ms === 0) {
          track.duration_ms = 180000 // 3 minutes default
        }
        addToHistory(track)
        setDeckTrack(targetDeck, track)
        setUrlInput('')
      }
    } catch (error) {
      console.error('Failed to load track:', error)
      setUrlError('Failed to load track. Make sure the URL is public and accessible.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadToDeck = (track: SpotifyTrack, deck: DeckId) => {
    setDeckTrack(deck, track)
  }

  return (
    <div className="bg-spotify-darkgray rounded-lg p-4 h-64 flex flex-col">
      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {isSoundCloud ? (
          <>
            <button
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === 'url'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Paste URL
            </button>
            {trackHistory.length > 0 && (
              <span className="text-xs text-spotify-lightgray self-center ml-2">
                {trackHistory.length} track{trackHistory.length !== 1 ? 's' : ''} in history
              </span>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === 'search'
                  ? 'bg-spotify-green text-black'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {isDemo ? 'Demo Tracks' : 'Search'}
            </button>
            {!isDemo && (
              <button
                onClick={() => setActiveTab('playlists')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === 'playlists'
                    ? 'bg-spotify-green text-black'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Playlists
              </button>
            )}
          </>
        )}
      </div>

      {/* SoundCloud URL Input */}
      {isSoundCloud && activeTab === 'url' && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value)
                setUrlError(null)
              }}
              placeholder="https://soundcloud.com/artist/track"
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={() => handleUrlSubmit('A')}
              disabled={isLoading}
              className="px-4 py-2 bg-deck-a text-black font-bold rounded-lg hover:bg-deck-a/80 disabled:opacity-50"
            >
              {isLoading ? '...' : 'A'}
            </button>
            <button
              onClick={() => handleUrlSubmit('B')}
              disabled={isLoading}
              className="px-4 py-2 bg-deck-b text-black font-bold rounded-lg hover:bg-deck-b/80 disabled:opacity-50"
            >
              {isLoading ? '...' : 'B'}
            </button>
          </div>
          {urlError && (
            <p className="text-red-400 text-xs mt-2">{urlError}</p>
          )}
          <p className="text-spotify-lightgray text-xs mt-2">
            Paste any public SoundCloud track URL and click A or B to load it
          </p>
        </div>
      )}

      {/* Search Input (for demo/spotify modes) */}
      {!isSoundCloud && activeTab === 'search' && (
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isDemo ? 'Filter demo tracks...' : 'Search for tracks...'}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-spotify-green"
          />
        </div>
      )}

      {/* Playlists Selector */}
      {activeTab === 'playlists' && !isDemo && !isSoundCloud && (
        <div className="mb-4">
          <select
            value={selectedPlaylist || ''}
            onChange={(e) => handlePlaylistSelect(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-spotify-green"
          >
            <option value="">Select a playlist...</option>
            {playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name} ({playlist.tracks.total} tracks)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && !isSoundCloud ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-spotify-green"></div>
          </div>
        ) : tracks.length > 0 ? (
          <div className="space-y-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 transition-colors group"
              >
                {/* Album Art */}
                <img
                  src={getAlbumArt(track, 'small')}
                  alt={track.album.name}
                  className="w-10 h-10 rounded"
                />

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{track.name}</p>
                  <p className="text-spotify-lightgray text-xs truncate">
                    {track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>

                {/* Duration */}
                <span className="text-spotify-lightgray text-xs">
                  {formatDuration(track.duration_ms)}
                </span>

                {/* Load to Deck Buttons */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleLoadToDeck(track, 'A')}
                    className="px-3 py-1 bg-deck-a text-black text-xs font-bold rounded hover:bg-deck-a/80"
                  >
                    A
                  </button>
                  <button
                    onClick={() => handleLoadToDeck(track, 'B')}
                    className="px-3 py-1 bg-deck-b text-black text-xs font-bold rounded hover:bg-deck-b/80"
                  >
                    B
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-spotify-lightgray">
            {isSoundCloud
              ? 'Paste a SoundCloud URL above to load tracks'
              : isDemo
              ? 'No matching demo tracks'
              : activeTab === 'search'
              ? 'Search for tracks to load'
              : 'Select a playlist to browse'}
          </div>
        )}
      </div>
    </div>
  )
}
