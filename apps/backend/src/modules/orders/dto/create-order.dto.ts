import {
  IsString,
  IsEnum,
  IsArray,
  IsUUID,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { OrderType, PaymentMethod } from '@prisma/client'

export class OrderItemDto {
  @IsUUID()
  menuItemId: string

  @IsInt()
  @Min(1)
  quantity: number
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string

  @IsEnum(OrderType)
  orderType: OrderType

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]

  @IsString()
  customerName: string

  @IsString()
  customerPhone: string

  @IsOptional()
  @IsString()
  customerAddress?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod
}
