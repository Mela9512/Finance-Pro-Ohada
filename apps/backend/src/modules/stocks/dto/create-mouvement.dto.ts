import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { StockMouvementType } from '../../../entities/stock-mouvement.entity';

export class CreateMouvementDto {
  @IsString()
  @MinLength(1)
  articleId: string;

  @IsDateString()
  date: string;

  @IsIn(['ENTREE', 'SORTIE'])
  type: StockMouvementType;

  @IsNumber()
  @Min(0.001)
  quantite: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coutUnitaire?: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
