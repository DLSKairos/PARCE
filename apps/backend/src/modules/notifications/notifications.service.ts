import { Injectable, Logger } from '@nestjs/common'
import * as webpush from 'web-push'
import { PrismaService } from '../../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private prisma: PrismaService, private config: ConfigService) {
    const email = config.get('VAPID_EMAIL')
    const pub = config.get('VAPID_PUBLIC_KEY')
    const priv = config.get('VAPID_PRIVATE_KEY')
    if (email && pub && priv) {
      webpush.setVapidDetails(email, pub, priv)
    }
  }

  async subscribe(
    userId: string,
    sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string },
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      create: { userId, ...sub },
      update: { userId },
    })
  }

  async unsubscribe(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } })
  }

  async sendToUser(userId: string, payload: { title: string; body: string; url?: string }) {
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } })
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
      } catch (err: any) {
        if (err.statusCode === 410) {
          // Suscripción expirada — eliminar
          await this.prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
        } else {
          this.logger.warn(`Error enviando push a ${sub.endpoint}: ${err}`)
        }
      }
    }
  }
}
