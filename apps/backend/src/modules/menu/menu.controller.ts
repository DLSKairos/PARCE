import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { MenuService } from './menu.service'
import { StorageService } from '../storage/storage.service'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateCategoryDto,
} from './dto/create-menu-item.dto'

@Controller()
export class MenuController {
  constructor(
    private menuService: MenuService,
    private storageService: StorageService,
  ) {}

  @Get('public/menu/:restaurantId')
  @Public()
  getPublicMenu(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getPublicMenu(restaurantId)
  }

  @Get('menu')
  @UseGuards(JwtGuard)
  getAll(@CurrentUser() user: JwtPayload) {
    return this.menuService.getAllItems(user.restaurantId)
  }

  @Post('menu/items')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createItem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const item = await this.menuService.createItem(user.restaurantId, dto)
    if (file) {
      const urls = await this.storageService.uploadMenuItemPhoto(file.buffer, item.id)
      await this.menuService.updateItemPhotos(item.id, urls)
      return { ...item, ...urls }
    }
    return item
  }

  @Patch('menu/items/:id')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async updateItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const item = await this.menuService.updateItem(user.restaurantId, id, dto)
    if (file) {
      const urls = await this.storageService.uploadMenuItemPhoto(file.buffer, id)
      return this.menuService.updateItemPhotos(id, urls)
    }
    return item
  }

  @Patch('menu/items/:id/toggle')
  @UseGuards(JwtGuard)
  toggleItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.toggleItem(user.restaurantId, id)
  }

  @Delete('menu/items/:id')
  @UseGuards(JwtGuard)
  deleteItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.deleteItem(user.restaurantId, id)
  }

  @Get('menu/categories')
  @UseGuards(JwtGuard)
  getCategories(@CurrentUser() user: JwtPayload) {
    return this.menuService.getCategories(user.restaurantId)
  }

  @Post('menu/categories')
  @UseGuards(JwtGuard)
  createCategory(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(user.restaurantId, dto)
  }

  @Delete('menu/categories/:id')
  @UseGuards(JwtGuard)
  deleteCategory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.menuService.deleteCategory(user.restaurantId, id)
  }
}
