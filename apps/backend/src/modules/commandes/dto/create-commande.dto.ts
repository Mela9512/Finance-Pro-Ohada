import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CommandeItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  tvaRate: number;

  @IsNumber()
  totalHT: number;

  @IsNumber()
  totalTVA: number;

  @IsNumber()
  totalTTC: number;

  @IsString()
  accountCode: string;
}

export class CreateCommandeDto {
  @IsIn(['VENTE', 'ACHAT'])
  type: 'VENTE' | 'ACHAT';

  @IsString()
  tierId: string;

  @IsString()
  tierName: string;

  @IsString()
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommandeItemDto)
  items: CommandeItemDto[];

  @IsNumber()
  subtotalHT: number;

  @IsNumber()
  totalTVA: number;

  @IsNumber()
  totalTTC: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
