import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { restaurantApi, authApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function SettingsPage() {
  const navigate = useNavigate()
  const { restaurant, clearAuth } = useAuthStore()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    restaurantApi.getMe().then(r => {
      const { name, phone, address } = r.data.data
      setForm({ name: name || '', phone: phone || '', address: address || '' })
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await restaurantApi.update(form)
      toast.success('Datos actualizados')
    } catch {
      toast.error('Error guardando cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await authApi.logout().catch(() => {})
    clearAuth()
    navigate('/login')
  }

  const customerUrl = `${import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:5274'}?slug=${restaurant?.slug}`

  return (
    <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
      <h1 className="font-ui font-bold text-texto-oscuro text-2xl mb-4">Configuración</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4 mb-6">
        <Card>
          <h3 className="font-ui font-semibold text-texto-oscuro mb-3">Datos del restaurante</h3>
          <div className="flex flex-col gap-3">
            <Input
              label="Nombre"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Teléfono"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Dirección"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            />
          </div>
          <Button type="submit" loading={saving} fullWidth className="mt-4">Guardar cambios</Button>
        </Card>
      </form>

      <Card className="mb-4 bg-crema-suave">
        <p className="font-ui font-semibold text-texto-oscuro mb-1">Link de tu restaurante</p>
        <p className="font-body text-texto-tenue text-sm break-all">{customerUrl}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            navigator.clipboard.writeText(customerUrl)
            toast.success('Link copiado')
          }}
        >
          Copiar link
        </Button>
      </Card>

      <Button variant="danger" fullWidth onClick={handleLogout}>Cerrar sesión</Button>

      <p className="text-center text-texto-tenue text-xs mt-6">by Kairos DLS Group S.A.S</p>
    </div>
  )
}
