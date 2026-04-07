import { createHmac } from 'crypto'

export function generateCustomerToken(orderId: string, restaurantId: string): string {
  const secret = process.env.CUSTOMER_TOKEN_SECRET || 'fallback-secret'
  return createHmac('sha256', secret)
    .update(`${orderId}:${restaurantId}:${Date.now()}`)
    .digest('hex')
}

export function generateSlugToken(text: string): string {
  return createHmac('sha256', 'parce-slug')
    .update(text + Date.now())
    .digest('hex')
    .substring(0, 8)
}
