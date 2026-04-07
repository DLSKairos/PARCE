import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateCategoryDto,
} from './dto/create-menu-item.dto'

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getPublicMenu(restaurantId: string) {
    const categories = await this.prisma.menuCategory.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { position: 'asc' },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            photoMediumUrl: true,
            photoThumbUrl: true,
            isAvailable: true,
          },
        },
      },
    })

    const uncategorized = await this.prisma.menuItem.findMany({
      where: { restaurantId, categoryId: null, isAvailable: true },
      orderBy: { position: 'asc' },
    })

    return { categories, uncategorized }
  }

  async getAllItems(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ categoryId: 'asc' }, { position: 'asc' }],
      include: { category: true },
    })
  }

  async createItem(restaurantId: string, dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: { ...dto, restaurantId },
    })
  }

  async updateItem(restaurantId: string, id: string, dto: UpdateMenuItemDto) {
    await this.findItemOrFail(restaurantId, id)
    return this.prisma.menuItem.update({ where: { id }, data: dto })
  }

  async toggleItem(restaurantId: string, id: string) {
    const item = await this.findItemOrFail(restaurantId, id)
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    })
  }

  async deleteItem(restaurantId: string, id: string) {
    await this.findItemOrFail(restaurantId, id)
    return this.prisma.menuItem.delete({ where: { id } })
  }

  async getCategories(restaurantId: string) {
    return this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { position: 'asc' },
    })
  }

  async createCategory(restaurantId: string, dto: CreateCategoryDto) {
    return this.prisma.menuCategory.create({ data: { ...dto, restaurantId } })
  }

  async deleteCategory(restaurantId: string, id: string) {
    const cat = await this.prisma.menuCategory.findFirst({ where: { id, restaurantId } })
    if (!cat) throw new NotFoundException('Categoría no encontrada')
    return this.prisma.menuCategory.delete({ where: { id } })
  }

  async updateItemPhotos(
    id: string,
    urls: { photoUrl: string; photoMediumUrl: string; photoThumbUrl: string },
  ) {
    return this.prisma.menuItem.update({ where: { id }, data: urls })
  }

  private async findItemOrFail(restaurantId: string, id: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id, restaurantId } })
    if (!item) throw new NotFoundException('Producto no encontrado')
    return item
  }
}
