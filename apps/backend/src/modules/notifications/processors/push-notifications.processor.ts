import { Processor, Process } from '@nestjs/bull'
import { Job } from 'bull'
import { Logger } from '@nestjs/common'

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED: 'Tu pedido fue confirmado. Ya lo estamos preparando.',
  PREPARING: 'Tu pedido está en preparación.',
  READY: '¡Tu pedido está listo!',
  DELIVERED: '¡Pedido entregado! Buen provecho.',
  CANCELLED: 'Tu pedido fue cancelado.',
}

@Processor('push-notifications')
export class PushNotificationsProcessor {
  private readonly logger = new Logger(PushNotificationsProcessor.name)

  @Process('order-status-changed')
  async handleStatusChanged(
    job: Job<{ orderId: string; status: string; customerPhone: string }>,
  ) {
    const msg = STATUS_MESSAGES[job.data.status] || `Estado de tu pedido: ${job.data.status}`
    this.logger.log(`Push [${job.data.status}] pedido ${job.data.orderId}: ${msg}`)
    // Aquí se integraría WhatsApp Business API o similar para SMS/push al cliente
  }

  @Process('payment-confirmed')
  async handlePaymentConfirmed(job: Job<{ orderId: string; customerPhone: string }>) {
    this.logger.log(`Pago confirmado para pedido ${job.data.orderId}`)
  }
}
