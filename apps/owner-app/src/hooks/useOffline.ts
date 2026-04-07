import { useEffect, useState } from 'react'
import { useOfflineStore } from '../stores/offline.store'
import { ordersApi, financesApi, inventoryApi, menuApi } from '../services/api'

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { pendingActions, removeAction } = useOfflineStore()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncPendingActions()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncPendingActions = async () => {
    const actions = useOfflineStore.getState().pendingActions
    for (const action of actions) {
      try {
        if (action.type === 'UPDATE_ORDER_STATUS') {
          await ordersApi.updateStatus(action.payload.orderId, action.payload.status)
        } else if (action.type === 'ADD_EXPENSE') {
          await financesApi.addExpense(action.payload.text)
        } else if (action.type === 'ADD_STOCK_ENTRY') {
          await inventoryApi.addStockEntry(action.payload.text)
        } else if (action.type === 'TOGGLE_MENU_ITEM') {
          await menuApi.toggleItem(action.payload.itemId)
        }
        removeAction(action.id)
      } catch (err) {
        console.error('Error sincronizando acción offline:', err)
      }
    }
  }

  return { isOnline, pendingSyncCount: pendingActions.length, syncPendingActions }
}
