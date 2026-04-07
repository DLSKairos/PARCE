import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'

@Controller()
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Post('public/orders')
  @Public()
  createOrder(@Body() dto: CreateOrderDto) {
    return this.service.createOrder(dto)
  }

  @Get('public/orders/:id')
  @Public()
  getPublicOrder(@Param('id') id: string, @Query('token') token: string) {
    return this.service.getPublicOrder(id, token)
  }

  @Get('orders')
  @UseGuards(JwtGuard)
  getOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.service.getOrders(user.restaurantId, status, date)
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtGuard)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.service.updateStatus(id, dto, user.restaurantId)
  }
}
