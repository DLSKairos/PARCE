import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { financesApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const categoryLabel: Record<string, string> = {
  INGREDIENTS: '🥬 Ingredientes',
  RENT:        '🏠 Arriendo',
  UTILITIES:   '💡 Servicios',
  STAFF:       '👥 Personal',
  EQUIPMENT:   '🔧 Equipos',
  MARKETING:   '📣 Marketing',
  OTHER:       '📋 Otros',
}

export function FinancesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expenseText, setExpenseText] = useState('')
  const [addingExpense, setAddingExpense] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [period, setPeriod] = useState<'week' | 'month'>('month')

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadReport() }, [period])

  const loadData = async () => {
    try {
      const { data } = await financesApi.getExpenses()
      setExpenses(data.data.slice(0, 20))
    } catch {
      toast.error('Error cargando gastos')
    } finally {
      setLoading(false)
    }
  }

  const loadReport = async () => {
    try {
      const { data } = await financesApi.getReport(period)
      setReport(data.data)
    } catch {
      // plan básico puede no tener acceso
    }
  }

  const handleAddExpense = async () => {
    if (!expenseText.trim()) return
    setAddingExpense(true)
    try {
      await financesApi.addExpense(expenseText)
      toast.success('Gasto registrado')
      setExpenseText('')
      loadData()
    } catch {
      toast.error('No pude entender eso. Prueba de nuevo.')
    } finally {
      setAddingExpense(false)
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
      <h1 className="font-ui font-bold text-texto-oscuro text-2xl mb-4">Finanzas</h1>

      {/* Registrar gasto por texto natural */}
      <Card className="mb-4 bg-azul-noche">
        <p className="font-ui font-semibold text-ambar text-sm mb-2">💸 Registrar gasto</p>
        <p className="font-body text-texto-tenue text-xs mb-3">
          Ej: "Pagué 800 mil de arriendo"
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 bg-azul-medio border border-azul-noche text-crema placeholder-texto-tenue rounded-card text-sm font-body focus:outline-none focus:border-naranja"
            placeholder="Describe el gasto..."
            value={expenseText}
            onChange={e => setExpenseText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddExpense()}
          />
          <Button size="sm" onClick={handleAddExpense} loading={addingExpense}>Guardar</Button>
        </div>
      </Card>

      {/* Reporte del período */}
      {report && (
        <Card className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <p className="font-ui font-semibold text-texto-oscuro">Reporte</p>
            <div className="flex gap-1">
              {(['week', 'month'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-pill text-xs font-ui font-semibold ${
                    period === p ? 'bg-naranja text-white' : 'bg-gray-100 text-texto-tenue'
                  }`}
                >
                  {p === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-crema-suave rounded-card p-3">
              <p className="text-xs text-texto-tenue">Ingresos</p>
              <p className="font-ui font-bold text-texto-oscuro">{fmt(report.revenue)}</p>
            </div>
            <div className="bg-crema-suave rounded-card p-3">
              <p className="text-xs text-texto-tenue">Ganancia neta</p>
              <p className={`font-ui font-bold ${report.netProfit >= 0 ? 'text-naranja' : 'text-red-500'}`}>
                {fmt(report.netProfit)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de gastos recientes */}
      <p className="font-ui font-semibold text-texto-oscuro mb-2">Gastos recientes</p>
      <div className="flex flex-col gap-2">
        {expenses.length === 0 && (
          <p className="text-center py-8 text-texto-tenue font-body">Sin gastos registrados</p>
        )}
        {expenses.map((exp, i) => (
          <Card key={i} className="flex justify-between items-center">
            <div>
              <p className="font-ui font-semibold text-texto-oscuro text-sm">
                {categoryLabel[exp.category] || exp.category}
              </p>
              <p className="font-body text-texto-tenue text-xs">{exp.description}</p>
              <p className="font-body text-texto-tenue text-xs">
                {new Date(exp.date).toLocaleDateString('es-CO')}
              </p>
            </div>
            <p className="font-ui font-bold text-red-500">{fmt(exp.amount)}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
