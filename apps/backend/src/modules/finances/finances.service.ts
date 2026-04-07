import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(restaurantId: string) {
    const tz = 'America/Bogota'
    const now = toZonedTime(new Date(), tz)
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const [ordersData, expensesData] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: todayStart, lte: todayEnd },
          payment: { status: 'APPROVED' },
        },
        select: { total: true, costTotal: true },
      }),
      this.prisma.expense.findMany({
        where: { restaurantId, date: { gte: todayStart, lte: todayEnd } },
        select: { amount: true },
      }),
    ])

    const revenue = ordersData.reduce((s, o) => s + Number(o.total), 0)
    const costs = ordersData.reduce((s, o) => s + Number(o.costTotal), 0)
    const expenses = expensesData.reduce((s, e) => s + Number(e.amount), 0)
    const netProfit = revenue - costs - expenses
    const weekTrend = await this.getWeekTrend(restaurantId, tz)

    return {
      today: format(now, 'yyyy-MM-dd'),
      revenue,
      costs,
      expenses,
      netProfit,
      ordersCount: ordersData.length,
      avgOrderValue: ordersData.length > 0 ? revenue / ordersData.length : 0,
      weekTrend,
    }
  }

  private async getWeekTrend(restaurantId: string, tz: string) {
    const trend = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const day = toZonedTime(d, tz)
      const orders = await this.prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
          payment: { status: 'APPROVED' },
        },
        select: { total: true },
      })
      trend.push({
        date: format(day, 'yyyy-MM-dd'),
        revenue: orders.reduce((s, o) => s + Number(o.total), 0),
      })
    }
    return trend
  }

  async createExpense(
    restaurantId: string,
    data: { amount: number; category: string; description: string; rawInput?: string },
  ) {
    return this.prisma.expense.create({
      data: {
        restaurantId,
        amount: data.amount,
        category: data.category as any,
        description: data.description,
        rawInput: data.rawInput,
        date: new Date(),
      },
    })
  }

  async getExpenses(restaurantId: string, from?: string, to?: string) {
    const where: any = { restaurantId }
    if (from) where.date = { gte: new Date(from) }
    if (to) where.date = { ...(where.date || {}), lte: new Date(to) }
    return this.prisma.expense.findMany({ where, orderBy: { date: 'desc' } })
  }

  async getReport(restaurantId: string, period: 'week' | 'month' | 'quarter') {
    const tz = 'America/Bogota'
    const now = toZonedTime(new Date(), tz)
    let from: Date
    let to: Date

    if (period === 'week') {
      from = startOfWeek(now, { weekStartsOn: 1 })
      to = endOfWeek(now, { weekStartsOn: 1 })
    } else if (period === 'month') {
      from = startOfMonth(now)
      to = endOfMonth(now)
    } else {
      const q = Math.floor(now.getMonth() / 3)
      from = new Date(now.getFullYear(), q * 3, 1)
      to = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59)
    }

    const [orders, expenses] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          restaurantId,
          createdAt: { gte: from, lte: to },
          payment: { status: 'APPROVED' },
        },
        select: { total: true, costTotal: true },
      }),
      this.prisma.expense.findMany({
        where: { restaurantId, date: { gte: from, lte: to } },
        select: { amount: true, category: true },
      }),
    ])

    const revenue = orders.reduce((s, o) => s + Number(o.total), 0)
    const costs = orders.reduce((s, o) => s + Number(o.costTotal), 0)
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)

    return {
      period,
      from: format(from, 'yyyy-MM-dd'),
      to: format(to, 'yyyy-MM-dd'),
      revenue,
      costs,
      expenses: totalExpenses,
      netProfit: revenue - costs - totalExpenses,
      ordersCount: orders.length,
      expensesByCategory: expenses.reduce(
        (acc: any, e) => {
          acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
          return acc
        },
        {},
      ),
    }
  }
}
