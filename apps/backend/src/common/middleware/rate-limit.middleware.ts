import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common'

// Implementación manual de rate limiting con sliding window counter en memoria.
// Para producción con múltiples instancias se debe migrar a Redis.
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limits: Record<string, { max: number; windowMs: number }> = {
    '/api/v1/public/orders': { max: 20, windowMs: 10 * 60 * 1000 },
    '/api/v1/auth/login': { max: 5, windowMs: 15 * 60 * 1000 },
    '/api/v1/auth/register': { max: 3, windowMs: 60 * 60 * 1000 },
  }

  use(req: any, res: any, next: any) {
    const path = req.path
    const limit = this.limits[path]
    if (!limit) return next()

    const ip = req.ip || req.connection?.remoteAddress || 'unknown'
    const key = `${ip}:${path}`
    const now = Date.now()
    const entry = inMemoryStore.get(key)

    if (!entry || now > entry.resetAt) {
      inMemoryStore.set(key, { count: 1, resetAt: now + limit.windowMs })
      return next()
    }

    if (entry.count >= limit.max) {
      throw new HttpException(
        'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    entry.count++
    next()
  }
}
