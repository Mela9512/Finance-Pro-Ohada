import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTreasuryTransactionDto {
  @IsString()
  treasuryAccountId: string;

  @IsString()
  treasuryAccountName: string;

  @IsString()
  date: string;

  @IsIn(['ENCAISSEMENT', 'DECAISSEMENT', 'VIREMENT_INTERNE'])
  type: 'ENCAISSEMENT' | 'DECAISSEMENT' | 'VIREMENT_INTERNE';

  @IsString()
  category: string;

  @IsNumber()
  amount: number;

  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  tierName?: string;

  @IsString()
  description: string;
}
