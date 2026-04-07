import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100'

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,
})

// Token en memoria
let accessToken: string | null = null
export const setAccessToken = (token: string | null) => { accessToken = token }

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
        accessToken = data.data.accessToken
        error.config.headers.Authorization = `Bearer ${accessToken}`
        return api(error.config)
      } catch {
        accessToken = null
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Servicios por módulo
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
}

export const restaurantApi = {
  getMe: () => api.get('/restaurants/me'),
  update: (data: any) => api.patch('/restaurants/me', data),
  toggleOpen: () => api.post('/restaurants/me/open'),
}

export const menuApi = {
  getAll: () => api.get('/menu'),
  getCategories: () => api.get('/menu/categories'),
  createItem: (data: FormData) => api.post('/menu/items', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  toggleItem: (id: string) => api.patch(`/menu/items/${id}/toggle`),
  deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  createCategory: (data: any) => api.post('/menu/categories', data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),
  updateItem: (id: string, data: FormData) => api.patch(`/menu/items/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export const ordersApi = {
  getAll: (params?: any) => api.get('/orders', { params }),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
}

export const inventoryApi = {
  getIngredients: () => api.get('/inventory/ingredients'),
  createIngredient: (data: any) => api.post('/inventory/ingredients', data),
  updateIngredient: (id: string, data: any) => api.patch(`/inventory/ingredients/${id}`, data),
  deleteIngredient: (id: string) => api.delete(`/inventory/ingredients/${id}`),
  addStockEntry: (text: string) => api.post('/inventory/stock/entry', { text }),
  getStockMovements: () => api.get('/inventory/stock/movements'),
  getAlerts: () => api.get('/inventory/stock/alerts'),
  getRecipe: (menuItemId: string) => api.get(`/inventory/recipes/${menuItemId}`),
  upsertRecipe: (menuItemId: string, items: any[]) => api.put(`/inventory/recipes/${menuItemId}`, { items }),
}

export const financesApi = {
  getDashboard: () => api.get('/finances/dashboard'),
  getExpenses: (params?: any) => api.get('/finances/expenses', { params }),
  addExpense: (text: string) => api.post('/finances/expenses', { text }),
  getReport: (period: string) => api.get('/finances/reports', { params: { period } }),
}

export const aiApi = {
  copilot: (messages: any[]) => api.post('/ai/copilot', { messages }),
  getOnboardingSession: () => api.get('/ai/onboarding/session'),
  sendOnboardingMessage: (message: string) => api.post('/ai/onboarding/message', { message }),
  getAlerts: () => api.get('/ai/alerts'),
  getLatestSummary: () => api.get('/ai/summaries/latest'),
}
