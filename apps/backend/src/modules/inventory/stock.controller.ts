import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { InventoryService } from './inventory.service'
import { AIService } from '../ai/ai.service'
import { StockEntryTextDto } from './dto/ingredient.dto'

@Controller('inventory/stock')
@UseGuards(JwtGuard)
export class StockController {
  constructor(
    private inventoryService: InventoryService,
    private aiService: AIService,
  ) {}

  @Get('movements')
  getMovements(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.getStockMovements(user.restaurantId)
  }

  @Get('alerts')
  getAlerts(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.getAlerts(user.restaurantId)
  }

  @Post('entry')
  async addEntry(@CurrentUser() user: JwtPayload, @Body() dto: StockEntryTextDto) {
    const parsed = await this.aiService.parseStockEntry(dto.text, user.restaurantId)
    return this.inventoryService.addStockEntry(
      user.restaurantId,
      parsed.ingredientId,
      parsed.quantity,
      dto.text,
    )
  }
}
