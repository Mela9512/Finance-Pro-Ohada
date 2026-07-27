import { IsInt, IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateBusinessPlanDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  projectDescription: string;

  @IsNumber()
  @Min(0)
  investmentAmount: number;

  @IsInt()
  @Min(1)
  @Max(10)
  projectionYears: number;

  @IsNumber()
  @Min(0)
  year1Revenue: number;

  @IsNumber()
  @Min(-100)
  @Max(1000)
  revenueGrowthRatePercent: number;

  @IsNumber()
  @Min(0)
  @Max(99)
  variableCostPercent: number;

  @IsNumber()
  @Min(0)
  fixedCostsAnnual: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountRatePercent: number;
}
