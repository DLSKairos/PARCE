import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { publicApi, getRestaurantSlug } from '../services/api'
import { useCartStore } from '../stores/cart.store'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export function MenuPage() {
  const navigate = useNavigate()
  const { addItem, count, total, setRestaurantId } = useCartStore()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<{ categories: any[]; uncategorized: any[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const slug = getRestaurantSlug()
    if (!slug) { navigate('/not-found'); return }
    loadRestaurant(slug)
  }, [])

  const loadRestaurant = async (slug: string) => {
    try {
      const restRes = await publicApi.getRestaurant(slug)
      const rest = restRes.data.data
      setRestaurant(rest)
      setRestaurantId(rest.id)
      document.title = rest.name
      const menuRes = await publicApi.getMenu(rest.id)
      setMenu(menuRes.data.data)
    } catch {
      navigate('/not-found')
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

  return (
    <div className="min-h-screen bg-crema-suave">
      {/* Header del restaurante */}
      <div className="bg-azul-noche px-4 pt-8 pb-6">
        <h1 className="font-display text-3xl text-crema font-light">{restaurant?.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${restaurant?.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="font-body text-texto-tenue text-sm">
            {restaurant?.isOpen ? 'Abierto ahora' : 'Cerrado'}
          </span>
        </div>
      </div>

      {/* Menú */}
      <div className="px-4 py-4 pb-28">
        {menu?.categories?.map(category => (
          <div key={category.id} className="mb-6">
            <h2 className="font-ui font-bold text-texto-oscuro text-lg mb-3">{category.name}</h2>
            <div className="flex flex-col gap-3">
              {category.items?.map((item: any) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  onAdd={() => addItem({ menuItemId: item.id, name: item.name, price: Number(item.price) })}
                />
              ))}
            </div>
          </div>
        ))}
        {menu?.uncategorized && menu.uncategorized.length > 0 && (
          <div className="mb-6">
            <h2 className="font-ui font-bold text-texto-oscuro text-lg mb-3">Menú</h2>
            <div className="flex flex-col gap-3">
              {menu.uncategorized.map((item: any) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  onAdd={() => addItem({ menuItemId: item.id, name: item.name, price: Number(item.price) })}
                />
              ))}
            </div>
          </div>
        )}
        {(!menu || (menu.categories?.length === 0 && menu.uncategorized?.length === 0)) && (
          <div className="text-center py-16 text-texto-tenue font-body">
            <p className="text-4xl mb-2">🍽️</p>
            <p>El menú no está disponible por ahora</p>
          </div>
        )}
      </div>

      {/* Carrito flotante */}
      {count() > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-naranja text-white px-6 py-4 rounded-pill font-ui font-bold text-base shadow-naranja flex justify-between items-center active:scale-95 transition-transform"
          >
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{count()}</span>
            <span>Ver pedido</span>
            <span>{fmt(total())}</span>
          </button>
        </div>
      )}
    </div>
  )
}

function MenuItem({ item, onAdd }: { item: any; onAdd: () => void }) {
  return (
    <div className="bg-blanco-calido rounded-card p-3 flex gap-3 shadow-card">
      {item.photoMediumUrl ? (
        <img
          src={item.photoMediumUrl}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-card flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-20 h-20 bg-crema-suave rounded-card flex-shrink-0 flex items-center justify-center text-3xl">
          🍕
        </div>
      )}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <p className="font-ui font-semibold text-texto-oscuro">{item.name}</p>
          {item.description && (
            <p className="font-body text-texto-tenue text-xs mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="font-ui font-bold text-naranja">{fmt(Number(item.price))}</p>
          <button
            onClick={onAdd}
            aria-label={`Agregar ${item.name}`}
            className="bg-naranja text-white w-8 h-8 rounded-full font-bold text-xl flex items-center justify-center active:scale-90 transition-transform shadow-naranja"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
