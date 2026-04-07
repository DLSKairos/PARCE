import { IsString, IsArray, IsEnum, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class MessageDto {
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant'

  @IsString()
  content: string
}

export class CopilotDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[]
}

export class OnboardingMessageDto {
  @IsString()
  message: string
}
