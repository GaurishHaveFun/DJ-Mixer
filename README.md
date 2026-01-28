# Spotify DJ

A web-based DJ mixing application that lets you mix tracks with crossfade controls, dual decks, and sound effects. Works with SoundCloud (no account required) or Spotify (Premium required).

## Features

- **Dual Deck Interface** - Load and control two tracks simultaneously
- **Crossfader** - Smooth volume transitions between decks with equal-power crossfade curve
- **Auto-Transitions** - One-click transitions with animated crossfader and random DJ effects
- **DJ Sound Effects** - Scratch, Air Horn, Rewind, Drop, Siren, and Laser effects
- **Keyboard Shortcuts** - Trigger effects with keyboard keys (S, A, R, D, Q, L)
- **Volume Controls** - Independent deck volumes plus master volume
- **SoundCloud Integration** - Paste any public SoundCloud URL to play (no account needed)
- **Spotify Integration** - Connect with your Spotify Premium account to mix your library

## Screenshots

The interface includes:
- Two deck panels with track info, progress bars, and play/pause controls
- A mixer panel with vertical volume faders and horizontal crossfader
- An effects pad with clickable buttons
- A track browser for loading tracks to either deck

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Spotify-DJ

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Configuration (Optional - For Spotify)

If you want to use Spotify integration, you'll need to:

1. Create a Spotify Developer account at https://developer.spotify.com
2. Create a new application in the dashboard
3. Add `http://localhost:5173/callback` as a redirect URI
4. Copy `.env.example` to `.env` and add your credentials:

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_REDIRECT_URI=http://localhost:5173/callback
```

Note: Spotify integration requires a Spotify Premium subscription.

## Usage

### SoundCloud Mode (Recommended)

1. Click "Use SoundCloud" on the login page
2. Paste any public SoundCloud track URL in the browser section
3. Click "A" or "B" to load the track to that deck
4. Press play on either deck to start mixing

### Spotify Mode

1. Click "Connect with Spotify" and authorize the app
2. Search for tracks or browse your playlists
3. Click "A" or "B" to load tracks to the decks
4. Mix away!

### Mixing Controls

| Control | Description |
|---------|-------------|
| **Play/Pause** | Click the center button on each deck |
| **Seek** | Click on the progress bar to jump to position |
| **Crossfader** | Drag left/right to blend between decks |
| **CUT A/B** | Instantly cut to deck A or B |
| **CENTER** | Set crossfader to 50/50 mix |
| **TRANS A/B** | Auto-transition with effect to target deck |
| **Deck Volume** | Vertical sliders (A, M, B) |
| **Master Volume** | Middle vertical slider (M) |

### Effects Keyboard Shortcuts

| Key | Effect |
|-----|--------|
| S | Scratch |
| A | Air Horn |
| R | Rewind |
| D | Drop |
| Q | Siren |
| L | Laser |

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Web Audio API** - Sound effects generation
- **SoundCloud Widget API** - Audio playback
- **Spotify Web Playback SDK** - Premium playback (optional)

## Project Structure

```
src/
├── components/
│   ├── browser/       # Track browser and search
│   ├── deck/          # Deck component with playback controls
│   ├── effects/       # Effects pad UI
│   └── mixer/         # Mixer panel with crossfader
├── pages/
│   ├── Login.tsx      # Login/mode selection page
│   ├── DJ.tsx         # Main DJ interface
│   └── Callback.tsx   # Spotify OAuth callback
├── services/
│   ├── audio/         # Web Audio effects and crossfade
│   ├── soundcloud/    # SoundCloud oEmbed API
│   ├── spotify/       # Spotify API and playback
│   └── playbackController.ts  # Cross-component playback control
├── store/
│   ├── authStore.ts       # Spotify authentication state
│   ├── demoStore.ts       # Demo mode state
│   ├── playerStore.ts     # Deck and mixer state
│   └── soundCloudStore.ts # SoundCloud mode state
└── utils/
    └── pkce.ts        # PKCE auth utilities
```

## Known Limitations

- **SoundCloud**: Only one deck can play at a time (Widget API limitation). Use the auto-transition buttons for smooth switches.
- **Spotify**: Requires Premium subscription for playback SDK.
- **Effects**: Currently using synthetic Web Audio sounds. Could be replaced with audio samples.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

MIT
