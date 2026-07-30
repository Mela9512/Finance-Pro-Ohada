import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBulletinDto {
  @IsString()
  employeeId: string;

  @IsInt()
  @Min(2020)
  periodYear: number;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  primesImposables?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  primesNonImposables?: number;
}
