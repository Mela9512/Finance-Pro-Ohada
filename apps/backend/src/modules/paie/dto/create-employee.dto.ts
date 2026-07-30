import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  nom: string;

  @IsString()
  @MinLength(1)
  poste: string;

  @IsDateString()
  dateEmbauche: string;

  @IsNumber()
  @Min(0)
  salaireBase: number;

  @IsOptional()
  @IsString()
  numeroCNSS?: string;
}
