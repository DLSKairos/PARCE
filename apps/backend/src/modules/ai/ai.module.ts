import { Module } from '@nestjs/common'
import { AIController } from './ai.controller'
import { AIService } from './ai.service'
import { NightlySummaryJob } from './jobs/nightly-summary.job'

@Module({
  controllers: [AIController],
  providers: [AIService, NightlySummaryJob],
  exports: [AIService],
})
export class AIModule {}
