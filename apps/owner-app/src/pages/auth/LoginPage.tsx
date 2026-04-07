import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { authApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await authApi.login(form)
      setAuth(data.data.user, data.data.restaurant, data.data.accessToken)
      toast.success(`¡Bienvenido, ${data.data.user.name}!`)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-azul-noche flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl text-crema font-light italic mb-1">Parce</h1>
          <p className="font-body text-texto-tenue text-sm">Tu parce en el negocio</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-blanco-calido rounded-card p-6 shadow-card flex flex-col gap-4">
          <h2 className="font-ui font-bold text-texto-oscuro text-xl">Iniciar sesión</h2>
          <Input
            label="Correo"
            type="email"
            placeholder="tuemail@parce.app"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" loading={loading} fullWidth>Entrar</Button>
          <p className="text-center text-sm text-texto-tenue">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-naranja font-semibold">Regístrate</Link>
          </p>
        </form>
        <p className="text-center text-texto-tenue text-xs mt-4">by Kairos DLS Group S.A.S</p>
      </div>
    </div>
  )
}
