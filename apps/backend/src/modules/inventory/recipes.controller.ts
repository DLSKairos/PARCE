import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common'
import { IsArray, IsNumber, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { InventoryService } from './inventory.service'

class RecipeItemDto {
  @IsUUID()
  ingredientId: string

  @Type(() => Number)
  @IsNumber()
  quantity: number
}

class UpsertRecipeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  items: RecipeItemDto[]
}

@Controller('inventory/recipes')
@UseGuards(JwtGuard)
export class RecipesController {
  constructor(private service: InventoryService) {}

  @Get(':menuItemId')
  get(@CurrentUser() user: JwtPayload, @Param('menuItemId') id: string) {
    return this.service.getRecipe(user.restaurantId, id)
  }

  @Put(':menuItemId')
  upsert(
    @CurrentUser() user: JwtPayload,
    @Param('menuItemId') id: string,
    @Body() dto: UpsertRecipeDto,
  ) {
    return this.service.upsertRecipe(user.restaurantId, id, dto.items)
  }
}
