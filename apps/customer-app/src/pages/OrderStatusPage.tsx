import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { publicApi } from '../services/api'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3100'

const STEPS = [
  { status: 'PENDING',   label: 'Pendiente',       icon: '🕐', desc: 'Tu pedido está esperando confirmación' },
  { status: 'CONFIRMED', label: 'Confirmado',       icon: '✅', desc: '¡El restaurante recibió tu pedido!' },
  { status: 'PREPARING', label: 'En preparación',   icon: '👨‍🍳', desc: 'Estamos preparando tu pedido' },
  { status: 'READY',     label: 'Listo',            icon: '🎉', desc: '¡Tu pedido está listo para recoger!' },
  { status: 'DELIVERED', label: 'Entregado',        icon: '😊', desc: '¡Buen provecho, parcero!' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId || !token) return

    loadOrder()

    const socket = io(`${WS_URL}/orders`, { transports: ['websocket'] })
    socket.on('connect', () => socket.emit('join-order-tracking', { orderId }))
    socket.on('order:updated', (updated: any) => {
      if (updated.id === orderId) setOrder(updated)
    })

    // Polling fallback cada 15s
    const interval = setInterval(loadOrder, 15000)

    return () => {
      socket.disconnect()
      clearInterval(interval)
    }
  }, [orderId, token])

  const loadOrder = async () => {
    try {
      const { data } = await publicApi.getOrder(orderId!, token)
      setOrder(data.data)
    } catch {
      // token inválido o pedido no encontrado
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-crema-suave flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-naranja/20 border-t-naranja rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-crema-suave flex items-center justify-center">
        <p className="font-body text-texto-tenue">Pedido no encontrado</p>
      </div>
    )
  }

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status)
  const currentStep = STEPS[currentStepIndex] || STEPS[0]

  return (
    <div className="min-h-screen bg-azul-noche">
      {/* Estado actual */}
      <div className="px-4 pt-8 pb-6 text-center">
        <p className="font-body text-texto-tenue text-sm mb-1">Pedido #{order.orderNumber}</p>
        <p className="text-5xl mb-2">{currentStep.icon}</p>
        <h1 className="font-ui font-bold text-crema text-2xl">{currentStep.label}</h1>
        <p className="font-body text-texto-tenue text-sm mt-1">{currentStep.desc}</p>
      </div>

      {/* Timeline de progreso */}
      <div className="px-6 mb-6">
        {STEPS.slice(0, -1).map((step, i) => (
          <div key={step.status} className="flex items-start gap-3 mb-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-ui font-bold ${
                i <= currentStepIndex ? 'bg-naranja text-white' : 'bg-azul-medio text-texto-tenue'
              }`}
            >
              {i < currentStepIndex ? '✓' : i === currentStepIndex ? '●' : '○'}
            </div>
            <div className="pt-1">
              <p className={`font-ui font-semibold text-sm ${i <= currentStepIndex ? 'text-crema' : 'text-texto-tenue'}`}>
                {step.label}
              </p>
              {i === currentStepIndex && (
                <p className="font-body text-texto-tenue text-xs">{step.desc}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen del pedido */}
      <div className="mx-4 bg-azul-medio rounded-card p-4 mb-4">
        <p className="font-ui font-semibold text-crema mb-2">Tu pedido</p>
        {order.items?.map((item: any, i: number) => (
          <div key={i} className="flex justify-between font-body text-sm text-texto-tenue mb-1">
            <span>{item.quantity}x {item.menuItemName}</span>
            <span>{fmt(item.subtotal)}</span>
          </div>
        ))}
        <div className="border-t border-azul-noche mt-2 pt-2 flex justify-between font-ui font-bold text-crema">
          <span>Total</span>
          <span>{fmt(order.total)}</span>
        </div>
      </div>

      {order.status === 'DELIVERED' && (
        <div className="px-4 text-center pb-8">
          <p className="font-display text-crema text-xl italic">¡Gracias por tu pedido!</p>
          <p className="font-body text-texto-tenue text-sm mt-1">by Kairos DLS Group S.A.S</p>
        </div>
      )}
    </div>
  )
}
