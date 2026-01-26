import { generateCodeVerifier, generateCodeChallenge } from '../../utils/pkce'

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:5173/callback'
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ')

const CODE_VERIFIER_KEY = 'spotify_code_verifier'
const TOKEN_KEY = 'spotify_token'
const REFRESH_TOKEN_KEY = 'spotify_refresh_token'
const EXPIRY_KEY = 'spotify_token_expiry'

/**
 * Initiate Spotify OAuth PKCE flow
 */
export async function initiateLogin(): Promise<void> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Store code verifier for the callback
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SCOPES,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY)

  if (!codeVerifier) {
    throw new Error('Code verifier not found. Please try logging in again.')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error_description || 'Failed to exchange code for token')
  }

  const data = await response.json()

  // Clear code verifier
  sessionStorage.removeItem(CODE_VERIFIER_KEY)

  // Store tokens
  localStorage.setItem(TOKEN_KEY, data.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000))

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error_description || 'Failed to refresh token')
  }

  const data = await response.json()

  // Store new tokens
  localStorage.setItem(TOKEN_KEY, data.access_token)
  if (data.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
  }
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000))

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
  }
}

/**
 * Get stored tokens
 */
export function getStoredTokens(): {
  accessToken: string | null
  refreshToken: string | null
  expiry: number | null
} {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    expiry: Number(localStorage.getItem(EXPIRY_KEY)) || null,
  }
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpired(): boolean {
  const expiry = Number(localStorage.getItem(EXPIRY_KEY))
  if (!expiry) return true
  // Consider expired if less than 5 minutes remaining
  return Date.now() > expiry - 5 * 60 * 1000
}

/**
 * Clear all stored tokens (logout)
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}
