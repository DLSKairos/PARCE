import { Module } from '@nestjs/common'
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './modules/auth/auth.module'
import { RestaurantsModule } from './modules/restaurants/restaurants.module'
import { MenuModule } from './modules/menu/menu.module'
import { OrdersModule } from './modules/orders/orders.module'
import { InventoryModule } from './modules/inventory/inventory.module'
import { FinancesModule } from './modules/finances/finances.module'
import { PaymentsModule } from './modules/payments/payments.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { AIModule } from './modules/ai/ai.module'
import { StorageModule } from './modules/storage/storage.module'
import { HealthModule } from './modules/health/health.module'
import { JwtGuard } from './common/guards/jwt.guard'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL'),
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    RestaurantsModule,
    MenuModule,
    OrdersModule,
    InventoryModule,
    FinancesModule,
    PaymentsModule,
    NotificationsModule,
    AIModule,
    StorageModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
