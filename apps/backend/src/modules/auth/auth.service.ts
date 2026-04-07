import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { addDays } from 'date-fns'
import { PrismaService } from '../../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { generateSlug } from '../../common/utils/slug.util'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Este correo ya está registrado')

    let slug = generateSlug(dto.restaurantName)
    const slugExists = await this.prisma.restaurant.findUnique({ where: { slug } })
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const restaurant = await this.prisma.restaurant.create({
      data: {
        slug,
        name: dto.restaurantName,
        phone: dto.phone,
        isActive: true,
        isOpen: false,
      },
    })

    // Crear plan trial PRO por 30 días
    await this.prisma.restaurantPlan.create({
      data: {
        restaurantId: restaurant.id,
        plan: 'PRO',
        status: 'TRIAL',
        trialEndsAt: addDays(new Date(), 30),
      },
    })

    // Crear secuencia de pedidos
    await this.prisma.restaurantOrderSequence.create({
      data: { restaurantId: restaurant.id, lastOrderNumber: 0 },
    })

    // Crear sesión de onboarding IA
    await this.prisma.aiOnboardingSession.create({
      data: {
        restaurantId: restaurant.id,
        currentStep: 'GREETING',
        messages: [],
      },
    })

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.ownerName,
        restaurantId: restaurant.id,
        role: 'OWNER',
      },
    })

    const tokens = await this.generateTokens(user.id, user.email, restaurant.id)
    return {
      user: { id: user.id, email: user.email, name: user.name },
      restaurant,
      ...tokens,
    }
  }

  async login(dto: LoginDto, res: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { restaurant: true },
    })
    if (!user) throw new UnauthorizedException('Credenciales incorrectas')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas')

    const tokens = await this.generateTokens(user.id, user.email, user.restaurantId)

    const refreshHash = await bcrypt.hash(tokens.refreshToken, 8)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    })

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        restaurantId: user.restaurantId,
      },
      restaurant: {
        id: user.restaurant.id,
        name: user.restaurant.name,
        slug: user.restaurant.slug,
      },
    }
  }

  async refresh(userId: string, refreshToken: string, res: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user?.refreshTokenHash) throw new UnauthorizedException()

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash)
    if (!valid) {
      // Posible robo de token — limpiar
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      })
      res.clearCookie('refresh_token')
      throw new UnauthorizedException('Sesión inválida. Inicia sesión de nuevo.')
    }

    const tokens = await this.generateTokens(user.id, user.email, user.restaurantId)
    const newHash = await bcrypt.hash(tokens.refreshToken, 8)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newHash },
    })

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })

    return { accessToken: tokens.accessToken }
  }

  async logout(userId: string, res: any) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    })
    res.clearCookie('refresh_token', { path: '/api/v1/auth' })
    return { message: 'Sesión cerrada' }
  }

  private async generateTokens(userId: string, email: string, restaurantId: string) {
    const accessToken = this.jwt.sign({ sub: userId, email, restaurantId, role: 'OWNER' })
    const refreshToken = randomUUID()
    return { accessToken, refreshToken }
  }
}
