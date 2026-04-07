import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { slug } })
    if (!restaurant) throw new NotFoundException(`Restaurante '${slug}' no encontrado`)
    return restaurant
  }

  async getPublicProfile(slug: string) {
    const r = await this.findBySlug(slug)
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      logoUrl: r.logoUrl,
      coverUrl: r.coverUrl,
      isOpen: r.isOpen,
      phone: r.phone,
      openHours: r.openHours,
    }
  }

  async getMyRestaurant(restaurantId: string) {
    return this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { restaurantPlan: true },
    })
  }

  async update(restaurantId: string, dto: UpdateRestaurantDto) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: dto,
    })
  }

  async toggleOpen(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado')
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isOpen: !restaurant.isOpen },
    })
  }
}
