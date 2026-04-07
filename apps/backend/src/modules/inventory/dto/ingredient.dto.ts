import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { IngredientUnit } from '@prisma/client'

export class CreateIngredientDto {
  @IsString()
  name: string

  @IsEnum(IngredientUnit)
  unit: IngredientUnit

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock: number

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPerUnit: number

  @IsOptional()
  expiresAt?: Date
}

export class StockEntryTextDto {
  @IsString()
  text: string
}
