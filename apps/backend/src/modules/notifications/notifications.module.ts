import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { PushNotificationsProcessor } from './processors/push-notifications.processor'

@Module({
  imports: [BullModule.registerQueue({ name: 'push-notifications' })],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushNotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
