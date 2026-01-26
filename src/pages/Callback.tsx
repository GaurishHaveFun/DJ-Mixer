import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { exchangeCodeForToken } from '../services/spotify/auth'

export default function Callback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setTokens } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setError(`Authorization failed: ${errorParam}`)
        return
      }

      if (!code) {
        setError('No authorization code received')
        return
      }

      try {
        const tokens = await exchangeCodeForToken(code)
        setTokens(tokens.accessToken, tokens.refreshToken)
        navigate('/')
      } catch (err) {
        setError((err as Error).message)
      }
    }

    handleCallback()
  }, [searchParams, setTokens, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-red-400 text-xl font-semibold mb-2">Authentication Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-spotify-green hover:bg-green-400 text-black font-semibold py-2 px-6 rounded-full transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green mb-4"></div>
      <p className="text-spotify-lightgray">Connecting to Spotify...</p>
    </div>
  )
}
