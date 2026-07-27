import { IsString, MinLength } from 'class-validator';

export class ImportBankStatementDto {
  @IsString()
  @MinLength(1)
  csvContent: string;
}
