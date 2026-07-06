import { OnboardingStatus, SubscriptionPlan, SubscriptionStatus } from '../enums/restaurant.enum'

export interface Restaurant {
  id: string
  slug: string
  name: string
  phone?: string
  address?: string
  logoUrl?: string
  coverUrl?: string
  isActive: boolean
  isOpen: boolean
  onboardingStatus: OnboardingStatus
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface RestaurantPublicProfile {
  id: string
  slug: string
  name: string
  logoUrl?: string
  coverUrl?: string
  isOpen: boolean
  phone?: string
  tables?: RestaurantTable[]
}

export interface RestaurantTable {
  id: string
  restaurantId: string
  name: string
  position: number
  isActive: boolean
}

export interface RestaurantPlan {
  restaurantId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trialEndsAt?: Date
  currentPeriodEnd?: Date
}
