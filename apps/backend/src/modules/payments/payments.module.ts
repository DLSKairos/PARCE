import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { PaymentsController } from './payments.controller'
import { PaymentsService } from './payments.service'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'stock-deduction' }),
    BullModule.registerQueue({ name: 'push-notifications' }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
