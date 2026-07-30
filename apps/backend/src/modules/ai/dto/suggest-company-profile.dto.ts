import { ArrayNotEmpty, IsArray, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ModuleOptionDto {
  @IsString()
  @MinLength(1)
  id: string;

  @IsString()
  @MinLength(1)
  label: string;
}

export class SuggestCompanyProfileDto {
  @IsString()
  @MinLength(1)
  companyName: string;

  @IsString()
  @MinLength(1)
  sector: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  legalFormOptions: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  taxRegimeOptions: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ModuleOptionDto)
  moduleOptions: ModuleOptionDto[];
}
