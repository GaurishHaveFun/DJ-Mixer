import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useSoundCloudStore } from '../store/soundCloudStore'
import { initiateLogin } from '../services/spotify/auth'

export default function Login() {
  const navigate = useNavigate()
  const { accessToken, isLoading } = useAuthStore()
  const { setSoundCloudMode } = useSoundCloudStore()

  useEffect(() => {
    if (accessToken) {
      navigate('/')
    }
  }, [accessToken, navigate])

  const handleLogin = () => {
    initiateLogin()
  }

  const handleSoundCloudMode = () => {
    setSoundCloudMode(true)
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo / Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            Spotify <span className="text-spotify-green">DJ</span>
          </h1>
          <p className="text-spotify-lightgray text-lg">
            Mix your favorite tracks with crossfade and DJ effects
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 text-left bg-spotify-darkgray rounded-lg p-6">
          <h2 className="text-white font-semibold mb-4">Features:</h2>
          <ul className="space-y-2 text-spotify-lightgray">
            <li className="flex items-center gap-2">
              <span className="text-spotify-green">✓</span>
              Dual deck mixing interface
            </li>
            <li className="flex items-center gap-2">
              <span className="text-spotify-green">✓</span>
              Smooth crossfade transitions
            </li>
            <li className="flex items-center gap-2">
              <span className="text-spotify-green">✓</span>
              DJ sound effects (scratch, airhorn, etc.)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-spotify-green">✓</span>
              Both decks can play simultaneously
            </li>
          </ul>
        </div>

        {/* SoundCloud Mode Button - Primary */}
        <button
          onClick={handleSoundCloudMode}
          className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-4 px-8 rounded-full text-lg transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.102-.1m-.899.828c-.06 0-.091.037-.104.094l-.152 1.332.152 1.283c.013.053.044.094.104.094s.09-.04.104-.094l.182-1.283-.182-1.332c-.014-.057-.044-.094-.104-.094m1.93-.933c-.061 0-.11.05-.113.109l-.19 2.26.19 2.197c.003.06.052.109.113.109.06 0 .109-.049.116-.109l.213-2.197-.213-2.26c-.007-.06-.056-.109-.116-.109m.862-.099c-.072 0-.12.06-.124.12l-.17 2.369.17 2.195c.004.067.052.12.124.12.071 0 .12-.053.127-.12l.19-2.195-.19-2.369c-.007-.066-.056-.12-.127-.12m.906-.114c-.08 0-.14.066-.145.139l-.152 2.369.152 2.195c.005.074.065.139.145.139.079 0 .138-.065.146-.139l.17-2.195-.17-2.369c-.008-.073-.067-.139-.146-.139m.924-.115c-.09 0-.158.074-.163.156l-.135 2.369.135 2.195c.005.083.073.156.163.156.089 0 .157-.073.165-.156l.152-2.195-.152-2.369c-.008-.082-.076-.156-.165-.156m.974-.016c-.098 0-.174.08-.179.172l-.12 2.385.12 2.195c.005.091.081.172.179.172.097 0 .173-.081.181-.172l.136-2.195-.136-2.385c-.008-.092-.084-.172-.181-.172m.996.022c-.107 0-.191.088-.196.188l-.105 2.363.105 2.195c.005.1.089.188.196.188.106 0 .19-.088.198-.188l.12-2.195-.12-2.363c-.008-.1-.092-.188-.198-.188m1.04-.074c-.116 0-.208.095-.213.204l-.093 2.437.093 2.195c.005.108.097.204.213.204.116 0 .207-.096.215-.204l.105-2.195-.105-2.437c-.008-.109-.099-.204-.215-.204m1.063.074c-.124 0-.223.103-.228.22l-.078 2.363.078 2.195c.005.117.104.22.228.22.123 0 .222-.103.23-.22l.09-2.195-.09-2.363c-.008-.117-.107-.22-.23-.22m1.086-.074c-.133 0-.24.112-.245.237l-.064 2.437.064 2.195c.005.125.112.237.245.237.133 0 .24-.112.248-.237l.072-2.195-.072-2.437c-.008-.125-.115-.237-.248-.237m7.622.795c-.4 0-.78.08-1.125.224-.232-2.624-2.454-4.688-5.182-4.688-.664 0-1.302.125-1.887.352-.22.086-.278.172-.28.34v9.447c.002.174.138.32.313.338h8.161c1.546 0 2.799-1.256 2.799-2.806s-1.253-2.807-2.799-2.807"/>
          </svg>
          Use SoundCloud
        </button>

        <p className="mt-3 text-sm text-spotify-lightgray">
          No account needed - paste any public SoundCloud URL
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-spotify-lightgray text-sm">or</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Spotify Login Button - Secondary */}
        <button
          onClick={handleLogin}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-full text-lg transition-colors"
        >
          Connect with Spotify
        </button>

        {/* Note */}
        <p className="mt-3 text-sm text-spotify-lightgray/70">
          Spotify requires Premium and app registration
        </p>
      </div>
    </div>
  )
}
