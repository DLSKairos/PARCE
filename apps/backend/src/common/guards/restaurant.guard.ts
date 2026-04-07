import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

/**
 * Verifica que el recurso solicitado pertenece al restaurante del usuario autenticado.
 * Compara el restaurantId del JWT con el del parámetro de ruta ':restaurantId'.
 */
@Injectable()
export class RestaurantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const paramRestaurantId = request.params?.restaurantId

    if (!paramRestaurantId) return true

    if (user?.restaurantId !== paramRestaurantId) {
      throw new ForbiddenException('No tienes acceso a este restaurante')
    }

    return true
  }
}
