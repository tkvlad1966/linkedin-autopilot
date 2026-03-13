import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useExtensionStore } from './store/extensionStore'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import { ToastProvider } from './components/ui/Toast'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Callback, Login, Signup } from './pages'
import { Campaigns } from './pages/Campaigns'
import { CampaignDetail } from './pages/CampaignDetail'
import { Leads } from './pages/Leads'
import { Posts } from './pages/Posts'

// ── Lazy page placeholders (will be replaced in later prompts) ──
function Placeholder({ name }: { name: string }) {
  return <div style={{ padding: 24 }}><h2>{name}</h2><p>Coming soon...</p></div>
}

function AnalyticsPage() { return <Placeholder name="Analytics" /> }
function SettingsPage() { return <Placeholder name="Settings" /> }

// ── Protected route guard ─────────────────────────────────────
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}

// ── App root ──────────────────────────────────────────────────
export function App() {
  const setSession = useAuthStore((s) => s.setSession)
  const checkConnection = useExtensionStore((s) => s.checkConnection)

  useEffect(() => {
    // Hydrate session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      },
    )

    return () => subscription.unsubscribe()
  }, [setSession])

  // Check extension connection on mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<Callback />} />

          {/* Protected dashboard routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Navigate to="/campaigns" replace />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />
              <Route path="leads" element={<Leads />} />
              <Route path="posts" element={<Posts />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
