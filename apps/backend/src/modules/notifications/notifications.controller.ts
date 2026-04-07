import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common'
import { IsString, IsOptional } from 'class-validator'
import { NotificationsService } from './notifications.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'

class SubscribeDto {
  @IsString()
  endpoint: string

  @IsString()
  p256dh: string

  @IsString()
  auth: string

  @IsOptional()
  @IsString()
  userAgent?: string
}

class UnsubscribeDto {
  @IsString()
  endpoint: string
}

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Post('subscribe')
  subscribe(@CurrentUser() user: JwtPayload, @Body() dto: SubscribeDto) {
    return this.service.subscribe(user.sub, dto)
  }

  @Delete('subscribe')
  unsubscribe(@CurrentUser() user: JwtPayload, @Body() dto: UnsubscribeDto) {
    return this.service.unsubscribe(user.sub, dto.endpoint)
  }
}
