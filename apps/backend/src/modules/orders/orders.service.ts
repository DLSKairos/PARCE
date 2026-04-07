import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { PrismaService } from '../../prisma/prisma.service'
import { OrdersGateway } from './orders.gateway'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import { generateCustomerToken } from '../../common/utils/token.util'
import { OrderStatus } from '@prisma/client'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private gateway: OrdersGateway,
    @InjectQueue('stock-deduction') private stockQueue: Queue,
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: dto.items.map((i) => i.menuItemId) },
        restaurantId: dto.restaurantId,
        isAvailable: true,
      },
      include: {
        recipe: {
          include: { recipeItems: { include: { ingredient: true } } },
        },
      },
    })

    if (menuItems.length !== dto.items.length) {
      throw new BadRequestException('Uno o más productos no están disponibles')
    }

    let total = 0
    let costTotal = 0
    const itemsData = dto.items.map((orderItem) => {
      const menuItem = menuItems.find((m) => m.id === orderItem.menuItemId)!
      const subtotal = Number(menuItem.price) * orderItem.quantity
      total += subtotal

      let itemCost = 0
      if (menuItem.recipe) {
        const recipeCost = menuItem.recipe.recipeItems.reduce((sum, ri) => {
          return sum + Number(ri.quantity) * Number(ri.ingredient.costPerUnit)
        }, 0)
        itemCost = recipeCost
        costTotal += itemCost * orderItem.quantity
      }

      return {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        menuItemPrice: Number(menuItem.price),
        menuItemCost: itemCost,
        quantity: orderItem.quantity,
        subtotal,
      }
    })

    // Obtener siguiente número de pedido (atómico via función SQL)
    const seqResult = await this.prisma.$queryRaw<{ next_order_number: bigint }[]>`
      SELECT next_order_number(${dto.restaurantId}) as next_order_number
    `
    const orderNumber = Number(seqResult[0].next_order_number)

    const customerTokenPlaceholder = `temp-${Date.now()}`

    const order = await this.prisma.order.create({
      data: {
        restaurantId: dto.restaurantId,
        orderNumber,
        status: 'PENDING',
        orderType: dto.orderType,
        total,
        costTotal,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerAddress: dto.customerAddress,
        notes: dto.notes,
        customerToken: customerTokenPlaceholder,
        items: { create: itemsData },
        payment: {
          create: {
            provider: 'WOMPI',
            status: 'PENDING',
            amount: total,
            method: dto.paymentMethod,
          },
        },
      },
      include: { items: true, payment: true },
    })

    const customerToken = generateCustomerToken(order.id, dto.restaurantId)
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { customerToken },
      include: { items: true, payment: true },
    })

    this.gateway.emitNewOrder(dto.restaurantId, updatedOrder)

    const paymentUrl = `https://checkout.wompi.co/p/?public-key=${process.env.WOMPI_PUBLIC_KEY}&currency=COP&amount-in-cents=${Math.round(total * 100)}&reference=${order.id}`

    return {
      orderId: order.id,
      orderNumber,
      customerToken,
      paymentUrl,
      total,
    }
  }

  async getPublicOrder(orderId: string, customerToken: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    })
    if (!order || order.customerToken !== customerToken) {
      throw new NotFoundException('Pedido no encontrado')
    }
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderType: order.orderType,
      items: order.items,
      total: order.total,
      confirmedAt: order.confirmedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
    }
  }

  async getOrders(restaurantId: string, status?: string, date?: string) {
    const where: any = { restaurantId }
    if (status) where.status = status
    if (date) {
      const d = new Date(date)
      const start = new Date(d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { gte: start, lt: end }
    }
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true, payment: true },
    })
  }

  async updateStatus(orderId: string, dto: UpdateStatusDto, restaurantId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    })
    if (!order) throw new NotFoundException('Pedido no encontrado')

    const allowed = VALID_TRANSITIONS[order.status]
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `No se puede cambiar de ${order.status} a ${dto.status}`,
      )
    }

    const data: any = { status: dto.status }
    if (dto.status === 'CONFIRMED') data.confirmedAt = new Date()
    if (dto.status === 'DELIVERED') data.deliveredAt = new Date()

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true, payment: true },
    })

    this.gateway.emitOrderUpdated(restaurantId, orderId, updated)

    await this.pushQueue.add('order-status-changed', {
      orderId,
      status: dto.status,
      customerPhone: order.customerPhone,
    })

    return updated
  }
}
