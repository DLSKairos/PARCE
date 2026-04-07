import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common'
import { RestaurantsService } from './restaurants.service'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'

@Controller()
export class RestaurantsController {
  constructor(private service: RestaurantsService) {}

  @Get('public/restaurants/:slug')
  @Public()
  getPublicProfile(@Param('slug') slug: string) {
    return this.service.getPublicProfile(slug)
  }

  @Get('restaurants/me')
  @UseGuards(JwtGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.service.getMyRestaurant(user.restaurantId)
  }

  @Patch('restaurants/me')
  @UseGuards(JwtGuard)
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateRestaurantDto) {
    return this.service.update(user.restaurantId, dto)
  }

  @Post('restaurants/me/open')
  @UseGuards(JwtGuard)
  toggleOpen(@CurrentUser() user: JwtPayload) {
    return this.service.toggleOpen(user.restaurantId)
  }
}
