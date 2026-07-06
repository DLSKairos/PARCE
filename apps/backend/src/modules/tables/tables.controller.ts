import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common'
import { TablesService } from './tables.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { GenerateTablesDto, CreateTableDto, UpdateTableDto } from './dto/table.dto'

@Controller()
export class TablesController {
  constructor(private service: TablesService) {}

  @Get('public/tables/:restaurantId')
  @Public()
  getPublicTables(@Param('restaurantId') restaurantId: string) {
    return this.service.getPublicTables(restaurantId)
  }

  @Get('tables')
  @UseGuards(JwtGuard)
  getTables(@CurrentUser() user: JwtPayload) {
    return this.service.getTables(user.restaurantId)
  }

  @Post('tables/generate')
  @UseGuards(JwtGuard)
  generateTables(@CurrentUser() user: JwtPayload, @Body() dto: GenerateTablesDto) {
    return this.service.generateTables(user.restaurantId, dto)
  }

  @Post('tables')
  @UseGuards(JwtGuard)
  createTable(@CurrentUser() user: JwtPayload, @Body() dto: CreateTableDto) {
    return this.service.createTable(user.restaurantId, dto)
  }

  @Patch('tables/:id')
  @UseGuards(JwtGuard)
  updateTable(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.service.updateTable(user.restaurantId, id, dto)
  }

  @Delete('tables/:id')
  @UseGuards(JwtGuard)
  deleteTable(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteTable(user.restaurantId, id)
  }
}
