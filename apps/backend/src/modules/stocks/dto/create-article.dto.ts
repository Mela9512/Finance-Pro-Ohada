import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsString()
  @MinLength(1)
  unite: string;

  @IsString()
  @MinLength(1)
  accountCodeStock: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  seuilAlerte?: number;
}
