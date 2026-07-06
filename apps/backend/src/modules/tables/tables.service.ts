import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { GenerateTablesDto, CreateTableDto, UpdateTableDto } from './dto/table.dto'

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  getTables(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { position: 'asc' },
    })
  }

  getPublicTables(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { position: 'asc' },
      select: { id: true, name: true, position: true },
    })
  }

  async generateTables(restaurantId: string, dto: GenerateTablesDto) {
    const last = await this.prisma.table.findFirst({
      where: { restaurantId },
      orderBy: { position: 'desc' },
    })
    const startPosition = (last?.position ?? 0) + 1

    await this.prisma.table.createMany({
      data: Array.from({ length: dto.count }, (_, i) => ({
        restaurantId,
        name: `Mesa ${startPosition + i}`,
        position: startPosition + i,
      })),
    })
    return this.getTables(restaurantId)
  }

  async createTable(restaurantId: string, dto: CreateTableDto) {
    const last = await this.prisma.table.findFirst({
      where: { restaurantId },
      orderBy: { position: 'desc' },
    })
    return this.prisma.table.create({
      data: {
        restaurantId,
        name: dto.name,
        position: (last?.position ?? 0) + 1,
      },
    })
  }

  async updateTable(restaurantId: string, tableId: string, dto: UpdateTableDto) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
    })
    if (!table) throw new NotFoundException('Mesa no encontrada')
    return this.prisma.table.update({ where: { id: tableId }, data: dto })
  }

  async deleteTable(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
    })
    if (!table) throw new NotFoundException('Mesa no encontrada')
    await this.prisma.table.delete({ where: { id: tableId } })
    return { deleted: true }
  }
}
