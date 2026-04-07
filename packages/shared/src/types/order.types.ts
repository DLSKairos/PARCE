import { OrderStatus, OrderType } from '../enums/order-status.enum'
import { PaymentMethod, PaymentStatus, PaymentProvider } from '../enums/payment.enum'

export interface OrderItem {
  id: string
  menuItemId: string
  menuItemName: string
  menuItemPrice: number
  menuItemCost: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  restaurantId: string
  orderNumber: number
  status: OrderStatus
  orderType: OrderType
  total: number
  costTotal: number
  customerName: string
  customerPhone: string
  customerAddress?: string
  notes?: string
  confirmedAt?: Date
  deliveredAt?: Date
  createdAt: Date
  items: OrderItem[]
  payment?: Payment
}

export interface Payment {
  id: string
  orderId: string
  provider: PaymentProvider
  externalId?: string
  status: PaymentStatus
  amount: number
  method: PaymentMethod
  paidAt?: Date
}

export interface CreateOrderDto {
  restaurantId: string
  orderType: OrderType
  items: { menuItemId: string; quantity: number }[]
  customerName: string
  customerPhone: string
  customerAddress?: string
  notes?: string
  paymentMethod: PaymentMethod
}
