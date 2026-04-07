import { create } from 'zustand'

export interface Order {
  id: string
  orderNumber: number
  status: string
  orderType: string
  total: number
  customerName: string
  customerPhone: string
  customerAddress?: string
  notes?: string
  items: any[]
  payment?: any
  createdAt: string
  confirmedAt?: string
}

interface OrdersState {
  orders: Order[]
  hasNewOrder: boolean
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (order: Order) => void
  clearNewOrderAlert: () => void
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  hasNewOrder: false,
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((s) => ({ orders: [order, ...s.orders], hasNewOrder: true })),
  updateOrder: (order) => set((s) => ({ orders: s.orders.map(o => o.id === order.id ? order : o) })),
  clearNewOrderAlert: () => set({ hasNewOrder: false }),
}))
