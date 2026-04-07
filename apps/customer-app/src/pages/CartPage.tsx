import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cart.store'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function CartPage() {
  const navigate = useNavigate()
  const { items, updateQty, total, count } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-crema-suave flex flex-col items-center justify-center px-4">
        <p className="text-5xl mb-4">🛒</p>
        <p className="font-ui font-bold text-texto-oscuro text-xl mb-2">Tu carrito está vacío</p>
        <button onClick={() => navigate('/')} className="text-naranja font-ui font-semibold">
          ← Volver al menú
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-crema-suave">
      <div className="bg-azul-noche px-4 py-5 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-crema text-xl" aria-label="Volver">←</button>
        <h1 className="font-ui font-bold text-crema text-xl">Tu pedido</h1>
      </div>

      <div className="px-4 py-4 pb-32">
        {items.map(item => (
          <div key={item.menuItemId} className="bg-blanco-calido rounded-card p-4 mb-3 shadow-card flex items-center gap-3">
            <div className="flex-1">
              <p className="font-ui font-semibold text-texto-oscuro">{item.name}</p>
              <p className="font-ui font-bold text-naranja text-sm">{fmt(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.menuItemId, item.quantity - 1)}
                aria-label="Quitar uno"
                className="w-8 h-8 bg-gray-100 rounded-full font-bold text-lg flex items-center justify-center"
              >
                −
              </button>
              <span className="font-ui font-bold text-texto-oscuro w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.menuItemId, item.quantity + 1)}
                aria-label="Agregar uno"
                className="w-8 h-8 bg-naranja text-white rounded-full font-bold text-lg flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-blanco-calido border-t border-gray-100 px-4 py-4">
        <div className="flex justify-between items-center mb-3">
          <span className="font-body text-texto-tenue">Total ({count()} items)</span>
          <span className="font-ui font-bold text-texto-oscuro text-xl">{fmt(total())}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-naranja text-white py-4 rounded-pill font-ui font-bold text-base shadow-naranja active:scale-95 transition-transform"
        >
          Ir a pagar
        </button>
      </div>
    </div>
  )
}
