import { Processor, Process } from '@nestjs/bull'
import { Job } from 'bull'
import { Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { InventoryService } from '../inventory.service'
import { PrismaService } from '../../../prisma/prisma.service'

@Processor('stock-deduction')
export class StockDeductionProcessor {
  private readonly logger = new Logger(StockDeductionProcessor.name)

  constructor(
    private inventoryService: InventoryService,
    private prisma: PrismaService,
    @InjectQueue('stock-alerts') private stockAlertsQueue: Queue,
  ) {}

  @Process()
  async handleStockDeduction(job: Job<{ orderId: string; restaurantId: string }>) {
    const { orderId, restaurantId } = job.data
    try {
      await this.inventoryService.deductStockForOrder(orderId)
      await this.stockAlertsQueue.add({ restaurantId })
      this.logger.log(`Stock descontado para pedido ${orderId}`)
    } catch (err) {
      this.logger.error(`Error descontando stock para pedido ${orderId}`, err)
      if (job.attemptsMade >= 2) {
        await this.prisma.aiAlert.create({
          data: {
            restaurantId,
            type: 'STOCK_DEDUCTION_FAILED',
            message: `No se pudo descontar el inventario para el pedido #${orderId}. Revísalo manualmente.`,
            relatedEntity: orderId,
          },
        })
      }
      throw err
    }
  }
}
