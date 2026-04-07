import { Module } from '@nestjs/common'
import { FinancesController } from './finances.controller'
import { FinancesService } from './finances.service'
import { AIModule } from '../ai/ai.module'

@Module({
  imports: [AIModule],
  controllers: [FinancesController],
  providers: [FinancesService],
  exports: [FinancesService],
})
export class FinancesModule {}
