import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateImmobilisationDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsString()
  @MinLength(1)
  accountCode: string;

  @IsDateString()
  dateAcquisition: string;

  @IsDateString()
  dateMiseEnService: string;

  @IsNumber()
  @Min(0)
  valeurAcquisitionHT: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valeurResiduelle?: number;

  @IsInt()
  @Min(1)
  @Max(50)
  dureeAmortissementAns: number;
}
