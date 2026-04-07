import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100'

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
})

export const getRestaurantSlug = (): string => {
  const mode = import.meta.env.VITE_CUSTOMER_DOMAIN_MODE || 'query'
  if (mode === 'subdomain') {
    return window.location.hostname.split('.')[0]
  }
  return new URLSearchParams(window.location.search).get('slug') || ''
}

export const publicApi = {
  getRestaurant: (slug: string) => api.get(`/public/restaurants/${slug}`),
  getMenu: (restaurantId: string) => api.get(`/public/menu/${restaurantId}`),
  createOrder: (data: any) => api.post('/public/orders', data),
  getOrder: (id: string, token: string) => api.get(`/public/orders/${id}`, { params: { token } }),
}
