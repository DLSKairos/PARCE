import { NavLink } from 'react-router-dom'
import { useOrdersStore } from '../../stores/orders.store'

const tabs = [
  { path: '/dashboard',  label: 'Inicio',     icon: '🏠' },
  { path: '/orders',     label: 'Pedidos',    icon: '🍕' },
  { path: '/menu',       label: 'Menú',       icon: '📋' },
  { path: '/inventory',  label: 'Inventario', icon: '📦' },
  { path: '/settings',   label: 'Config',     icon: '⚙️' },
]

export function BottomNav() {
  const { hasNewOrder } = useOrdersStore()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-azul-noche border-t border-azul-medio z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-card transition-colors relative ${isActive ? 'text-naranja' : 'text-texto-tenue'}`
            }
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            {tab.path === '/orders' && hasNewOrder && (
              <span className="absolute -top-1 right-0 w-3 h-3 bg-red-500 rounded-full" />
            )}
            <span className="text-[10px] font-ui font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
