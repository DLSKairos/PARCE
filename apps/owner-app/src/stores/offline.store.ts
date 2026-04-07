import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OfflineAction {
  id: string
  type: 'UPDATE_ORDER_STATUS' | 'ADD_EXPENSE' | 'TOGGLE_MENU_ITEM' | 'ADD_STOCK_ENTRY'
  payload: any
  createdAt: string
}

interface OfflineState {
  pendingActions: OfflineAction[]
  addAction: (action: Omit<OfflineAction, 'id' | 'createdAt'>) => void
  removeAction: (id: string) => void
  clearAll: () => void
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      pendingActions: [],
      addAction: (action) => set((s) => ({
        pendingActions: [...s.pendingActions, { ...action, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]
      })),
      removeAction: (id) => set((s) => ({ pendingActions: s.pendingActions.filter(a => a.id !== id) })),
      clearAll: () => set({ pendingActions: [] }),
    }),
    { name: 'parce-offline' }
  )
)
