import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { menuApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

type Category = { id: string; name: string }
type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  isAvailable: boolean
  photoThumbUrl?: string
  photoMediumUrl?: string
  categoryId?: string
}

const EMPTY_FORM = { name: '', description: '', price: '', categoryId: '' }

export function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items')

  // Producto form
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Categoría form
  const [newCategory, setNewCategory] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [menuRes, catRes] = await Promise.all([menuApi.getAll(), menuApi.getCategories()])
      setItems(menuRes.data.data || [])
      setCategories(catRes.data.data || [])
    } catch {
      toast.error('Error cargando menú')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setPhotoFile(null)
    setPhotoPreview(null)
    setShowForm(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditItem(item)
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      categoryId: item.categoryId || '',
    })
    setPhotoFile(null)
    setPhotoPreview(item.photoMediumUrl || null)
    setShowForm(true)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('price', form.price)
      if (form.categoryId) fd.append('categoryId', form.categoryId)
      if (photoFile) fd.append('photo', photoFile)

      if (editItem) {
        await menuApi.updateItem(editItem.id, fd)
        toast.success('Producto actualizado')
      } else {
        await menuApi.createItem(fd)
        toast.success('Producto creado')
      }
      setShowForm(false)
      setEditItem(null)
      setForm(EMPTY_FORM)
      setPhotoFile(null)
      setPhotoPreview(null)
      loadAll()
    } catch {
      toast.error('Error guardando producto')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string) => {
    setToggling(id)
    try {
      const { data } = await menuApi.toggleItem(id)
      setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable: data.data.isAvailable } : i))
    } catch {
      toast.error('Error actualizando disponibilidad')
    } finally {
      setToggling(null)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await menuApi.deleteItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Producto eliminado')
    } catch {
      toast.error('Error eliminando producto')
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    setSavingCat(true)
    try {
      await menuApi.createCategory({ name: newCategory.trim() })
      setNewCategory('')
      toast.success('Categoría creada')
      loadAll()
    } catch {
      toast.error('Error creando categoría')
    } finally {
      setSavingCat(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      await menuApi.deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success('Categoría eliminada')
    } catch {
      toast.error('Error eliminando categoría')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    )
  }

  // Agrupar items por categoría
  const uncategorized = items.filter(i => !i.categoryId)
  const byCat = categories.map(cat => ({
    cat,
    items: items.filter(i => i.categoryId === cat.id),
  }))

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-ui font-bold text-texto-oscuro text-2xl">Menú</h1>
        {activeTab === 'items' && (
          <Button size="sm" onClick={openCreate}>+ Agregar</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['items', 'categories'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-pill font-ui text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-naranja text-white'
                : 'bg-crema-suave text-texto-tenue'
            }`}
          >
            {tab === 'items' ? 'Productos' : 'Categorías'}
          </button>
        ))}
      </div>

      {/* ── FORM PRODUCTO ── */}
      {showForm && activeTab === 'items' && (
        <Card className="mb-4 border border-naranja/20">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-ui font-semibold text-texto-oscuro">
              {editItem ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditItem(null) }}
              className="text-texto-tenue text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSave} className="flex flex-col gap-3">

            {/* Foto */}
            <div
              onClick={() => fileRef.current?.click()}
              className="w-full h-36 rounded-card border-2 border-dashed border-naranja/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-crema-suave relative"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-3xl mb-1">📷</span>
                  <span className="font-body text-texto-tenue text-sm">Toca para subir foto</span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <input
              className="px-4 py-3 bg-white border border-gray-200 rounded-card font-body text-sm focus:outline-none focus:border-naranja"
              placeholder="Nombre del producto *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <textarea
              className="px-4 py-3 bg-white border border-gray-200 rounded-card font-body text-sm focus:outline-none focus:border-naranja resize-none"
              placeholder="Descripción (opcional)"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <input
              type="number"
              className="px-4 py-3 bg-white border border-gray-200 rounded-card font-body text-sm focus:outline-none focus:border-naranja"
              placeholder="Precio en pesos *"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              required
              min={0}
            />

            {/* Categoría */}
            {categories.length > 0 && (
              <select
                className="px-4 py-3 bg-white border border-gray-200 rounded-card font-body text-sm focus:outline-none focus:border-naranja"
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => { setShowForm(false); setEditItem(null) }}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={saving} fullWidth>
                {editItem ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── TAB PRODUCTOS ── */}
      {activeTab === 'items' && (
        <div className="flex flex-col gap-4">
          {items.length === 0 && (
            <div className="text-center py-12 text-texto-tenue font-body">
              <p className="text-4xl mb-2">🍽️</p>
              <p>Tu menú está vacío. Agrega el primer producto.</p>
            </div>
          )}

          {/* Items sin categoría */}
          {uncategorized.length > 0 && (
            <div>
              <p className="font-ui text-xs font-semibold text-texto-tenue uppercase tracking-wide mb-2">
                Sin categoría
              </p>
              <div className="flex flex-col gap-2">
                {uncategorized.map(item => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    toggling={toggling}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Items por categoría */}
          {byCat.map(({ cat, items: catItems }) => (
            <div key={cat.id}>
              <p className="font-ui text-xs font-semibold text-texto-tenue uppercase tracking-wide mb-2">
                {cat.name}
              </p>
              {catItems.length === 0 ? (
                <p className="text-texto-tenue text-sm font-body pl-1">Sin productos en esta categoría</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {catItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      toggling={toggling}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB CATEGORÍAS ── */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-3">
          <Card>
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 bg-crema-suave border border-gray-200 rounded-card font-body text-sm focus:outline-none focus:border-naranja"
                placeholder="Nueva categoría (ej: Pizzas, Bebidas)"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              />
              <Button type="submit" loading={savingCat} size="sm">Crear</Button>
            </form>
          </Card>

          {categories.length === 0 ? (
            <div className="text-center py-8 text-texto-tenue font-body">
              <p className="text-3xl mb-2">📂</p>
              <p>Aún no tienes categorías.</p>
            </div>
          ) : (
            categories.map(cat => (
              <Card key={cat.id} className="flex items-center justify-between">
                <span className="font-ui font-medium text-texto-oscuro">{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-red-400 text-sm font-body hover:text-red-600"
                >
                  Eliminar
                </button>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente fila de item ──
function ItemRow({
  item, toggling, onToggle, onEdit, onDelete,
}: {
  item: MenuItem
  toggling: string | null
  onToggle: (id: string) => void
  onEdit: (item: MenuItem) => void
  onDelete: (id: string) => void
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <Card className="flex items-center gap-3">
      {/* Foto */}
      {item.photoThumbUrl ? (
        <img
          src={item.photoThumbUrl}
          alt={item.name}
          className="w-14 h-14 rounded-card object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 bg-crema-suave rounded-card flex items-center justify-center text-2xl flex-shrink-0">
          🍕
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-ui font-semibold truncate ${item.isAvailable ? 'text-texto-oscuro' : 'text-texto-tenue line-through'}`}>
          {item.name}
        </p>
        {item.description && (
          <p className="font-body text-texto-tenue text-xs truncate">{item.description}</p>
        )}
        <p className="font-ui font-bold text-naranja text-sm">{fmt(item.price)}</p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        {/* Toggle disponibilidad */}
        <button
          onClick={() => onToggle(item.id)}
          disabled={toggling === item.id}
          aria-label={item.isAvailable ? 'Desactivar' : 'Activar'}
          className={`w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${
            item.isAvailable ? 'bg-green-400' : 'bg-gray-300'
          }`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
              item.isAvailable ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        {/* Editar / Eliminar */}
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(item)}
            className="text-xs text-texto-tenue hover:text-naranja transition-colors px-1"
          >
            Editar
          </button>
          <span className="text-gray-200">|</span>
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs text-texto-tenue hover:text-red-500 transition-colors px-1"
          >
            Eliminar
          </button>
        </div>
      </div>
    </Card>
  )
}
