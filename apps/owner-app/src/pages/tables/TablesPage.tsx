import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { tablesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

interface Table {
  id: string
  name: string
  position: number
  isActive: boolean
}

export function TablesPage() {
  const navigate = useNavigate()
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState('')
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      const { data } = await tablesApi.getAll()
      setTables(data.data)
    } catch {
      toast.error('Error cargando mesas')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    const n = parseInt(count, 10)
    if (!n || n < 1 || n > 100) {
      toast.error('Ingresa un número entre 1 y 100')
      return
    }
    setGenerating(true)
    try {
      const { data } = await tablesApi.generate(n)
      setTables(data.data)
      setCount('')
      toast.success(`${n} mesas creadas`)
    } catch {
      toast.error('Error creando mesas')
    } finally {
      setGenerating(false)
    }
  }

  const handleRename = async (table: Table) => {
    if (!editName.trim()) {
      setEditingId(null)
      return
    }
    try {
      const { data } = await tablesApi.update(table.id, { name: editName.trim() })
      setTables(ts => ts.map(t => (t.id === table.id ? data.data : t)))
      toast.success('Mesa actualizada')
    } catch {
      toast.error('Error actualizando la mesa')
    } finally {
      setEditingId(null)
    }
  }

  const handleToggle = async (table: Table) => {
    try {
      const { data } = await tablesApi.update(table.id, { isActive: !table.isActive })
      setTables(ts => ts.map(t => (t.id === table.id ? data.data : t)))
    } catch {
      toast.error('Error actualizando la mesa')
    }
  }

  const handleDelete = async (table: Table) => {
    if (!confirm(`¿Eliminar ${table.name}?`)) return
    try {
      await tablesApi.remove(table.id)
      setTables(ts => ts.filter(t => t.id !== table.id))
      toast.success('Mesa eliminada')
    } catch {
      toast.error('Error eliminando la mesa')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/settings')} className="text-texto-oscuro text-xl" aria-label="Volver">←</button>
        <h1 className="font-ui font-bold text-texto-oscuro text-2xl">Mesas</h1>
      </div>

      {/* Generador de mesas */}
      <Card className="mb-4">
        <p className="font-ui font-semibold text-texto-oscuro mb-1">
          {tables.length === 0 ? '¿Cuántas mesas tiene tu restaurante?' : 'Agregar más mesas'}
        </p>
        <p className="font-body text-texto-tenue text-xs mb-3">
          Se crean automáticamente y luego puedes cambiarles el nombre: "Terraza", "Barra 1", "VIP"...
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={e => setCount(e.target.value)}
            placeholder="8"
            className="w-24 px-4 py-3 bg-crema-suave border border-gray-200 rounded-card font-body text-sm text-texto-oscuro focus:outline-none focus:border-naranja"
          />
          <Button onClick={handleGenerate} loading={generating} className="flex-1">
            Generar mesas
          </Button>
        </div>
      </Card>

      {tables.length === 0 ? (
        <div className="text-center py-10 text-texto-tenue font-body">
          <p className="text-4xl mb-2">🍽️</p>
          <p>Aún no tienes mesas configuradas.</p>
          <p className="text-xs mt-1">Si no configuras mesas, tus clientes escriben el número de mesa a mano.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tables.map(table => (
            <Card key={table.id} className={`flex items-center gap-3 ${!table.isActive ? 'opacity-60' : ''}`}>
              {editingId === table.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => handleRename(table)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(table)}
                  className="flex-1 px-3 py-2 bg-crema-suave border border-naranja rounded-card font-body text-sm text-texto-oscuro focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => { setEditingId(table.id); setEditName(table.name) }}
                  className="flex-1 text-left font-ui font-semibold text-texto-oscuro py-2"
                >
                  {table.name}
                  {!table.isActive && <span className="font-body text-texto-tenue text-xs ml-2">(desactivada)</span>}
                </button>
              )}
              <button
                onClick={() => handleToggle(table)}
                className={`px-3 py-2 rounded-pill text-xs font-ui font-semibold ${
                  table.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {table.isActive ? 'Activa' : 'Inactiva'}
              </button>
              <button
                onClick={() => handleDelete(table)}
                aria-label={`Eliminar ${table.name}`}
                className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center"
              >
                🗑
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
