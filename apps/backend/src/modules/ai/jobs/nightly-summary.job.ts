import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { AIService } from '../ai.service'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class NightlySummaryJob {
  private readonly logger = new Logger(NightlySummaryJob.name)

  constructor(private aiService: AIService, private prisma: PrismaService) {}

  @Cron('0 22 * * *', { timeZone: 'America/Bogota' })
  async generateSummaries() {
    this.logger.log('Iniciando generación de resúmenes nocturnos...')
    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    for (const restaurant of restaurants) {
      try {
        await this.aiService.generateNightlySummary(restaurant.id)
      } catch (err) {
        this.logger.error(`Error generando resumen para ${restaurant.id}:`, err)
      }
    }
    this.logger.log(`Resúmenes generados para ${restaurants.length} restaurantes`)
  }
}
