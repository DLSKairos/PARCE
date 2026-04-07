import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { inventoryApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

export function InventoryPage() {
  const [ingredients, setIngredients] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stockText, setStockText] = useState('')
  const [addingStock, setAddingStock] = useState(false)
  const [activeTab, setActiveTab] = useState<'stock' | 'alerts'>('stock')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [ingRes, alertRes] = await Promise.all([
        inventoryApi.getIngredients(),
        inventoryApi.getAlerts(),
      ])
      setIngredients(ingRes.data.data)
      setAlerts(alertRes.data.data)
    } catch {
      toast.error('Error cargando inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleStockEntry = async () => {
    if (!stockText.trim()) return
    setAddingStock(true)
    try {
      await inventoryApi.addStockEntry(stockText)
      toast.success('Entrada de stock registrada')
      setStockText('')
      loadData()
    } catch {
      toast.error('No pude entender eso. Prueba de nuevo.')
    } finally {
      setAddingStock(false)
    }
  }

  const getLevelColor = (stock: number, min: number) => {
    if (stock <= min) return 'bg-red-400'
    if (stock <= min * 1.5) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
      <h1 className="font-ui font-bold text-texto-oscuro text-2xl mb-4">Inventario</h1>

      {/* Entrada de stock por texto natural */}
      <Card className="mb-4 bg-azul-noche">
        <p className="font-ui font-semibold text-ambar text-sm mb-2">📦 Registrar llegada</p>
        <p className="font-body text-texto-tenue text-xs mb-3">
          Ej: "Llegaron 5 kilos de harina a $20.000"
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 bg-azul-medio border border-azul-noche text-crema placeholder-texto-tenue rounded-card text-sm font-body focus:outline-none focus:border-naranja"
            placeholder="Escribe qué llegó..."
            value={stockText}
            onChange={e => setStockText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStockEntry()}
          />
          <Button size="sm" onClick={handleStockEntry} loading={addingStock}>Registrar</Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['stock', 'alerts'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-pill text-sm font-ui font-semibold transition-colors ${
              activeTab === tab ? 'bg-naranja text-white' : 'bg-white text-texto-tenue border border-gray-200'
            }`}
          >
            {tab === 'stock' ? 'Stock' : `Alertas${alerts.length > 0 ? ` (${alerts.length})` : ''}`}
          </button>
        ))}
      </div>

      {activeTab === 'stock' ? (
        <div className="flex flex-col gap-2">
          {ingredients.length === 0 && (
            <p className="text-center py-8 text-texto-tenue font-body">Sin ingredientes registrados</p>
          )}
          {ingredients.map(ing => (
            <Card key={ing.id} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getLevelColor(Number(ing.stock), Number(ing.minStock))}`} />
              <div className="flex-1">
                <p className="font-ui font-semibold text-texto-oscuro text-sm">{ing.name}</p>
                <p className="font-body text-texto-tenue text-xs">Min: {ing.minStock} {ing.unit.toLowerCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-ui font-bold text-texto-oscuro">{Number(ing.stock).toFixed(2)}</p>
                <p className="font-body text-texto-tenue text-xs">{ing.unit.toLowerCase()}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.length === 0 ? (
            <p className="text-center py-8 text-texto-tenue font-body">Sin alertas activas ✅</p>
          ) : (
            alerts.map(alert => (
              <Card
                key={alert.id}
                className={`border-l-4 ${alert.type === 'LOW_STOCK' ? 'border-red-400' : 'border-yellow-400'}`}
              >
                <p className="font-ui font-semibold text-texto-oscuro text-sm">
                  {alert.type === 'LOW_STOCK' ? '⚠️ Stock bajo' : '⏰ Por vencer'}
                </p>
                <p className="font-body text-texto-tenue text-sm">{alert.message}</p>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
