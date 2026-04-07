import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { AIService } from './ai.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { PlanGuard } from '../../common/guards/plan.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { CopilotDto, OnboardingMessageDto } from './dto/copilot.dto'
import { PrismaService } from '../../prisma/prisma.service'

@Controller('ai')
@UseGuards(JwtGuard)
export class AIController {
  constructor(private aiService: AIService, private prisma: PrismaService) {}

  @Post('copilot')
  @UseGuards(PlanGuard)
  async copilot(@CurrentUser() user: JwtPayload, @Body() dto: CopilotDto) {
    const message = await this.aiService.copilot(dto.messages, user.restaurantId)
    return { message }
  }

  @Get('onboarding/session')
  getSession(@CurrentUser() user: JwtPayload) {
    return this.prisma.aiOnboardingSession.findUnique({
      where: { restaurantId: user.restaurantId },
    })
  }

  @Post('onboarding/message')
  advanceOnboarding(@CurrentUser() user: JwtPayload, @Body() dto: OnboardingMessageDto) {
    return this.aiService.advanceOnboarding(dto.message, user.restaurantId)
  }

  @Get('alerts')
  getAlerts(@CurrentUser() user: JwtPayload) {
    return this.prisma.aiAlert.findMany({
      where: { restaurantId: user.restaurantId, isRead: false },
      orderBy: { createdAt: 'desc' },
    })
  }

  @Get('summaries/latest')
  getLatestSummary(@CurrentUser() user: JwtPayload) {
    return this.prisma.aiSummary.findFirst({
      where: { restaurantId: user.restaurantId },
      orderBy: { date: 'desc' },
    })
  }
}
