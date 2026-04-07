import { Processor, Process } from '@nestjs/bull'
import { Job } from 'bull'
import { InventoryService } from '../inventory.service'

@Processor('stock-alerts')
export class StockAlertsProcessor {
  constructor(private inventoryService: InventoryService) {}

  @Process()
  async handle(job: Job<{ restaurantId: string }>) {
    await this.inventoryService.checkAlerts(job.data.restaurantId)
  }
}
