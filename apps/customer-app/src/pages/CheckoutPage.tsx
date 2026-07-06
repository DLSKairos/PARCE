import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { publicApi } from '../services/api'
import { useCartStore } from '../stores/cart.store'

type OrderType = 'PICKUP' | 'DELIVERY' | 'DINE_IN'

const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: 'PICKUP',   label: '🏪 Recoger' },
  { id: 'DELIVERY', label: '🛵 Domicilio' },
  { id: 'DINE_IN',  label: '🍽️ En tienda' },
]

const GATEWAY_METHODS = [
  { id: 'NEQUI',     label: 'Nequi',     icon: '📱' },
  { id: 'DAVIPLATA', label: 'Daviplata', icon: '💳' },
  { id: 'PSE',       label: 'PSE',       icon: '🏦' },
  { id: 'CARD',      label: 'Tarjeta',   icon: '💳' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, restaurantId, tables, presetTable, total, clear } = useCartStore()
  const [form, setForm] = useState({ customerName: '', customerPhone: '', customerAddress: '', notes: '' })
  const [orderType, setOrderType] = useState<OrderType>(presetTable ? 'DINE_IN' : 'PICKUP')

  // Si llegó por QR de mesa (?mesa=N), preseleccionarla
  const matchPresetTable = () => {
    if (!presetTable || tables.length === 0) return ''
    const match = tables.find(
      t => t.name === presetTable || t.name === `Mesa ${presetTable}` || String(t.position) === presetTable,
    )
    return match?.id || ''
  }
  const [tableId, setTableId] = useState(matchPresetTable())
  const [tableLabel, setTableLabel] = useState(tables.length === 0 ? (presetTable || '') : '')
  const [paymentMethod, setPaymentMethod] = useState('NEQUI')
  const [loading, setLoading] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleOrderType = (type: OrderType) => {
    setOrderType(type)
    // El pago en restaurante no aplica para domicilios
    if (type === 'DELIVERY' && paymentMethod === 'CASH') setPaymentMethod('NEQUI')
  }

  const inputClass =
    'px-4 py-3 bg-crema-suave border border-gray-200 rounded-card font-body text-sm text-texto-oscuro placeholder-texto-tenue focus:outline-none focus:border-naranja'

  const handleOrder = async () => {
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error('Completa tu nombre y teléfono')
      return
    }
    if (orderType === 'DELIVERY' && !form.customerAddress.trim()) {
      toast.error('Ingresa la dirección de entrega')
      return
    }
    if (orderType === 'DINE_IN' && tables.length > 0 && !tableId) {
      toast.error('Selecciona tu mesa')
      return
    }
    if (orderType === 'DINE_IN' && tables.length === 0 && !tableLabel.trim()) {
      toast.error('Escribe el número de tu mesa')
      return
    }
    if (!restaurantId) {
      toast.error('Error: restaurante no identificado')
      return
    }

    setLoading(true)
    try {
      const { data } = await publicApi.createOrder({
        restaurantId,
        orderType,
        ...(orderType === 'DINE_IN'
          ? tables.length > 0
            ? { tableId }
            : { tableLabel: tableLabel.trim() }
          : {}),
        items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        ...form,
        paymentMethod,
      })
      const { orderId, customerToken, paymentUrl } = data.data
      clear()

      if (paymentMethod === 'CASH' || !paymentUrl) {
        navigate(`/order/${orderId}?token=${customerToken}`)
      } else {
        window.location.href = paymentUrl
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear el pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-crema-suave">
      <div className="bg-azul-noche px-4 py-5 flex items-center gap-3">
        <button onClick={() => navigate('/cart')} className="text-crema text-xl" aria-label="Volver">←</button>
        <h1 className="font-ui font-bold text-crema text-xl">Confirmar pedido</h1>
      </div>

      <div className="px-4 py-4 pb-36 flex flex-col gap-4">
        {/* Modalidad */}
        <div className="bg-blanco-calido rounded-card p-4 shadow-card">
          <p className="font-ui font-semibold text-texto-oscuro mb-3">¿Cómo lo recibes?</p>
          <div className="flex gap-2">
            {ORDER_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleOrderType(type.id)}
                className={`flex-1 py-3 px-1 rounded-card font-ui font-semibold text-xs transition-colors ${
                  orderType === type.id
                    ? 'bg-naranja text-white shadow-naranja'
                    : 'bg-gray-100 text-texto-tenue'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Selección de mesa */}
          {orderType === 'DINE_IN' && (
            <div className="mt-3">
              {tables.length > 0 ? (
                <select
                  value={tableId}
                  onChange={e => setTableId(e.target.value)}
                  className={`w-full ${inputClass}`}
                  required
                >
                  <option value="">¿En qué mesa estás? *</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={`w-full ${inputClass}`}
                  placeholder="Número de tu mesa *"
                  value={tableLabel}
                  onChange={e => setTableLabel(e.target.value)}
                  required
                />
              )}
            </div>
          )}
        </div>

        {/* Datos del cliente */}
        <div className="bg-blanco-calido rounded-card p-4 shadow-card flex flex-col gap-3">
          <p className="font-ui font-semibold text-texto-oscuro">Tus datos</p>
          <input
            className={inputClass}
            placeholder="Tu nombre *"
            value={form.customerName}
            onChange={set('customerName')}
            required
          />
          <input
            className={inputClass}
            placeholder="Tu teléfono *"
            type="tel"
            value={form.customerPhone}
            onChange={set('customerPhone')}
            required
          />
          {orderType === 'DELIVERY' && (
            <input
              className={inputClass}
              placeholder="Dirección de entrega *"
              value={form.customerAddress}
              onChange={set('customerAddress')}
              required
            />
          )}
          <textarea
            className={`${inputClass} resize-none`}
            placeholder="Notas especiales (opcional)"
            rows={2}
            value={form.notes}
            onChange={set('notes')}
          />
        </div>

        {/* Método de pago */}
        <div className="bg-blanco-calido rounded-card p-4 shadow-card">
          <p className="font-ui font-semibold text-texto-oscuro mb-3">Método de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {GATEWAY_METHODS.map(pm => (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id)}
                className={`py-3 px-3 rounded-card font-ui font-semibold text-sm flex items-center gap-2 transition-colors ${
                  paymentMethod === pm.id
                    ? 'bg-naranja text-white shadow-naranja'
                    : 'bg-gray-50 text-texto-tenue border border-gray-200'
                }`}
              >
                {pm.icon} {pm.label}
              </button>
            ))}
            {orderType !== 'DELIVERY' && (
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`col-span-2 py-3 px-3 rounded-card font-ui font-semibold text-sm flex items-center gap-2 justify-center transition-colors ${
                  paymentMethod === 'CASH'
                    ? 'bg-naranja text-white shadow-naranja'
                    : 'bg-gray-50 text-texto-tenue border border-gray-200'
                }`}
              >
                💵 {orderType === 'PICKUP' ? 'Pagar al recoger' : 'Pagar en el restaurante'}
              </button>
            )}
          </div>
          {paymentMethod === 'CASH' && (
            <p className="font-body text-texto-tenue text-xs mt-3">
              Tu pedido va a la cocina de una vez y pagas directamente en el restaurante.
            </p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-blanco-calido border-t border-gray-100 px-4 py-4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-body text-texto-tenue">Total</span>
          <span className="font-ui font-bold text-texto-oscuro text-xl">{fmt(total())}</span>
        </div>
        <button
          onClick={handleOrder}
          disabled={loading}
          className="w-full bg-naranja text-white py-4 rounded-pill font-ui font-bold text-base shadow-naranja active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Procesando...' : 'Pedir ahora'}
        </button>
      </div>
    </div>
  )
}
