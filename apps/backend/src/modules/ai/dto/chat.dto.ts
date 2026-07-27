import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentScreen?: string;
}
