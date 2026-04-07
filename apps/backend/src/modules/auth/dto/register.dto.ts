import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  @MaxLength(100)
  ownerName: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @MaxLength(100)
  restaurantName: string

  @IsString()
  @MaxLength(20)
  phone: string
}
