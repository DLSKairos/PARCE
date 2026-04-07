import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { IngredientsController } from './ingredients.controller'
import { RecipesController } from './recipes.controller'
import { StockController } from './stock.controller'
import { InventoryService } from './inventory.service'
import { StockDeductionProcessor } from './processors/stock-deduction.processor'
import { StockAlertsProcessor } from './processors/stock-alerts.processor'
import { AIModule } from '../ai/ai.module'

@Module({
  imports: [
    AIModule,
    BullModule.registerQueue({ name: 'stock-deduction' }),
    BullModule.registerQueue({ name: 'stock-alerts' }),
  ],
  controllers: [IngredientsController, RecipesController, StockController],
  providers: [InventoryService, StockDeductionProcessor, StockAlertsProcessor],
  exports: [InventoryService],
})
export class InventoryModule {}
