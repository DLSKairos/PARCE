import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { Public } from '../../common/decorators/public.decorator'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @Public()
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    return this.authService.login(dto, res)
  }

  @Post('refresh')
  @Public()
  refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.cookies?.refresh_token
    if (!token) throw new UnauthorizedException('No hay sesión activa')

    // Decodificar el refresh token (UUID opaco) desde la cookie.
    // El userId se pasa como cookie separada establecida al hacer login,
    // o se puede inferir desde un JWT expirado adjunto en el header.
    // Para este MVP: el cliente debe enviar el accessToken expirado en Authorization.
    let userId: string | undefined

    const authHeader = req.headers?.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const expiredJwt = authHeader.slice(7)
        const payloadB64 = expiredJwt.split('.')[1]
        if (payloadB64) {
          const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
          userId = payload?.sub
        }
      } catch {
        // ignorar error de decode
      }
    }

    if (!userId) throw new UnauthorizedException('No se pudo identificar la sesión')
    return this.authService.refresh(userId, token, res)
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: any) {
    return this.authService.logout(user.sub, res)
  }
}
