import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { aiApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth.store'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'

interface Message { role: 'user' | 'assistant'; content: string }

export function OnboardingPage() {
  const navigate = useNavigate()
  const { restaurant } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSession = async () => {
    setLoading(true)
    try {
      const { data } = await aiApi.getOnboardingSession()
      const session = data.data
      if (session?.messages?.length > 0) {
        setMessages(session.messages)
        if (session.currentStep === 'COMPLETE') setIsComplete(true)
      } else {
        const { data: res } = await aiApi.sendOnboardingMessage('Hola, quiero empezar')
        setMessages([{ role: 'assistant', content: res.data.message }])
        if (res.data.isComplete) setIsComplete(true)
      }
    } catch {
      toast.error('Error cargando el onboarding')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const { data } = await aiApi.sendOnboardingMessage(userMsg)
      setMessages(m => [...m, { role: 'assistant', content: data.data.message }])
      if (data.data.isComplete) setIsComplete(true)
    } catch {
      toast.error('Error enviando mensaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-azul-noche flex flex-col">
      <div className="px-4 py-4 border-b border-azul-medio">
        <h1 className="font-ui font-bold text-crema text-lg">Configuración inicial</h1>
        <p className="font-body text-texto-tenue text-sm">{restaurant?.name} &mdash; con Parce IA</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-card font-body text-sm ${
              msg.role === 'user' ? 'bg-naranja text-white' : 'bg-azul-medio text-crema'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-azul-medio px-4 py-3 rounded-card">
              <Spinner size="sm" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isComplete ? (
        <div className="px-4 py-4 bg-azul-medio">
          <div className="text-center mb-4">
            <p className="font-ui font-bold text-ambar text-lg">¡Listo, parce!</p>
            <p className="font-body text-crema text-sm">Tus recetas están configuradas</p>
          </div>
          <Button fullWidth onClick={() => navigate('/dashboard')}>Ir al dashboard</Button>
        </div>
      ) : (
        <div className="px-4 py-4 bg-azul-medio flex gap-2">
          <input
            className="flex-1 px-4 py-3 bg-azul-noche border border-azul-medio text-crema placeholder-texto-tenue rounded-card font-body text-sm focus:outline-none focus:border-naranja"
            placeholder="Escribe tu respuesta..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} loading={loading} size="md">→</Button>
        </div>
      )}
    </div>
  )
}
