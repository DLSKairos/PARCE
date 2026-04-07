import { IngredientUnit, StockMovementType } from '../enums/inventory.enum'

export interface Ingredient {
  id: string
  restaurantId: string
  name: string
  unit: IngredientUnit
  stock: number
  minStock: number
  costPerUnit: number
  expiresAt?: Date
}

export interface RecipeItem {
  ingredientId: string
  ingredient?: Ingredient
  quantity: number
}

export interface Recipe {
  menuItemId: string
  name: string
  items: RecipeItem[]
}

export interface StockMovement {
  id: string
  ingredientId: string
  restaurantId: string
  type: StockMovementType
  quantity: number
  referenceType?: string
  referenceId?: string
  note?: string
  createdAt: Date
}
