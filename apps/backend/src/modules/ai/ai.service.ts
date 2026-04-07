import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AIService {
  private anthropic: Anthropic
  private readonly logger = new Logger(AIService.name)

  constructor(private config: ConfigService, private prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY') })
  }

  private get sonnetModel() {
    return this.config.get('ANTHROPIC_MODEL_SONNET', 'claude-sonnet-4-6')
  }

  private get haikuModel() {
    return this.config.get('ANTHROPIC_MODEL_HAIKU', 'claude-haiku-4-5-20251001')
  }

  async callHaiku(
    systemPrompt: string,
    userMessage: string,
    restaurantId: string,
    taskType: string,
  ): Promise<string> {
    await this.checkRateLimit(restaurantId, 'haiku', 50)
    const response = await this.anthropic.messages.create({
      model: this.haikuModel,
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })
    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    await this.trackInteraction(
      restaurantId,
      'haiku',
      response.usage.input_tokens,
      response.usage.output_tokens,
      taskType,
    )
    return content
  }

  async callSonnet(
    systemPrompt: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    restaurantId: string,
    taskType: string,
  ): Promise<string> {
    await this.checkRateLimit(restaurantId, 'sonnet', 10)
    const response = await this.anthropic.messages.create({
      model: this.sonnetModel,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    await this.trackInteraction(
      restaurantId,
      'sonnet',
      response.usage.input_tokens,
      response.usage.output_tokens,
      taskType,
    )
    return content
  }

  async classifyExpense(
    text: string,
    restaurantId: string,
  ): Promise<{ amount: number; category: string; description: string }> {
    const system = `Responde ÚNICAMENTE con JSON válido sin markdown. Extrae del texto el monto en pesos colombianos, la categoría y descripción del gasto.
Categorías disponibles: INGREDIENTS, RENT, UTILITIES, STAFF, EQUIPMENT, MARKETING, OTHER.
Formato: {"amount": number, "category": "CATEGORY", "description": "descripción corta"}`

    const result = await this.callHaiku(system, text, restaurantId, 'classify_expense')
    try {
      return JSON.parse(result)
    } catch {
      return { amount: 0, category: 'OTHER', description: text }
    }
  }

  async parseStockEntry(
    text: string,
    restaurantId: string,
  ): Promise<{ ingredientId: string; quantity: number }> {
    const ingredients = await this.prisma.ingredient.findMany({
      where: { restaurantId },
      select: { id: true, name: true, unit: true },
    })

    const system = `Responde ÚNICAMENTE con JSON válido sin markdown.
Ingredientes disponibles: ${JSON.stringify(ingredients)}
Del texto del dueño, identifica qué ingrediente compró y cuánto.
Formato: {"ingredientId": "uuid", "quantity": number}
Si no puedes identificar el ingrediente, usa el más parecido.`

    const result = await this.callHaiku(system, text, restaurantId, 'parse_stock')
    try {
      return JSON.parse(result)
    } catch {
      return { ingredientId: ingredients[0]?.id || '', quantity: 0 }
    }
  }

  async copilot(
    messages: { role: 'user' | 'assistant'; content: string }[],
    restaurantId: string,
  ): Promise<string> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })
    const system = `Eres Parce, el asistente inteligente del restaurante "${restaurant?.name}".
Hablas en colombiano informal, eres cálido, directo y siempre das respuestas cortas y accionables.
Tienes acceso a datos del negocio y puedes ayudar con preguntas sobre ventas, inventario, costos y estrategias.
Nunca uses jerga financiera compleja. Habla como un parce que conoce el negocio.
IMPORTANTE: No uses markdown. Nada de asteriscos, nada de guiones para listas, nada de almohadillas. Solo texto plano con saltos de línea cuando sea necesario.`

    return this.callSonnet(system, messages, restaurantId, 'copilot')
  }

  async advanceOnboarding(
    userMessage: string,
    restaurantId: string,
  ): Promise<{ message: string; step: string; isComplete: boolean }> {
    const session = await this.prisma.aiOnboardingSession.findUnique({
      where: { restaurantId },
    })
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { menuItems: { where: { isAvailable: true } } },
    })

    const messages: { role: 'user' | 'assistant'; content: string }[] =
      (session?.messages as any[]) || []
    messages.push({ role: 'user', content: userMessage })

    const pendingItems =
      restaurant?.menuItems.filter(
        (item) => messages.findIndex((m) => m.content.includes(item.name)) === -1,
      ) || []

    const system = `Eres Parce IA. Hablas en colombiano informal, eres cálido y directo.
Tu objetivo es ayudar al dueño a registrar las recetas de su restaurante para controlar el inventario.
Paso actual: ${session?.currentStep || 'GREETING'}
Platos pendientes de receta: ${pendingItems.map((i) => i.name).join(', ') || 'ninguno'}
Haz UNA pregunta a la vez. Respuestas cortas.
Si ya se configuraron todas las recetas, di que el onboarding está completo.
IMPORTANTE: No uses markdown. Nada de asteriscos, nada de guiones para listas, nada de almohadillas. Solo texto plano.`

    const reply = await this.callSonnet(system, messages, restaurantId, 'onboarding')
    messages.push({ role: 'assistant', content: reply })

    const isComplete =
      pendingItems.length === 0 ||
      reply.toLowerCase().includes('completo') ||
      reply.toLowerCase().includes('listo')

    const nextStep = isComplete ? 'COMPLETE' : session?.currentStep || 'RECIPE_LOOP'

    await this.prisma.aiOnboardingSession.update({
      where: { restaurantId },
      data: {
        messages: messages as any,
        currentStep: nextStep as any,
        completedAt: isComplete ? new Date() : null,
      },
    })

    if (isComplete) {
      await this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { onboardingStatus: 'COMPLETED' },
      })
    }

    return { message: reply, step: nextStep, isComplete }
  }

  async generateNightlySummary(restaurantId: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })
    if (!restaurant?.isActive) return

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const dayStart = new Date(todayStr)

    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: dayStart },
        payment: { status: 'APPROVED' },
      },
      include: { items: true },
    })

    const expenses = await this.prisma.expense.findMany({
      where: { restaurantId, date: { gte: dayStart } },
    })

    const revenue = orders.reduce((s, o) => s + Number(o.total), 0)
    const costs = orders.reduce((s, o) => s + Number(o.costTotal), 0)
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const netProfit = revenue - costs - totalExpenses

    const topItems = orders
      .flatMap((o) => o.items)
      .reduce(
        (acc: Record<string, number>, item) => {
          acc[item.menuItemName] = (acc[item.menuItemName] || 0) + item.quantity
          return acc
        },
        {},
      )

    const contextForAI = `
Resumen del día ${todayStr} para ${restaurant.name}:
- Pedidos: ${orders.length}
- Ingresos: $${revenue.toLocaleString('es-CO')}
- Costos de producción: $${costs.toLocaleString('es-CO')}
- Gastos del día: $${totalExpenses.toLocaleString('es-CO')}
- Ganancia neta: $${netProfit.toLocaleString('es-CO')}
- Producto más vendido: ${
      Object.entries(topItems).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ninguno'
    }
`

    const system = `Eres Parce IA. Genera un resumen nocturno para el dueño del restaurante.
Habla en colombiano informal, cálido y directo. Máximo 3 oraciones. Sin jerga financiera.
Comienza con "Buen día, parce." y termina con una recomendación concreta para mañana.`

    const summary = await this.callSonnet(
      system,
      [{ role: 'user', content: contextForAI }],
      restaurantId,
      'nightly_summary',
    )

    await this.prisma.aiSummary.upsert({
      where: { restaurantId_date: { restaurantId, date: new Date(todayStr) } },
      create: {
        restaurantId,
        date: new Date(todayStr),
        content: {
          revenue,
          costs,
          expenses: totalExpenses,
          netProfit,
          ordersCount: orders.length,
          topItems,
          message: summary,
        },
      },
      update: {
        content: {
          revenue,
          costs,
          expenses: totalExpenses,
          netProfit,
          ordersCount: orders.length,
          topItems,
          message: summary,
        },
      },
    })

    this.logger.log(`Resumen nocturno generado para ${restaurant.name}`)
  }

  private async checkRateLimit(
    restaurantId: string,
    model: 'haiku' | 'sonnet',
    max: number,
  ) {
    const today = new Date().toISOString().split('T')[0]
    const count = await this.prisma.aiInteraction.count({
      where: {
        restaurantId,
        model,
        createdAt: { gte: new Date(today) },
      },
    })
    if (count >= max) {
      throw new HttpException(
        'Parce, ya usaste el límite de consultas de IA por hoy. Mañana tienes más disponibles.',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }
  }

  private async trackInteraction(
    restaurantId: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    taskType: string,
  ) {
    const costUsd =
      model === 'haiku'
        ? inputTokens * 0.00000025 + outputTokens * 0.00000125
        : inputTokens * 0.000003 + outputTokens * 0.000015

    await this.prisma.aiInteraction.create({
      data: { restaurantId, model, inputTokens, outputTokens, costUsd, taskType },
    })
  }
}
