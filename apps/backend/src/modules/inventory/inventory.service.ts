import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getIngredients(restaurantId: string) {
    return this.prisma.ingredient.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' },
    })
  }

  async createIngredient(restaurantId: string, data: any) {
    return this.prisma.ingredient.create({ data: { ...data, restaurantId } })
  }

  async updateIngredient(restaurantId: string, id: string, data: any) {
    const ing = await this.prisma.ingredient.findFirst({ where: { id, restaurantId } })
    if (!ing) throw new NotFoundException('Ingrediente no encontrado')
    return this.prisma.ingredient.update({ where: { id }, data })
  }

  async deleteIngredient(restaurantId: string, id: string) {
    const ing = await this.prisma.ingredient.findFirst({ where: { id, restaurantId } })
    if (!ing) throw new NotFoundException('Ingrediente no encontrado')
    return this.prisma.ingredient.delete({ where: { id } })
  }

  async getRecipe(restaurantId: string, menuItemId: string) {
    return this.prisma.recipe.findFirst({
      where: { menuItemId, menuItem: { restaurantId } },
      include: { recipeItems: { include: { ingredient: true } } },
    })
  }

  async upsertRecipe(
    restaurantId: string,
    menuItemId: string,
    items: { ingredientId: string; quantity: number }[],
  ) {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, restaurantId },
    })
    if (!menuItem) throw new NotFoundException('Producto no encontrado')

    return this.prisma.recipe.upsert({
      where: { menuItemId },
      create: {
        menuItemId,
        name: menuItem.name,
        recipeItems: { create: items },
      },
      update: {
        recipeItems: {
          deleteMany: {},
          create: items,
        },
      },
      include: { recipeItems: { include: { ingredient: true } } },
    })
  }

  async addStockEntry(
    restaurantId: string,
    ingredientId: string,
    quantity: number,
    note?: string,
  ) {
    // Verificar que el ingrediente existe y pertenece al restaurante
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id: ingredientId, restaurantId },
    })
    if (!ingredient) {
      throw new Error(`Ingrediente no encontrado: ${ingredientId}`)
    }

    await this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: { stock: { increment: quantity } },
    })
    return this.prisma.stockMovement.create({
      data: {
        ingredientId,
        restaurantId,
        type: 'IN',
        quantity,
        referenceType: 'MANUAL',
        note,
      },
    })
  }

  async deductStockForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipe: {
                  include: { recipeItems: { include: { ingredient: true } } },
                },
              },
            },
          },
        },
      },
    })
    if (!order) return

    for (const orderItem of order.items) {
      if (!orderItem.menuItem.recipe) continue
      for (const recipeItem of orderItem.menuItem.recipe.recipeItems) {
        const totalDeduction = Number(recipeItem.quantity) * orderItem.quantity
        await this.prisma.ingredient.update({
          where: { id: recipeItem.ingredientId },
          data: { stock: { decrement: totalDeduction } },
        })
        await this.prisma.stockMovement.create({
          data: {
            ingredientId: recipeItem.ingredientId,
            restaurantId: order.restaurantId,
            type: 'OUT',
            quantity: totalDeduction,
            referenceType: 'ORDER',
            referenceId: orderId,
          },
        })
      }
    }
  }

  async checkAlerts(restaurantId: string) {
    const now = new Date()
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const ingredients = await this.prisma.ingredient.findMany({ where: { restaurantId } })

    for (const ing of ingredients) {
      if (Number(ing.stock) <= Number(ing.minStock)) {
        await this.prisma.aiAlert.upsert({
          where: { id: `${restaurantId}-low-stock-${ing.id}` },
          create: {
            id: `${restaurantId}-low-stock-${ing.id}`,
            restaurantId,
            type: 'LOW_STOCK',
            message: `El ${ing.name} está bajo. Tienes ${ing.stock} ${ing.unit.toLowerCase()} y el mínimo es ${ing.minStock}.`,
            relatedEntity: ing.id,
            isRead: false,
          },
          update: { isRead: false },
        })
      }

      if (ing.expiresAt && ing.expiresAt <= in3Days) {
        await this.prisma.aiAlert
          .create({
            data: {
              restaurantId,
              type: 'EXPIRING_SOON',
              message: `${ing.name} vence el ${ing.expiresAt.toLocaleDateString('es-CO')}. Úsalo pronto.`,
              relatedEntity: ing.id,
            },
          })
          .catch(() => {})
      }
    }
  }

  async getAlerts(restaurantId: string) {
    return this.prisma.aiAlert.findMany({
      where: { restaurantId, isRead: false },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getStockMovements(restaurantId: string) {
    return this.prisma.stockMovement.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { ingredient: true },
    })
  }
}
