import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { OrdersGateway } from './orders.gateway'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'stock-deduction' }),
    BullModule.registerQueue({ name: 'push-notifications' }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
