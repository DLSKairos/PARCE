import { IsString } from 'class-validator'

export class ExpenseTextDto {
  @IsString()
  text: string
}
