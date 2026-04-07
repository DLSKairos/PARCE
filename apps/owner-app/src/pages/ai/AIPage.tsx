import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { aiApi } from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useChatStore } from '../../stores/chat.store'

export function AIPage() {
  const { messages, addMessage, clearChat } = useChatStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [latestSummary, setLatestSummary] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    aiApi.getLatestSummary().then(r => setLatestSummary(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    addMessage({ role: 'user', content: userMsg })
    setLoading(true)
    try {
      const allMessages = [...messages, { role: 'user' as const, content: userMsg }]
      const { data } = await aiApi.copilot(allMessages)
      addMessage({ role: 'assistant', content: data.data.message })
    } catch (err: any) {
      if (err.response?.status === 402) {
        toast.error('Tu período de prueba venció. Activa tu plan para seguir.')
      } else {
        toast.error('Error al consultar a Parce IA')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col max-w-md mx-auto h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="font-ui font-bold text-texto-oscuro text-2xl">Parce IA</h1>
          <p className="font-body text-texto-tenue text-sm">Tu copiloto del negocio</p>
        </div>
        <button
          onClick={clearChat}
          className="text-texto-tenue text-xs font-body hover:text-red-400 transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Resumen nocturno — solo si el chat está en el mensaje inicial */}
      {latestSummary?.content?.message && messages.length === 1 && (
        <div className="px-4 py-3 bg-azul-noche/5">
          <Card className="bg-azul-noche">
            <p className="font-ui font-semibold text-ambar text-sm mb-1">🌙 Resumen de ayer</p>
            <p className="font-body text-crema text-sm">{latestSummary.content.message}</p>
          </Card>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-card font-body text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-naranja text-white'
                  : 'bg-blanco-calido text-texto-oscuro shadow-card'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-blanco-calido px-4 py-3 rounded-card shadow-card">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-naranja rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-naranja rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-naranja rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <input
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-card font-body text-sm text-texto-oscuro placeholder-texto-tenue focus:outline-none focus:border-naranja"
          placeholder="Pregúntame algo sobre tu negocio..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <Button onClick={sendMessage} loading={loading}>→</Button>
      </div>
    </div>
  )
}
