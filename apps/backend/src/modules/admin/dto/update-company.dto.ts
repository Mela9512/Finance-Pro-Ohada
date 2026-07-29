import { IsOptional, IsString, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCompanyDto {
  // ─── Informations générales ────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  country?: string;

  // ─── Identification légale ─────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  legalForm?: string;

  @IsOptional()
  @IsString()
  rccm?: string;

  @IsOptional()
  @IsString()
  nif?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  capital?: number;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  incorporationDate?: string;

  // ─── Coordonnées ──────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  // ─── Paramètres comptables ────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  fiscalYearStart?: string;

  @IsOptional()
  @IsString()
  fiscalYearEnd?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fiscalYear?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accountLength?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  decimals?: number;

  // ─── Fiscalité ────────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  taxRegime?: string;

  @IsOptional()
  @IsString()
  taxCenter?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsBoolean()
  vatEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  vatRate?: number;

  @IsOptional()
  @IsBoolean()
  withholdingTax?: boolean;

  @IsOptional()
  @IsBoolean()
  corporateTax?: boolean;

  // ─── Banque & Trésorerie ──────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  bankCode?: string;

  @IsOptional()
  @IsString()
  cashName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @IsOptional()
  @IsString()
  bankCurrency?: string;

  // ─── Organisation ─────────────────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departments?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  directions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branches?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  costCenters?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  profitCenters?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  projects?: string[];

  // ─── Modules ──────────────────────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledModules?: string[];
}
