import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/auth.store'
import { useOrdersStore } from '../stores/orders.store'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3100'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { restaurant } = useAuthStore()
  const { addOrder, updateOrder } = useOrdersStore()

  useEffect(() => {
    if (!restaurant?.id) return

    socketRef.current = io(`${WS_URL}/orders`, {
      transports: ['websocket'],
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      socket.emit('join-restaurant', { restaurantId: restaurant.id })
    })

    socket.on('order:new', (order: any) => {
      addOrder(order)
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    })

    socket.on('order:updated', (order: any) => {
      updateOrder(order)
    })

    return () => {
      socket.disconnect()
    }
  }, [restaurant?.id])

  return { isConnected: socketRef.current?.connected || false }
}
