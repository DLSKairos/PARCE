import { AlertType, OnboardingStep } from '../enums/ai.enum'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIAlert {
  id: string
  restaurantId: string
  type: AlertType
  message: string
  isRead: boolean
  relatedEntity?: string
  resolvedAt?: Date
  createdAt: Date
}

export interface NightlySummary {
  date: string
  revenue: number
  costs: number
  netProfit: number
  ordersCount: number
  topItems: { name: string; count: number }[]
  stockAlerts: string[]
  message: string
}

export interface OnboardingSession {
  restaurantId: string
  currentStep: OnboardingStep
  messages: AIMessage[]
  completedAt?: Date
}
