import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatStore {
  messages: Message[]
  addMessage: (msg: Message) => void
  clearChat: () => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [{ role: 'assistant', content: '¡Hola parce! Soy tu copiloto. ¿En qué te ayudo hoy?' }],
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearChat: () => set({ messages: [{ role: 'assistant', content: '¡Hola parce! Soy tu copiloto. ¿En qué te ayudo hoy?' }] }),
    }),
    { name: 'parce-chat' },
  ),
)
