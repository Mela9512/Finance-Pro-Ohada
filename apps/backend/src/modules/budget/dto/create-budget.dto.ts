import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsString()
  accountCode: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  exercice: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  period?: number;

  @IsNumber()
  amountBudgeted: number;
}
