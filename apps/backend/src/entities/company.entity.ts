import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Informations générales ────────────────────────────────────────────────
  @Column()
  name: string;

  @Column({ nullable: true })
  logo?: string; // Base64 ou URL du logo

  @Column({ nullable: true })
  language?: string; // 'fr', 'en', 'pt'

  @Column({ default: 'XAF' })
  currency: string; // XAF, XOF, EUR, USD

  @Column({ default: '' })
  country: string;

  // ─── Identification légale ─────────────────────────────────────────────────
  @Column({ nullable: true })
  legalName?: string; // Raison sociale complète

  @Column({ nullable: true })
  legalForm?: string; // SARL, SA, SNC...

  @Column({ unique: true, nullable: true })
  rccm?: string;

  @Column({ unique: true, nullable: true })
  nif?: string;

  @Column({ nullable: true })
  capital?: number; // Capital social

  @Column({ nullable: true })
  sector?: string; // Secteur d'activité

  @Column({ nullable: true })
  incorporationDate?: string; // Date de création

  // ─── Coordonnées ──────────────────────────────────────────────────────────
  @Column({ default: '' })
  address: string;

  @Column({ default: '' })
  city: string;

  @Column({ nullable: true })
  region?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  // ─── Paramètres comptables ────────────────────────────────────────────────
  @Column({ default: () => "to_char(now(), 'YYYY') || '-01-01'" })
  fiscalYearStart: string;

  @Column({ default: () => "to_char(now(), 'YYYY') || '-12-31'" })
  fiscalYearEnd: string;

  @Column({ nullable: true })
  fiscalYear?: number;

  @Column({ default: 6 })
  accountLength: number; // Longueur des comptes (6-8)

  @Column({ default: 2 })
  decimals: number; // Nombre de décimales

  @Column({ default: false })
  isExerciceClosed: boolean;

  // ─── Fiscalité ────────────────────────────────────────────────────────────
  @Column({ nullable: true })
  taxRegime?: string; // Réel Normal, Réel Simplifié...

  @Column({ nullable: true })
  taxCenter?: string; // Centre des impôts

  @Column({ nullable: true })
  taxNumber?: string; // Numéro contribuable

  @Column({ default: false })
  vatEnabled: boolean;

  @Column({ nullable: true, type: 'float' })
  vatRate?: number; // Ex: 18

  @Column({ default: false })
  withholdingTax: boolean; // Retenue à la source

  @Column({ default: false })
  corporateTax: boolean; // Impôt sur les sociétés

  // ─── Banque & Trésorerie ──────────────────────────────────────────────────
  @Column({ nullable: true })
  bankName?: string; // Banque principale

  @Column({ nullable: true })
  bankAccount?: string; // Numéro de compte

  @Column({ nullable: true })
  bankCode?: string; // Code banque

  @Column({ nullable: true })
  cashName?: string; // Nom de la caisse principale

  @Column({ type: 'simple-json', default: '[]' })
  paymentMethods: string[]; // Modes de paiement

  @Column({ nullable: true })
  bankCurrency?: string; // Devise du compte bancaire

  // ─── Organisation ─────────────────────────────────────────────────────────
  @Column({ type: 'simple-json', default: '[]' })
  departments: string[];

  @Column({ type: 'simple-json', default: '[]' })
  directions: string[];

  @Column({ type: 'simple-json', default: '[]' })
  branches: string[]; // Agences / Sites

  @Column({ type: 'simple-json', default: '[]' })
  costCenters: string[];

  @Column({ type: 'simple-json', default: '[]' })
  profitCenters: string[];

  @Column({ type: 'simple-json', default: '[]' })
  projects: string[];

  // ─── Modules activés ──────────────────────────────────────────────────────
  @Column({ type: 'simple-json', default: '["comptabilite","tresorerie","etats","dashboard"]' })
  enabledModules: string[];

  // ─── Statut ───────────────────────────────────────────────────────────────
  @Column({ default: false })
  isOnboarded: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
