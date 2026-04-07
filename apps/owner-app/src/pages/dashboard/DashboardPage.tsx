import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { financesApi, restaurantApi, aiApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'

interface DashboardData {
  today: string
  revenue: number
  costs: number
  expenses: number
  netProfit: number
  ordersCount: number
  avgOrderValue: number
  weekTrend: { date: string; revenue: number }[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function DashboardPage() {
  const { restaurant, user } = useAuthStore()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [latestSummary, setLatestSummary] = useState<any>(null)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [dashRes, restRes, summaryRes] = await Promise.all([
        financesApi.getDashboard(),
        restaurantApi.getMe(),
        aiApi.getLatestSummary().catch(() => ({ data: { data: null } })),
      ])
      setData(dashRes.data.data)
      setIsOpen(restRes.data.data.isOpen)
      setLatestSummary(summaryRes.data.data)
    } catch {
      // silencioso en dashboard
    } finally {
      setLoading(false)
    }
  }

  const toggleOpen = async () => {
    await restaurantApi.toggleOpen()
    setIsOpen(prev => !prev)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="font-body text-texto-tenue text-sm">Hola, {user?.name?.split(' ')[0]}</p>
          <h1 className="font-ui font-bold text-texto-oscuro text-2xl">{restaurant?.name}</h1>
        </div>
        <button
          onClick={toggleOpen}
          className={`px-4 py-2 rounded-pill font-ui font-semibold text-sm transition-colors ${
            isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
        </button>
      </div>

      {/* Ganancia del día — número grande */}
      <Card highlight className="mb-4 text-center">
        <p className="font-body text-texto-tenue text-sm mb-1">Ganancia de hoy</p>
        <p className={`font-ui font-bold text-4xl ${(data?.netProfit || 0) >= 0 ? 'text-naranja' : 'text-red-500'}`}>
          {fmt(data?.netProfit || 0)}
        </p>
        <p className="font-body text-texto-tenue text-xs mt-1">{data?.today}</p>
      </Card>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="text-center">
          <p className="font-body text-texto-tenue text-xs">Ingresos</p>
          <p className="font-ui font-bold text-lg text-texto-oscuro">{fmt(data?.revenue || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="font-body text-texto-tenue text-xs">Costos</p>
          <p className="font-ui font-bold text-lg text-texto-oscuro">{fmt(data?.costs || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="font-body text-texto-tenue text-xs">Gastos</p>
          <p className="font-ui font-bold text-lg text-texto-oscuro">{fmt(data?.expenses || 0)}</p>
        </Card>
      </div>

      {/* Pedidos del día */}
      <Card className="mb-4 flex justify-between items-center" onClick={() => navigate('/orders')}>
        <div>
          <p className="font-body text-texto-tenue text-sm">Pedidos hoy</p>
          <p className="font-ui font-bold text-2xl text-texto-oscuro">{data?.ordersCount || 0}</p>
        </div>
        <div className="text-right">
          <p className="font-body text-texto-tenue text-sm">Promedio</p>
          <p className="font-ui font-semibold text-naranja">{fmt(data?.avgOrderValue || 0)}</p>
        </div>
      </Card>

      {/* Tendencia semanal */}
      {data?.weekTrend && data.weekTrend.length > 0 && (
        <Card className="mb-4">
          <p className="font-body text-texto-tenue text-sm mb-3">Últimos 7 días</p>
          <div className="flex items-end gap-1 h-16">
            {data.weekTrend.map((day, i) => {
              const maxRev = Math.max(...data.weekTrend.map(d => d.revenue), 1)
              const height = (day.revenue / maxRev) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-naranja rounded-sm"
                    style={{ height: `${height}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                  />
                  <span className="text-[9px] text-texto-tenue">{day.date.slice(8)}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => navigate('/finances')}
          className="bg-blanco-calido rounded-card p-4 text-left shadow-card active:scale-95 transition-transform"
        >
          <span className="text-2xl">💰</span>
          <p className="font-ui font-semibold text-texto-oscuro text-sm mt-1">Finanzas</p>
          <p className="font-body text-texto-tenue text-xs">Gastos y reportes</p>
        </button>
        <button
          onClick={() => navigate('/ai')}
          className="bg-azul-noche rounded-card p-4 text-left active:scale-95 transition-transform"
        >
          <span className="text-2xl">🤖</span>
          <p className="font-ui font-semibold text-ambar text-sm mt-1">Parce IA</p>
          <p className="font-body text-texto-tenue text-xs">Tu copiloto</p>
        </button>
      </div>

      {/* Resumen IA */}
      {latestSummary?.content?.message && (
        <Card className="mb-4 bg-azul-noche">
          <div className="flex items-start gap-2">
            <span className="text-ambar text-lg">🤖</span>
            <div>
              <p className="font-ui font-semibold text-ambar text-sm mb-1">Parce IA</p>
              <p className="font-body text-crema text-sm leading-relaxed">{latestSummary.content.message}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
