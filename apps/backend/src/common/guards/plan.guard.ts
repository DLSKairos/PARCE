import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    if (!user?.restaurantId) return false

    const plan = await this.prisma.restaurantPlan.findUnique({
      where: { restaurantId: user.restaurantId },
    })

    if (!plan) {
      throw new HttpException(
        'No tienes un plan activo. Activa tu cuenta para continuar.',
        HttpStatus.PAYMENT_REQUIRED,
      )
    }

    const now = new Date()

    if (plan.status === 'TRIAL' && plan.trialEndsAt && plan.trialEndsAt > now) {
      return true
    }

    if (plan.status === 'ACTIVE' && plan.currentPeriodEnd && plan.currentPeriodEnd > now) {
      return true
    }

    throw new HttpException(
      'Tu período de prueba venció. Activa tu plan para continuar, parce.',
      HttpStatus.PAYMENT_REQUIRED,
    )
  }
}
