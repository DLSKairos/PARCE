import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { MenuPage } from './pages/MenuPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderStatusPage } from './pages/OrderStatusPage'
import { RestaurantNotFoundPage } from './pages/RestaurantNotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{ style: { borderRadius: '16px' } }}
      />
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:orderId" element={<OrderStatusPage />} />
        <Route path="/not-found" element={<RestaurantNotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
