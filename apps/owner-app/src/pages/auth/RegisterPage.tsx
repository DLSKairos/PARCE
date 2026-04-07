import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ ownerName: '', email: '', password: '', restaurantName: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.register(form)
      setAuth(data.data.user, data.data.restaurant, data.data.accessToken)
      toast.success('¡Cuenta creada! Comencemos con el onboarding.')
      navigate('/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-azul-noche flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-crema font-light italic mb-1">Parce</h1>
          <p className="font-body text-texto-tenue text-sm">30 días gratis, sin tarjeta</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-blanco-calido rounded-card p-6 shadow-card flex flex-col gap-4">
          <h2 className="font-ui font-bold text-texto-oscuro text-xl">Crear cuenta</h2>
          <Input label="Tu nombre" placeholder="Carlos Pérez" value={form.ownerName} onChange={set('ownerName')} required />
          <Input label="Nombre del restaurante" placeholder="Pizza Buena Nota" value={form.restaurantName} onChange={set('restaurantName')} required />
          <Input label="Teléfono" type="tel" placeholder="+57 300 123 4567" value={form.phone} onChange={set('phone')} required />
          <Input label="Correo" type="email" placeholder="tuemail@gmail.com" value={form.email} onChange={set('email')} required />
          <Input label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={set('password')} required minLength={8} />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" loading={loading} fullWidth>Empezar gratis</Button>
          <p className="text-center text-sm text-texto-tenue">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-naranja font-semibold">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
