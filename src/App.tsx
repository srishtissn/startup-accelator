import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

// Pages
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import StartupDashboard from '@/pages/StartupDashboard'
import InvestorDashboard from '@/pages/InvestorDashboard'
import ProfileSetup from '@/pages/ProfileSetup'
import StartupProfile from '@/pages/StartupProfile'
import Marketplace from '@/pages/Marketplace'
import ChatPage from '@/pages/ChatPage'
import DiscoverPage from '@/pages/DiscoverPage'
import AIInsightsPage from '@/pages/AIInsightsPage'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'startup' | 'investor' }) {
  const { user, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (!user.full_name || !user.role) return <Navigate to="/setup" replace />

  return <>{children}</>
}

function DashboardRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  if (user.role === 'investor') return <Navigate to="/investor/dashboard" replace />
  return <Navigate to="/startup/dashboard" replace />
}

export default function App() {
  const { refreshUser } = useAuthStore()

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Profile setup */}
        <Route path="/setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

        {/* Dashboard redirect */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

        {/* Startup routes */}
        <Route path="/startup/dashboard" element={
          <ProtectedRoute role="startup"><StartupDashboard /></ProtectedRoute>
        } />
        <Route path="/startup/profile" element={
          <ProtectedRoute role="startup"><StartupProfile /></ProtectedRoute>
        } />
        <Route path="/startup/ai-insights" element={
          <ProtectedRoute role="startup"><AIInsightsPage /></ProtectedRoute>
        } />

        {/* Investor routes */}
        <Route path="/investor/dashboard" element={
          <ProtectedRoute role="investor"><InvestorDashboard /></ProtectedRoute>
        } />
        <Route path="/investor/discover" element={
          <ProtectedRoute role="investor"><DiscoverPage /></ProtectedRoute>
        } />

        {/* Shared routes */}
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
