import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateMenuItemDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number

  @IsOptional()
  @IsUUID()
  categoryId?: string

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  position?: number
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsUUID()
  categoryId?: string

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  position?: number
}

export class CreateCategoryDto {
  @IsString()
  name: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  position?: number
}
