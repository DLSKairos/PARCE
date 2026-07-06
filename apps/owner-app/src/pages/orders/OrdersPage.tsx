import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { ordersApi } from '../../services/api'
import { useOrdersStore } from '../../stores/orders.store'
import { useOfflineStore } from '../../stores/offline.store'
import { useOffline } from '../../hooks/useOffline'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

// El siguiente estado depende de la modalidad: solo los domicilios pasan por "En camino"
const getNextStatus = (order: { status: string; orderType: string }): string | null => {
  switch (order.status) {
    case 'PENDING':    return 'CONFIRMED'
    case 'CONFIRMED':  return 'PREPARING'
    case 'PREPARING':  return 'READY'
    case 'READY':      return order.orderType === 'DELIVERY' ? 'IN_TRANSIT' : 'DELIVERED'
    case 'IN_TRANSIT': return 'DELIVERED'
    default:           return null
  }
}

const NEXT_LABEL: Record<string, string> = {
  CONFIRMED:  'Confirmar',
  PREPARING:  'Preparar',
  READY:      'Listo',
  IN_TRANSIT: 'En camino',
  DELIVERED:  'Entregado',
}

const ORDER_TYPE_META: Record<string, { icon: string; label: string }> = {
  DELIVERY: { icon: '🛵', label: 'Domicilio' },
  PICKUP:   { icon: '🏪', label: 'Recoger' },
  DINE_IN:  { icon: '🍽️', label: 'En tienda' },
}

const STATUS_TABS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED']

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function OrdersPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('PENDING')
  const [updating, setUpdating] = useState<string | null>(null)
  const { orders, setOrders, updateOrder, clearNewOrderAlert } = useOrdersStore()
  const { addAction } = useOfflineStore()
  const { isOnline } = useOffline()

  useEffect(() => {
    clearNewOrderAlert()
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data } = await ordersApi.getAll()
      setOrders(data.data)
    } catch {
      toast.error('Error cargando pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (order: any) => {
    const newStatus = getNextStatus(order)
    if (!newStatus) return

    setUpdating(order.id)

    if (!isOnline) {
      addAction({ type: 'UPDATE_ORDER_STATUS', payload: { orderId: order.id, status: newStatus } })
      updateOrder({ ...order, status: newStatus })
      toast.success('Guardado offline. Se sincronizará cuando tengas conexión.')
      setUpdating(null)
      return
    }

    try {
      const { data } = await ordersApi.updateStatus(order.id, newStatus)
      updateOrder(data.data)
      toast.success(`Pedido: ${NEXT_LABEL[newStatus]}`)
    } catch {
      toast.error('Error actualizando pedido')
    } finally {
      setUpdating(null)
    }
  }

  const handleMarkPaid = async (orderId: string) => {
    setUpdating(orderId)
    try {
      const { data } = await ordersApi.markPaid(orderId)
      updateOrder(data.data)
      toast.success('Pedido cobrado 💵')
    } catch {
      toast.error('Error marcando el pago')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = orders.filter(o => o.status === activeTab)
  const countByStatus = (status: string) => orders.filter(o => o.status === status).length

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
      <h1 className="font-ui font-bold text-texto-oscuro text-2xl mb-4">Pedidos</h1>

      {/* Tabs de estado */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-pill text-xs font-ui font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-naranja text-white'
                : 'bg-white text-texto-tenue border border-gray-200'
            }`}
          >
            <Badge status={tab} className="bg-transparent border-0 p-0 text-inherit" />
            {countByStatus(tab) > 0 && <span className="ml-1">({countByStatus(tab)})</span>}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-texto-tenue font-body">
            <p className="text-4xl mb-2">🍕</p>
            <p>No hay pedidos en este estado</p>
          </div>
        ) : (
          filtered.map(order => {
            const typeMeta = ORDER_TYPE_META[order.orderType] || ORDER_TYPE_META.PICKUP
            const pendingCharge = order.payment?.method === 'CASH' && order.payment?.status === 'PENDING'
            const nextStatus = getNextStatus(order)
            return (
            <Card key={order.id} className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-ui font-bold text-texto-oscuro">Pedido #{order.orderNumber}</p>
                  <p className="font-body text-texto-oscuro text-xs mt-0.5">
                    {typeMeta.icon} {typeMeta.label}
                    {order.tableLabel && <span className="font-semibold"> &bull; {order.tableLabel}</span>}
                  </p>
                  <p className="font-body text-texto-tenue text-sm">{order.customerName} &bull; {order.customerPhone}</p>
                  {order.customerAddress && (
                    <p className="font-body text-texto-tenue text-xs">{order.customerAddress}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge status={order.status} />
                  <div className="mt-1">
                    {pendingCharge ? (
                      <Badge label="🟠 Cobro pendiente" variant="warning" />
                    ) : order.payment?.status === 'APPROVED' ? (
                      <Badge label="✅ Pagado" variant="success" />
                    ) : null}
                  </div>
                  <p className="font-ui font-bold text-naranja mt-1">{fmt(order.total)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-body">
                    <span className="text-texto-oscuro">{item.quantity}x {item.menuItemName}</span>
                    <span className="text-texto-tenue">{fmt(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="text-xs font-body text-texto-tenue bg-crema-suave px-3 py-2 rounded-card">
                  📝 {order.notes}
                </p>
              )}

              <div className="flex flex-col gap-2">
                {nextStatus && (
                  <Button
                    onClick={() => handleStatusUpdate(order)}
                    loading={updating === order.id}
                    variant={order.status === 'READY' ? 'secondary' : 'primary'}
                    size="sm"
                    fullWidth
                  >
                    {NEXT_LABEL[nextStatus]}
                  </Button>
                )}
                {pendingCharge && order.status !== 'CANCELLED' && (
                  <Button
                    onClick={() => handleMarkPaid(order.id)}
                    loading={updating === order.id}
                    variant="secondary"
                    size="sm"
                    fullWidth
                  >
                    💵 Marcar como pagado
                  </Button>
                )}
              </div>
            </Card>
          )})
        )}
      </div>
    </div>
  )
}
