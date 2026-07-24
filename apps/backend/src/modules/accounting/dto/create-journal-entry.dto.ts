import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class JournalLineDto {
  @IsString()
  accountCode: string;

  @IsString()
  accountLabel: string;

  @IsNumber()
  debit: number;

  @IsNumber()
  credit: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @IsString()
  date: string;

  @IsIn(['ACHATS', 'VENTES', 'BANQUE', 'CAISSE', 'OD'])
  journalType: 'ACHATS' | 'VENTES' | 'BANQUE' | 'CAISSE' | 'OD';

  @IsString()
  wording: string;

  @IsString()
  pieceNumber: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
