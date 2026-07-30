import { IsDateString, IsNumber, Min } from 'class-validator';

export class CessionImmobilisationDto {
  @IsDateString()
  dateCession: string;

  @IsNumber()
  @Min(0)
  valeurCession: number;
}
