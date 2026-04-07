import { create } from 'zustand'

export interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

interface CartState {
  items: CartItem[]
  restaurantId: string | null
  setRestaurantId: (id: string) => void
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (menuItemId: string) => void
  updateQty: (menuItemId: string, qty: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  setRestaurantId: (id) => set({ restaurantId: id }),
  addItem: (item) => set((s) => {
    const existing = s.items.find(i => i.menuItemId === item.menuItemId)
    if (existing) {
      return { items: s.items.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i) }
    }
    return { items: [...s.items, { ...item, quantity: 1 }] }
  }),
  removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.menuItemId !== id) })),
  updateQty: (id, qty) => set((s) => ({
    items: qty <= 0
      ? s.items.filter(i => i.menuItemId !== id)
      : s.items.map(i => i.menuItemId === id ? { ...i, quantity: qty } : i),
  })),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
