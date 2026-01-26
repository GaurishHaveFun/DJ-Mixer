import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useDemoStore } from './store/demoStore'
import { useSoundCloudStore } from './store/soundCloudStore'
import Login from './pages/Login'
import Callback from './pages/Callback'
import DJ from './pages/DJ'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore()
  const { isDemo } = useDemoStore()
  const { isSoundCloud } = useSoundCloudStore()

  if (!accessToken && !isDemo && !isSoundCloud) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <div className="min-h-screen bg-spotify-black">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DJ />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
