import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { FinancesService } from './finances.service'
import { AIService } from '../ai/ai.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { PlanGuard } from '../../common/guards/plan.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { ExpenseTextDto } from './dto/expense.dto'

@Controller('finances')
@UseGuards(JwtGuard)
export class FinancesController {
  constructor(
    private financesService: FinancesService,
    private aiService: AIService,
  ) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.financesService.getDashboard(user.restaurantId)
  }

  @Post('expenses')
  async createExpense(@CurrentUser() user: JwtPayload, @Body() dto: ExpenseTextDto) {
    const parsed = await this.aiService.classifyExpense(dto.text, user.restaurantId)
    return this.financesService.createExpense(user.restaurantId, { ...parsed, rawInput: dto.text })
  }

  @Get('expenses')
  getExpenses(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financesService.getExpenses(user.restaurantId, from, to)
  }

  @Get('reports')
  @UseGuards(PlanGuard)
  getReport(
    @CurrentUser() user: JwtPayload,
    @Query('period') period: 'week' | 'month' | 'quarter' = 'month',
  ) {
    return this.financesService.getReport(user.restaurantId, period)
  }
}
