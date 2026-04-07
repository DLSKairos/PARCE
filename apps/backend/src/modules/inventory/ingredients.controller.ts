import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { InventoryService } from './inventory.service'
import { CreateIngredientDto } from './dto/ingredient.dto'

@Controller('inventory/ingredients')
@UseGuards(JwtGuard)
export class IngredientsController {
  constructor(private service: InventoryService) {}

  @Get()
  getAll(@CurrentUser() user: JwtPayload) {
    return this.service.getIngredients(user.restaurantId)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateIngredientDto) {
    return this.service.createIngredient(user.restaurantId, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: Partial<CreateIngredientDto>,
  ) {
    return this.service.updateIngredient(user.restaurantId, id, dto)
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteIngredient(user.restaurantId, id)
  }
}
