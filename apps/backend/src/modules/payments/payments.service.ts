import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { createHmac } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private prisma: PrismaService,
    @InjectQueue('stock-deduction') private stockQueue: Queue,
    @InjectQueue('push-notifications') private pushQueue: Queue,
  ) {}

  async handleWompiWebhook(payload: any, rawBody: string, signature: string) {
    const secret = process.env.WOMPI_WEBHOOK_SECRET || ''
    if (secret) {
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
      if (expected !== signature) {
        throw new BadRequestException('Firma inválida')
      }
    }

    const transaction = payload?.data?.transaction
    if (!transaction) return { received: true }

    const externalId = transaction.id

    // Idempotencia: si ya procesamos esta transacción aprobada, no duplicar
    const existing = await this.prisma.payment.findUnique({ where: { externalId } })
    if (existing?.status === 'APPROVED') return { received: true }

    const reference = transaction.reference
    const payment = await this.prisma.payment.findFirst({ where: { orderId: reference } })
    if (!payment) return { received: true }

    const statusMap: Record<string, string> = {
      APPROVED: 'APPROVED',
      DECLINED: 'DECLINED',
      VOIDED: 'VOIDED',
    }
    const prismaStatus = statusMap[transaction.status] || 'PENDING'

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: prismaStatus as any,
        externalId,
        paidAt: prismaStatus === 'APPROVED' ? new Date() : null,
        rawWebhook: payload,
      },
    })

    if (prismaStatus === 'APPROVED') {
      const order = await this.prisma.order.update({
        where: { id: reference },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      })

      await Promise.all([
        this.stockQueue.add(
          { orderId: reference, restaurantId: order.restaurantId },
          { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
        ),
        this.pushQueue.add('payment-confirmed', {
          orderId: reference,
          customerPhone: order.customerPhone,
        }),
      ])

      this.logger.log(`Pago aprobado para pedido ${reference}`)
    }

    return { received: true }
  }
}
