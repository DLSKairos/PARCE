import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/auth.store'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { OrdersPage } from './pages/orders/OrdersPage'
import { MenuPage } from './pages/menu/MenuPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { FinancesPage } from './pages/finances/FinancesPage'
import { AIPage } from './pages/ai/AIPage'
import { SettingsPage } from './pages/settings/SettingsPage'
import { BottomNav } from './components/ui/BottomNav'
import { useSocket } from './hooks/useSocket'
import { useOffline } from './hooks/useOffline'

function AppLayout({ children }: { children: React.ReactNode }) {
  useSocket()
  const { isOnline, pendingSyncCount } = useOffline()
  return (
    <div className="min-h-screen bg-crema-suave pb-20 font-body">
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center text-sm py-2 px-4 font-body">
          Sin conexión &bull; {pendingSyncCount > 0 ? `${pendingSyncCount} acciones pendientes` : 'Modo offline'}
        </div>
      )}
      {children}
      <BottomNav />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FDF8F0',
            color: '#1A1208',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(20,27,45,0.08)',
          },
          success: { iconTheme: { primary: '#C4500A', secondary: '#FDF8F0' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/menu" element={<MenuPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/finances" element={<FinancesPage />} />
                  <Route path="/ai" element={<AIPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
