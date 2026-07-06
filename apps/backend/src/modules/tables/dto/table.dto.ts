import { IsString, IsInt, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator'

export class GenerateTablesDto {
  @IsInt()
  @Min(1)
  @Max(100)
  count: number
}

export class CreateTableDto {
  @IsString()
  @MaxLength(50)
  name: string
}

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number
}
