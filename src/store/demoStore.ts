import { create } from 'zustand'
import type { SpotifyTrack } from '../services/spotify/api'

// Demo tracks with placeholder data
export const DEMO_TRACKS: SpotifyTrack[] = [
  {
    id: 'demo-1',
    uri: 'demo:track:1',
    name: 'Summer Vibes',
    duration_ms: 210000, // 3:30
    artists: [{ name: 'Demo Artist' }],
    album: {
      name: 'Demo Album',
      images: [
        { url: 'https://placehold.co/300x300/1DB954/ffffff?text=Track+1', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/1DB954/ffffff?text=1', width: 64, height: 64 },
      ],
    },
  },
  {
    id: 'demo-2',
    uri: 'demo:track:2',
    name: 'Night Drive',
    duration_ms: 245000, // 4:05
    artists: [{ name: 'DJ Demo' }],
    album: {
      name: 'Electronic Dreams',
      images: [
        { url: 'https://placehold.co/300x300/FF6B6B/ffffff?text=Track+2', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/FF6B6B/ffffff?text=2', width: 64, height: 64 },
      ],
    },
  },
  {
    id: 'demo-3',
    uri: 'demo:track:3',
    name: 'Bass Drop',
    duration_ms: 195000, // 3:15
    artists: [{ name: 'Beat Master' }],
    album: {
      name: 'Club Hits',
      images: [
        { url: 'https://placehold.co/300x300/4ECDC4/ffffff?text=Track+3', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/4ECDC4/ffffff?text=3', width: 64, height: 64 },
      ],
    },
  },
  {
    id: 'demo-4',
    uri: 'demo:track:4',
    name: 'Sunset Beach',
    duration_ms: 230000, // 3:50
    artists: [{ name: 'Chill Wave', name2: 'Sunset Collective' }].map(a => ({ name: a.name })),
    album: {
      name: 'Coastal Grooves',
      images: [
        { url: 'https://placehold.co/300x300/FF9F43/ffffff?text=Track+4', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/FF9F43/ffffff?text=4', width: 64, height: 64 },
      ],
    },
  },
  {
    id: 'demo-5',
    uri: 'demo:track:5',
    name: 'Techno Pulse',
    duration_ms: 280000, // 4:40
    artists: [{ name: 'Synth Lord' }],
    album: {
      name: 'Underground',
      images: [
        { url: 'https://placehold.co/300x300/9B59B6/ffffff?text=Track+5', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/9B59B6/ffffff?text=5', width: 64, height: 64 },
      ],
    },
  },
  {
    id: 'demo-6',
    uri: 'demo:track:6',
    name: 'Funk It Up',
    duration_ms: 205000, // 3:25
    artists: [{ name: 'Groove Machine' }],
    album: {
      name: 'Disco Revival',
      images: [
        { url: 'https://placehold.co/300x300/E74C3C/ffffff?text=Track+6', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/E74C3C/ffffff?text=6', width: 64, height: 64 },
      ],
    },
  },
  {
    id: 'demo-7',
    uri: 'demo:track:7',
    name: 'Midnight City',
    duration_ms: 260000, // 4:20
    artists: [{ name: 'Neon Dreams' }],
    album: {
      name: 'Synthwave',
      images: [
        { url: 'https://placehold.co/300x300/3498DB/ffffff?text=Track+7', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/3498DB/ffffff?text=7', width: 64, height: 64 },
      ],
    },
  },
  {
    id: 'demo-8',
    uri: 'demo:track:8',
    name: 'Deep House Journey',
    duration_ms: 320000, // 5:20
    artists: [{ name: 'House Master' }],
    album: {
      name: 'Ibiza Nights',
      images: [
        { url: 'https://placehold.co/300x300/1ABC9C/ffffff?text=Track+8', width: 300, height: 300 },
        { url: 'https://placehold.co/64x64/1ABC9C/ffffff?text=8', width: 64, height: 64 },
      ],
    },
  },
]

interface DemoState {
  isDemo: boolean
  setDemoMode: (isDemo: boolean) => void
}

export const useDemoStore = create<DemoState>((set) => ({
  isDemo: false,
  setDemoMode: (isDemo) => set({ isDemo }),
}))
