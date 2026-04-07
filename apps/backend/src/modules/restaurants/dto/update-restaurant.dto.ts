import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator'

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean

  @IsOptional()
  openHours?: Record<string, { open: string; close: string }>
}
