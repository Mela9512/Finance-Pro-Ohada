import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class InvoiceItemDto {
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

export class CreateInvoiceDto {
  @IsIn(['VENTE', 'ACHAT', 'AVOIR'])
  type: 'VENTE' | 'ACHAT' | 'AVOIR';

  @IsString()
  tierId: string;

  @IsString()
  tierName: string;

  @IsString()
  date: string;

  @IsString()
  dueDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsNumber()
  subtotalHT: number;

  @IsNumber()
  totalTVA: number;

  @IsNumber()
  airRate: number;

  @IsNumber()
  totalAIR: number;

  @IsNumber()
  totalTTC: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
